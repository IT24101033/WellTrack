"""
ai-service/main.py
==================
FastAPI microservice that serves the trained XGBoost health-risk model.

Endpoints
---------
GET  /              — health check
POST /predict       — predict risk (0=Low, 1=Medium, 2=High) from raw health data
GET  /model-info    — model metadata

Model input features (38 total) are FULLY COMPUTED here from the raw
health data sent by the Node.js backend — the frontend never has to
know about one-hot encoding or engineered features.
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("ai-service")

# ── Load model ─────────────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "model" / "model_XGBoost_Tuned.pkl"

model = None
MODEL_LOADED = False

def load_model():
    global model, MODEL_LOADED
    if not MODEL_PATH.exists():
        logger.warning(f"Model file not found at {MODEL_PATH}. Prediction endpoint will return error.")
        return
    try:
        model = joblib.load(MODEL_PATH)
        MODEL_LOADED = True
        logger.info(f"✅ XGBoost model loaded from {MODEL_PATH}")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")

load_model()

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="WellTrack AI Risk Service",
    description="XGBoost health risk prediction microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────────
# Request schema — raw health data from the Node.js backend
# ────────────────────────────────────────────────────────────────────────────────
class HealthInput(BaseModel):
    # Demographics
    age: float = Field(default=22, ge=0, le=120)
    gender: str = Field(default="Male")          # "Male" | "Female" | "Other"

    # Physiological
    height_cm: float = Field(default=170, ge=50, le=250)
    weight_kg: float = Field(default=65, ge=10, le=300)
    bmi: Optional[float] = Field(default=None)   # auto-computed if None
    resting_heart_rate: float = Field(default=72, ge=30, le=250)
    sleep_hours: float = Field(default=7, ge=0, le=24)
    sleep_quality: float = Field(default=7, ge=1, le=10)

    # Lifestyle
    water_intake_liters: float = Field(default=2.0, ge=0, le=20)
    junk_food_frequency: str = Field(default="Weekly")   # "Never"|"Weekly"|"2-3 times"|"Daily"
    caffeine_intake_cups: float = Field(default=2, ge=0, le=30)
    meal_regularity: str = Field(default="Regular")      # "Regular"|"Irregular"

    # Activity
    steps_per_day: float = Field(default=7000, ge=0, le=100000)
    exercise_minutes: float = Field(default=30, ge=0, le=1440)
    sedentary_hours: float = Field(default=6, ge=0, le=24)
    screen_time_hours: float = Field(default=4, ge=0, le=24)
    late_night_screen: bool = Field(default=False)

    # Psychological
    stress_score: float = Field(default=4, ge=1, le=10)
    mood_score: float = Field(default=7, ge=1, le=10)
    social_interaction_level: str = Field(default="Medium")  # "Low"|"Medium"|"High"
    weekend_sleep_shift_hours: float = Field(default=1, ge=-12, le=12)


# ────────────────────────────────────────────────────────────────────────────────
# Feature Engineering
# Reproduces exactly the features the model was trained on.
# ────────────────────────────────────────────────────────────────────────────────

# Exact training feature order (38 features)
FEATURE_ORDER = [
    'age', 'height_cm', 'weight_kg', 'bmi',
    'sleep_hours', 'sleep_quality', 'resting_heart_rate',
    'stress_score', 'steps_per_day', 'exercise_minutes',
    'sedentary_hours', 'screen_time_hours', 'water_intake_liters',
    'mood_score', 'weekend_sleep_shift_hours',
    # One-hot encoded
    'gender_Male', 'gender_Other',
    'late_night_screen_Yes',
    'physical_activity_level_Low', 'physical_activity_level_Medium',
    'junk_food_frequency_Rare', 'junk_food_frequency_Sometimes',
    'caffeine_intake_Low', 'caffeine_intake_Medium',
    'meal_regular_Yes',
    'social_interaction_level_Low', 'social_interaction_level_Medium',
    # Engineered features
    'stress_sleep_penalty',
    'activity_sedentary_ratio',
    'night_screen_damage',
    'bmi_activity_interaction',
    'steps_per_exercise_min',
    'mood_stress_balance',
    'hydration_vs_caffeine',
    'young_high_stress',
    'weekend_sleep_impact',
    'overall_lifestyle_score',
    'bmi_sleep_deficit',
]

LABEL_MAP = {0: "low", 1: "medium", 2: "high"}
PCT_MAP   = {0: 22,    1: 54,      2: 83}

def _classify_physical_activity(exercise_min: float, steps: float) -> str:
    """Derive physical_activity_level from exercise minutes + steps."""
    if exercise_min >= 60 or steps >= 10000:
        return "High"
    elif exercise_min >= 25 or steps >= 5000:
        return "Medium"
    return "Low"

def _classify_caffeine(cups: float) -> str:
    if cups <= 1:
        return "Low"
    elif cups <= 3:
        return "Medium"
    return "High"      # base category

def _map_junk_food(freq: str) -> str:
    """Map model junk_food_frequency to training categories."""
    mapping = {
        "Never":    "Rare",
        "Weekly":   "Sometimes",
        "2-3 times":"Frequent",  # base
        "Daily":    "Frequent",  # base
    }
    return mapping.get(freq, "Frequent")

def _simple_risk_encoded(bmi: float, stress: float, sleep: float) -> int:
    """Approximate the rule-based health_risk_encoded used during training."""
    if (bmi > 27 or stress >= 8) and sleep < 6:
        return 2
    if bmi > 24 or stress >= 6 or sleep < 7:
        return 1
    return 0

def build_feature_vector(inp: HealthInput) -> pd.DataFrame:
    """Convert raw HealthInput into the model's 38-feature DataFrame."""

    # ── Core numerics ─────────────────────────────────────────────────────────
    bmi = inp.bmi if inp.bmi else round(inp.weight_kg / ((inp.height_cm / 100) ** 2), 2)

    # ── Derived categories ────────────────────────────────────────────────────
    phy_activity  = _classify_physical_activity(inp.exercise_minutes, inp.steps_per_day)
    caffeine_cat  = _classify_caffeine(inp.caffeine_intake_cups)
    junk_cat      = _map_junk_food(inp.junk_food_frequency)

    # ── One-hot encodings ─────────────────────────────────────────────────────
    gender_male  = 1 if inp.gender == "Male"  else 0
    gender_other = 1 if inp.gender == "Other" else 0

    late_night_yes = 1 if inp.late_night_screen else 0

    phy_low    = 1 if phy_activity == "Low"    else 0
    phy_medium = 1 if phy_activity == "Medium" else 0

    junk_rare      = 1 if junk_cat == "Rare"      else 0
    junk_sometimes = 1 if junk_cat == "Sometimes" else 0

    caff_low    = 1 if caffeine_cat == "Low"    else 0
    caff_medium = 1 if caffeine_cat == "Medium" else 0

    meal_yes = 1 if inp.meal_regularity == "Regular" else 0

    social_low    = 1 if inp.social_interaction_level == "Low"    else 0
    social_medium = 1 if inp.social_interaction_level == "Medium" else 0

    # ── Engineered features ───────────────────────────────────────────────────
    stress_sleep_penalty    = inp.stress_score * (1.0 / max(inp.sleep_hours, 0.5))
    activity_sedentary_ratio = inp.exercise_minutes / max(inp.sedentary_hours * 60, 1)
    night_screen_damage     = late_night_yes * inp.screen_time_hours
    bmi_activity_interaction= bmi * (inp.steps_per_day / 10000)
    steps_per_exercise_min  = inp.steps_per_day / max(inp.exercise_minutes, 1)
    mood_stress_balance     = inp.mood_score - inp.stress_score
    hydration_vs_caffeine   = inp.water_intake_liters / max(inp.caffeine_intake_cups, 0.1)
    young_high_stress       = (1 if inp.age < 25 else 0) * inp.stress_score
    weekend_sleep_impact    = abs(inp.weekend_sleep_shift_hours)
    bmi_sleep_deficit       = bmi * max(0, 8 - inp.sleep_hours)

    # overall_lifestyle_score: composite of positive health signals (0-10 scale)
    sleep_ok   = min(inp.sleep_hours / 8, 1)
    steps_ok   = min(inp.steps_per_day / 10000, 1)
    stress_inv = 1 - (inp.stress_score - 1) / 9
    hydration_ok = min(inp.water_intake_liters / 3, 1)
    mood_ok    = (inp.mood_score - 1) / 9
    exercise_ok= min(inp.exercise_minutes / 60, 1)
    overall_lifestyle_score = round(
        (sleep_ok + steps_ok + stress_inv + hydration_ok + mood_ok + exercise_ok) / 6 * 10, 4
    )

    # ── Assemble in training order ─────────────────────────────────────────────
    row = {
        'age': inp.age,
        'height_cm': inp.height_cm,
        'weight_kg': inp.weight_kg,
        'bmi': bmi,
        'sleep_hours': inp.sleep_hours,
        'sleep_quality': inp.sleep_quality,
        'resting_heart_rate': inp.resting_heart_rate,
        'stress_score': inp.stress_score,
        'steps_per_day': inp.steps_per_day,
        'exercise_minutes': inp.exercise_minutes,
        'sedentary_hours': inp.sedentary_hours,
        'screen_time_hours': inp.screen_time_hours,
        'water_intake_liters': inp.water_intake_liters,
        'mood_score': inp.mood_score,
        'weekend_sleep_shift_hours': inp.weekend_sleep_shift_hours,
        'gender_Male': gender_male,
        'gender_Other': gender_other,
        'late_night_screen_Yes': late_night_yes,
        'physical_activity_level_Low': phy_low,
        'physical_activity_level_Medium': phy_medium,
        'junk_food_frequency_Rare': junk_rare,
        'junk_food_frequency_Sometimes': junk_sometimes,
        'caffeine_intake_Low': caff_low,
        'caffeine_intake_Medium': caff_medium,
        'meal_regular_Yes': meal_yes,
        'social_interaction_level_Low': social_low,
        'social_interaction_level_Medium': social_medium,
        'stress_sleep_penalty': stress_sleep_penalty,
        'activity_sedentary_ratio': activity_sedentary_ratio,
        'night_screen_damage': night_screen_damage,
        'bmi_activity_interaction': bmi_activity_interaction,
        'steps_per_exercise_min': steps_per_exercise_min,
        'mood_stress_balance': mood_stress_balance,
        'hydration_vs_caffeine': hydration_vs_caffeine,
        'young_high_stress': young_high_stress,
        'weekend_sleep_impact': weekend_sleep_impact,
        'overall_lifestyle_score': overall_lifestyle_score,
        'bmi_sleep_deficit': bmi_sleep_deficit,
    }

    return pd.DataFrame([row], columns=FEATURE_ORDER)


