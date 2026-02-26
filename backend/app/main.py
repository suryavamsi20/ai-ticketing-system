import re
import os
import json
import secrets
import string
import hashlib
from datetime import datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth import create_access_token, decode_access_token, hash_password, verify_password
from .database import SessionLocal, engine
from .model_loader import cat_model, priority_model, tfidf_cat, tfidf_pr
from .models import Base, Ticket, User
from .schemas import (
    AdminSignup,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    UserCreate,
    UserLogin,
    UserResponse,
)

Base.metadata.create_all(bind=engine)


def ensure_sqlite_compat_schema():
    """Handle lightweight schema drift for local SQLite without full migrations."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "tickets" not in table_names and "users" not in table_names:
        return

    with engine.begin() as conn:
        if "tickets" in table_names:
            ticket_cols = {col["name"] for col in inspector.get_columns("tickets")}
            if "user_id" not in ticket_cols:
                conn.execute(text("ALTER TABLE tickets ADD COLUMN user_id INTEGER"))
            if "admin_comment" not in ticket_cols:
                conn.execute(text("ALTER TABLE tickets ADD COLUMN admin_comment TEXT"))

        if "users" in table_names:
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            if "google_sub" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_sub TEXT"))
            if "reset_token_hash" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_hash TEXT"))
            if "reset_token_expires_at" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME"))


ensure_sqlite_compat_schema()

app = FastAPI()
security = HTTPBearer()
ADMIN_SIGNUP_CODE = os.getenv("ADMIN_SIGNUP_CODE", "ADMIN123")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
PASSWORD_MIN_LENGTH = 10
RESET_TOKEN_MINUTES = 30

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def clean_text(text: str):
    text = text.lower()
    return re.sub(r"[^a-z\s]", "", text)


def validate_password_strength(password: str):
    checks = {
        "length": len(password) >= PASSWORD_MIN_LENGTH,
        "upper": bool(re.search(r"[A-Z]", password)),
        "lower": bool(re.search(r"[a-z]", password)),
        "digit": bool(re.search(r"\d", password)),
        "special": bool(re.search(r"[^A-Za-z0-9]", password)),
    }
    if all(checks.values()):
        return

    missing = []
    if not checks["length"]:
        missing.append(f"at least {PASSWORD_MIN_LENGTH} characters")
    if not checks["upper"]:
        missing.append("an uppercase letter")
    if not checks["lower"]:
        missing.append("a lowercase letter")
    if not checks["digit"]:
        missing.append("a digit")
    if not checks["special"]:
        missing.append("a special character")

    raise HTTPException(
        status_code=400,
        detail=f"Weak password. Include {', '.join(missing)}.",
    )


def make_username_from_email(email: str) -> str:
    local = email.split("@", 1)[0].strip().lower()
    clean_local = re.sub(r"[^a-z0-9_.-]", "", local) or "user"
    return clean_local[:30]


def generate_random_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


def verify_google_id_token(id_token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID is not configured on the server.",
        )

    query = urlencode({"id_token": id_token})
    url = f"https://oauth2.googleapis.com/tokeninfo?{query}"
    try:
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Invalid Google token")

    if payload.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google token audience mismatch")

    exp_raw = payload.get("exp", "0")
    try:
        exp = int(exp_raw)
    except ValueError:
        exp = 0

    if exp <= int(datetime.utcnow().timestamp()):
        raise HTTPException(status_code=400, detail="Google token expired")

    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email missing")

    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# ----------------- AUTH -----------------

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    user_email = user.email.strip().lower()
    existing = db.query(User).filter((User.email == user_email) | (User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with same email or username already exists")

    validate_password_strength(user.password)
    hashed = hash_password(user.password)
    new_user = User(username=user.username, email=user_email, password=hashed)
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User with same email or username already exists")
    db.refresh(new_user)
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
        },
    }


@app.post("/admin/signup")
def admin_signup(payload: AdminSignup, db: Session = Depends(get_db)):
    if payload.admin_code != ADMIN_SIGNUP_CODE:
        raise HTTPException(status_code=403, detail="Invalid admin signup code")

    admin_email = payload.email.strip().lower()
    existing = db.query(User).filter((User.email == admin_email) | (User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with same email or username already exists")

    validate_password_strength(payload.password)
    hashed = hash_password(payload.password)
    new_admin = User(
        username=payload.username,
        email=admin_email,
        password=hashed,
        role="admin",
    )
    db.add(new_admin)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User with same email or username already exists")
    db.refresh(new_admin)

    return {
        "message": "Admin created successfully",
        "user": {
            "id": new_admin.id,
            "username": new_admin.username,
            "email": new_admin.email,
            "role": new_admin.role,
        },
    }


@app.post("/login", response_model=LoginResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email.strip().lower()).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer", "user": db_user}


@app.post("/auth/google-login", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    token_payload = verify_google_id_token(payload.id_token)
    email = token_payload.get("email", "").strip().lower()
    google_sub = token_payload.get("sub")

    db_user = db.query(User).filter(User.email == email).first()
    if payload.as_admin:
        if not db_user or db_user.role != "admin":
            raise HTTPException(status_code=403, detail="This Google account is not mapped to an admin user.")
    elif not db_user:
        base_username = make_username_from_email(email)
        username = base_username
        suffix = 1
        while db.query(User).filter(User.username == username).first():
            suffix += 1
            username = f"{base_username}{suffix}"

        db_user = User(
            username=username,
            email=email,
            password=hash_password(generate_random_password()),
            role="user",
            google_sub=google_sub,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    if db_user.google_sub != google_sub:
        db_user.google_sub = google_sub
        db.commit()
        db.refresh(db_user)

    token = create_access_token({"sub": db_user.email, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer", "user": db_user}


@app.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user:
        raw_token = secrets.token_urlsafe(32)
        user.reset_token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_MINUTES)
        db.commit()
        return {
            "message": "If the account exists, a reset link has been generated.",
            "reset_token_for_dev": raw_token,
            "expires_in_minutes": RESET_TOKEN_MINUTES,
        }

    return {"message": "If the account exists, a reset link has been generated."}


@app.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    validate_password_strength(payload.new_password)

    token_hash = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user.password = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()
    return {"message": "Password has been reset successfully."}


@app.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# ----------------- AI TICKET -----------------

@app.post("/predict-ticket", response_model=TicketResponse)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleaned = clean_text(ticket.text)

    cat_vector = tfidf_cat.transform([cleaned])
    pr_vector = tfidf_pr.transform([cleaned])

    category = cat_model.predict(cat_vector)[0]
    priority = priority_model.predict(pr_vector)[0]

    new_ticket = Ticket(
        title=f"{category}: {ticket.text[:40]}",
        description=ticket.text,
        category=category,
        priority=priority,
        user_id=current_user.id,
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


@app.get("/tickets", response_model=list[TicketResponse])
def get_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        return db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


def require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@app.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    next_status = payload.status.strip().lower()
    allowed_statuses = {"open": "Open", "in progress": "In Progress", "resolved": "Resolved"}
    if next_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status value")

    ticket.status = allowed_statuses[next_status]
    ticket.admin_comment = (payload.comment or "").strip() or None
    db.commit()
    db.refresh(ticket)
    return ticket


@app.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted successfully"}
