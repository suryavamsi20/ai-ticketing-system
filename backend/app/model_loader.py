from pathlib import Path

import joblib

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent
MODELS_DIR = PROJECT_ROOT / "models"

CATEGORY_MODEL_PATH = MODELS_DIR / "category_model.pkl"
PRIORITY_MODEL_PATH = MODELS_DIR / "priority_model.pkl"
TFIDF_CAT_PATH = MODELS_DIR / "tfidf_category.pkl"
TFIDF_PR_PATH = MODELS_DIR / "tfidf_priority.pkl"

cat_model = joblib.load(CATEGORY_MODEL_PATH)
priority_model = joblib.load(PRIORITY_MODEL_PATH)
tfidf_cat = joblib.load(TFIDF_CAT_PATH)
tfidf_pr = joblib.load(TFIDF_PR_PATH)