def get_contributing_factors(inp: HealthInput, prediction: int) -> list[str]:
    """Return human-readable factors that influenced the prediction."""
    factors = []
    if inp.stress_score >= 7:
        factors.append(f"High stress ({inp.stress_score}/10)")
    if inp.sleep_hours < 6:
        factors.append(f"Low sleep ({inp.sleep_hours}h)")
    bmi = inp.bmi or round(inp.weight_kg / ((inp.height_cm / 100) ** 2), 2)
    if bmi > 25:
        factors.append(f"Elevated BMI ({bmi:.1f})")
    if inp.steps_per_day < 5000:
        factors.append(f"Low activity ({int(inp.steps_per_day)} steps)")
    if inp.exercise_minutes < 20:
        factors.append("Insufficient exercise")
    if inp.sedentary_hours > 8:
        factors.append(f"Sedentary time ({inp.sedentary_hours}h)")
    if inp.screen_time_hours > 6 and inp.late_night_screen:
        factors.append("Late-night screen use")
    if inp.junk_food_frequency in ("Daily", "2-3 times"):
        factors.append(f"Junk food ({inp.junk_food_frequency})")
    if inp.water_intake_liters < 1.5:
        factors.append(f"Low hydration ({inp.water_intake_liters}L)")
    if inp.mood_score < 4:
        factors.append(f"Low mood ({inp.mood_score}/10)")

    # Also add positive factors for low risk
    if prediction == 0:
        if inp.steps_per_day >= 8000:
            factors.append(f"Good activity ({int(inp.steps_per_day)} steps)")
        if inp.sleep_hours >= 7:
            factors.append(f"Adequate sleep ({inp.sleep_hours}h)")
        if inp.stress_score <= 4:
            factors.append("Low stress level")

    return factors[:6] if factors else ["Balanced health profile"]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "WellTrack AI Risk Prediction",
        "model_loaded": MODEL_LOADED,
        "model_path": str(MODEL_PATH),
    }


