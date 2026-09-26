from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import joblib
import pandas as pd

app = FastAPI(
    title="IoT Intrusion Detector",
    description="Real-time IoT Network Traffic Intrusion Detection API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve model path across environments
def find_model_bundle() -> Path:
    candidate_paths = [
        Path("artifacts/model_bundle.joblib"),
        Path(__file__).resolve().parent.parent / "artifacts" / "model_bundle.joblib",
    ]
    for p in candidate_paths:
        if p.exists():
            return p
    raise FileNotFoundError(f"Model bundle not found. Checked: {[str(p) for p in candidate_paths]}")

MODEL_PATH = find_model_bundle()
bundle = joblib.load(MODEL_PATH)
model, preprocessor, le = bundle["model"], bundle["preprocessor"], bundle["label_encoder"]


class PacketFeatures(BaseModel):
    protocol_m: str = Field(..., description="Protocol (e.g. 'tcp', 'udp', 'other')", example="tcp")
    sttl: int = Field(..., description="Source-to-destination TTL / Time-to-Live", example=64)
    total_len: int = Field(..., description="Total packet length in bytes", example=1500)

    @field_validator("protocol_m")
    @classmethod
    def normalize_protocol(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean in ["tcp", "udp"]:
            return clean
        return "other"


@app.get("/")
def root():
    return {
        "service": "IoT Intrusion Detector",
        "status": "online",
        "model_loaded_from": str(MODEL_PATH),
        "classes": list(le.classes_)
    }


@app.post("/predict")
def predict(features: PacketFeatures):
    try:
        X = pd.DataFrame([features.model_dump()])
        X_encoded = preprocessor.transform(X)
        pred = model.predict(X_encoded)
        proba = model.predict_proba(X_encoded).max()
        return {
            "prediction": le.inverse_transform(pred)[0],
            "confidence": round(float(proba), 4)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
