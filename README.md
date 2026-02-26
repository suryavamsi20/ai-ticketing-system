# AI Ticketing System

AI-powered helpdesk application that predicts ticket **category** and **priority** from user text, then manages the full ticket lifecycle with user/admin workflows.

## Project Overview

This project combines:
- **Machine Learning pipeline** for text classification (category + priority)
- **FastAPI backend** for authentication, prediction, and ticket APIs
- **React frontend** for user and admin dashboards
- **SQLite storage** for users and tickets

Users can create tickets in plain language; the system auto-labels them and stores them for tracking. Admins can review, update status, comment, and delete tickets.

## Architecture

- `frontend/` React app (routing, auth UI, ticket pages, admin dashboard)
- `backend/` FastAPI app (JWT auth, Google login, ticket APIs, model inference)
- `models/` serialized ML artifacts (`.pkl`)
- `notebooks/` EDA, preprocessing, and model training notebooks
- `dataset/` raw and processed data used for training

## ML Models Used

### 1) Category Prediction Model
- **Vectorizer:** `TfidfVectorizer`
- **Classifier:** `LinearSVC(class_weight='balanced')`
- **Saved files:**
  - `models/tfidf_category.pkl`
  - `models/category_model.pkl`

### 2) Priority Prediction Model
- **Vectorizer:** `TfidfVectorizer`
- **Classifier:** `LinearSVC(class_weight='balanced')`
- **Saved files:**
  - `models/tfidf_priority.pkl`
  - `models/priority_model.pkl`

## Why This Model (TF-IDF + LinearSVC)

This combination was chosen because it is strong for short/medium support text classification:
- **High performance on sparse text features:** TF-IDF creates high-dimensional sparse vectors where linear SVMs are effective.
- **Fast training and inference:** important for API response time and retraining iterations.
- **Handles class imbalance better with `class_weight='balanced'`:** useful for uneven ticket distributions.
- **Simple and stable baseline:** easier to deploy and maintain than heavier deep-learning models for this use case.

## Training and Preprocessing Summary

Based on notebooks in `notebooks/`:
- Text normalization (lowercasing, regex cleaning, whitespace normalization)
- Stopword removal (`nltk.stopwords`)
- Lemmatization (`WordNetLemmatizer`)
- Train/test split with `test_size=0.2`, `random_state=42`, stratified labels
- TF-IDF settings:
  - Category: `max_features=20000`, `ngram_range=(1,3)`, `min_df=3`, `max_df=0.9`
  - Priority: `max_features=20000`, `ngram_range=(1,2)`, `min_df=2`, `max_df=0.9`
- Classifier for both tasks: `LinearSVC(class_weight='balanced')`

Reported notebook accuracy snapshots:
- Category model: ~`0.86`
- Priority model: ~`0.694`

## Backend Tech Stack

- **Framework:** FastAPI
- **Server:** Uvicorn
- **ORM/DB:** SQLAlchemy + SQLite (`backend/tickets.db`)
- **Auth:** JWT (`python-jose`) + password hashing (`passlib`)
- **ML inference:** scikit-learn + joblib model loading
- **CORS:** enabled for local frontend origins

### Main Backend APIs

- `POST /signup`
- `POST /admin/signup`
- `POST /login`
- `POST /auth/google-login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`
- `POST /predict-ticket`
- `GET /tickets`
- `PATCH /tickets/{ticket_id}`
- `DELETE /tickets/{ticket_id}`

## Frontend Tech Stack

- **Library:** React (Create React App)
- **Routing:** `react-router-dom`
- **HTTP client:** Axios
- **Auth state:** React Context (`AuthContext`)
- **UI pages:** landing, login/signup, dashboard, create ticket, history, profile/settings, admin dashboard
- **Google Sign-In:** Google Identity Services script + `REACT_APP_GOOGLE_CLIENT_ID`

## Setup Instructions

## 1) Clone and install

```bash
git clone <your-repo-url>
cd ai-ticketing-system
```

### Backend setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## 2) Environment Variables

Backend (`backend/.env` or system env):
- `SECRET_KEY` (JWT signing key)
- `ADMIN_SIGNUP_CODE` (admin registration gate)
- `GOOGLE_CLIENT_ID` (for backend Google token verification)

Frontend (`frontend/.env`):
- `REACT_APP_GOOGLE_CLIENT_ID` (Google Sign-In button)

## Model Loading in Runtime

Backend loads models from `models/` at startup via:
- `backend/app/model_loader.py`

Loaded objects:
- `cat_model`, `priority_model`
- `tfidf_cat`, `tfidf_pr`

## Current Repository Notes

- Project contains notebooks + trained artifacts, so both experimentation and inference are included.
- Legacy model files (`ticket_type_model.pkl`, `tfidf_vectorizer.pkl`) are present alongside current category/priority models.

## Future Improvements

- Add automated model evaluation reports in CI
- Add database migrations (Alembic)
- Improve class-wise metrics for low-performing priority classes
- Add Docker setup for one-command local deployment