@app.get("/model-info")
def model_info():
    return {
        "algorithm": "XGBoost Classifier",
        "classes": {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"},
        "features": len(FEATURE_ORDER),
        "feature_names": FEATURE_ORDER,
        "model_loaded": MODEL_LOADED,
    }


@app.post("/predict")
def predict(inp: HealthInput):
    if not MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please place health_risk_model.pkl in ai-service/model/ and restart the service."
        )

    try:
        X = build_feature_vector(inp)
        logger.info(f"Predicting for features: {X.to_dict(orient='records')[0]}")

        pred_int = int(model.predict(X)[0])

        # Get class probabilities for confidence score
        try:
            proba = model.predict_proba(X)[0]
            confidence = round(float(proba[pred_int]) * 100, 1)
            score_pct  = round(float(np.dot(proba, [0, 50, 100])), 1)  # weighted risk %
        except Exception:
            confidence = 85.0
            score_pct  = PCT_MAP[pred_int]

        risk_label = LABEL_MAP[pred_int]
        factors    = get_contributing_factors(inp, pred_int)

        bmi = inp.bmi or round(inp.weight_kg / ((inp.height_cm / 100) ** 2), 2)

        return {
            "success": True,
            "prediction": {
                "risk_class":   pred_int,
                "risk_level":   risk_label,
                "risk_pct":     score_pct,
                "confidence":   confidence,
                "label":        risk_label.capitalize() + " Risk",
                "contributing_factors": factors,
            },
            "input_summary": {
                "bmi": round(bmi, 2),
                "stress_score": inp.stress_score,
                "sleep_hours":  inp.sleep_hours,
                "steps_per_day": inp.steps_per_day,
                "exercise_minutes": inp.exercise_minutes,
            }
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── Dev runner ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
