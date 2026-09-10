from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pathlib import Path
from ultralytics import YOLO

from app.utils.jwt_handler import get_current_user


router = APIRouter(
    prefix="/detection",
    tags=["Detection"]
)


# ============================================================
# YOLO MODEL
# ============================================================

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "yolo"
    / "bottle_defect.pt"
)

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"YOLO model not found at: {MODEL_PATH}"
    )

model = YOLO(str(MODEL_PATH))


# ============================================================
# REQUEST MODEL
# ============================================================

class DetectionRequest(BaseModel):
    filename: str


# ============================================================
# PREDICTION API
# ============================================================

@router.post("/predict")
async def predict_image(
    request: DetectionRequest,
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # Locate uploaded image
    # --------------------------------------------------------

    backend_dir = Path(__file__).resolve().parents[2]

    image_path = backend_dir / "uploads" / request.filename

    if not image_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {request.filename}"
        )

    # --------------------------------------------------------
    # Run YOLO
    # --------------------------------------------------------

    try:

        results = model.predict(
            source=str(image_path),

            # IMPORTANT:
            # Your model detected broken_small at 0.067
            # when using 0.05 confidence.
            conf=0.05,

            imgsz=640,
            verbose=False
        )

        result = results[0]

        detections = []

        # ----------------------------------------------------
        # Process YOLO detections
        # ----------------------------------------------------

        if result.boxes is not None and len(result.boxes) > 0:

            for box in result.boxes:

                class_id = int(box.cls[0])

                confidence = float(box.conf[0])

                class_name = model.names[class_id]

                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 4)
                })

        # ----------------------------------------------------
        # NO DETECTION
        # ----------------------------------------------------

        if len(detections) == 0:

            prediction = "Passed"

            defect = False

            defect_classification = "No Defect"

            highest_confidence = 0.0

        # ----------------------------------------------------
        # DEFECT DETECTED
        # ----------------------------------------------------

        else:

            defect = True

            # Get highest-confidence detection
            best_detection = max(
                detections,
                key=lambda x: x["confidence"]
            )

            defect_classification = best_detection["class"]

            highest_confidence = best_detection["confidence"]

            prediction = "Defective"

        # ----------------------------------------------------
        # Confidence score
        # ----------------------------------------------------

        confidence_score = round(
            highest_confidence * 100
        )

        # ----------------------------------------------------
        # Severity calculation
        # ----------------------------------------------------

        if not defect:

            size_score = 0

            location_score = 0

            defect_type_score = 0

            overall_severity = 0

            severity_level = "Low"

        else:

            # ----------------------------------------------
            # BROKEN LARGE
            # ----------------------------------------------

            if defect_classification == "broken_large":

                size_score = 90

                defect_type_score = 90

            # ----------------------------------------------
            # BROKEN SMALL
            # ----------------------------------------------

            elif defect_classification == "broken_small":

                size_score = 40

                defect_type_score = 50

            # ----------------------------------------------
            # CONTAMINATION
            # ----------------------------------------------

            elif defect_classification == "contamination":

                size_score = 60

                defect_type_score = 80

            # ----------------------------------------------
            # UNKNOWN DEFECT
            # ----------------------------------------------

            else:

                size_score = 50

                defect_type_score = 50

            # Currently using a fixed location score.
            location_score = 50

            # ----------------------------------------------
            # OVERALL SEVERITY
            # ----------------------------------------------

            overall_severity = round(
                (
                    size_score
                    + location_score
                    + defect_type_score
                    + confidence_score
                ) / 4
            )

            # ----------------------------------------------
            # SEVERITY LEVEL
            # ----------------------------------------------

            if overall_severity >= 70:

                severity_level = "High"

            elif overall_severity >= 40:

                severity_level = "Medium"

            else:

                severity_level = "Low"

        # ====================================================
        # QUALITY CONTROL DECISION
        # ====================================================

        if not defect:

            decision = "PASS"

            recommended_action = (
                "Product accepted."
            )

        elif severity_level == "High":

            decision = "REJECT"

            recommended_action = (
                "Product rejected due to severe defect."
            )

        else:

            decision = "REVIEW"

            recommended_action = (
                "Product requires quality engineer review."
            )

        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        return {

            "message": "Inspection completed successfully",

            "filename": request.filename,

            "prediction": prediction,

            "confidence": highest_confidence,

            "defect": defect,

            "defect_classification": defect_classification,

            "detections": detections,

            "severity": {

                "size_score": size_score,

                "location_score": location_score,

                "defect_type_score": defect_type_score,

                "confidence_score": confidence_score,

                "overall_score": overall_severity,

                "level": severity_level
            },

            "quality_control": {

                "decision": decision,

                "recommended_action": recommended_action
            },

            "inspected_by": current_user["email"],

            "role": "Quality Engineer"
        }

    except Exception as error:

        print("YOLO Detection Error:", error)

        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(error)}"
        )