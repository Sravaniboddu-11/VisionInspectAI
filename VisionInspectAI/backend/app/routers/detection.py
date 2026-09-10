from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pathlib import Path
from ultralytics import YOLO

from app.utils.jwt_handler import get_current_user
from app.services.image_quality import analyze_image_quality


router = APIRouter(
    prefix="/detection",
    tags=["Detection"]
)


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


SUPPORTED_CLASSES = {
    "broken_large",
    "broken_small",
    "contamination",
}


DETECTION_CONFIDENCE = 0.25
IMAGE_SIZE = 640
IOU_THRESHOLD = 0.45
MAX_DETECTIONS = 20


class DetectionRequest(BaseModel):
    filename: str


def normalize_defect_class(class_name):
    if not class_name:
        return "Unknown / Unclassified"

    name = str(class_name).lower().strip()

    mapping = {
        "broken_large": "Broken Large",
        "broken_small": "Broken Small",
        "contamination": "Contamination",
    }

    return mapping.get(
        name,
        str(class_name).replace("_", " ").title()
    )


def get_defect_scores(defect_class):
    name = str(defect_class).lower().strip()

    if name == "broken_large":
        return 90, 90

    if name == "broken_small":
        return 40, 60

    if name == "contamination":
        return 60, 70

    return 50, 50


def get_location_score(defect_class):
    name = str(defect_class).lower().strip()

    if name == "broken_large":
        return 90

    if name == "broken_small":
        return 60

    if name == "contamination":
        return 65

    return 50


def get_severity_level(score):
    if score >= 80:
        return "Critical"

    if score >= 60:
        return "High"

    if score >= 42:
        return "Medium"

    return "Low"


def get_quality_assessment(
    defect,
    severity_level,
    confidence_percent,
):
    if not defect:
        return (
            "Pass",
            "No supported defect was detected by the AI model."
        )

    if severity_level == "Critical":
        return (
            "Reject",
            "Critical defect detected. Product should be rejected."
        )

    if severity_level == "High":
        return (
            "Reject",
            "High severity defect detected. Product should be rejected."
        )

    return (
        "Review",
        (
            f"Defect detected with {confidence_percent:.2f}% confidence. "
            "Quality engineer review is required."
        )
    )


def get_recommended_action(quality_assessment):
    if quality_assessment == "Pass":
        return "Product accepted."

    if quality_assessment == "Reject":
        return "Product rejected due to severe defect."

    return "Product requires quality engineer review."


@router.post("/predict")
async def predict_image(
    request: DetectionRequest,
    current_user=Depends(get_current_user)
):

    backend_dir = Path(__file__).resolve().parents[2]

    image_path = (
        backend_dir
        / "uploads"
        / request.filename
    )

    if not image_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {request.filename}"
        )

    try:

        image_quality = analyze_image_quality(
            str(image_path)
        )

        results = model.predict(
            source=str(image_path),
            conf=DETECTION_CONFIDENCE,
            imgsz=IMAGE_SIZE,
            iou=IOU_THRESHOLD,
            max_det=MAX_DETECTIONS,
            verbose=False
        )

        if not results:
            raise HTTPException(
                status_code=500,
                detail="YOLO returned no result."
            )

        result = results[0]

        detections = []

        if (
            result.boxes is not None
            and len(result.boxes) > 0
        ):

            for box in result.boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                if class_id not in model.names:
                    continue

                raw_class = str(
                    model.names[class_id]
                ).lower().strip()

                if raw_class not in SUPPORTED_CLASSES:
                    continue

                readable_class = normalize_defect_class(
                    raw_class
                )

                detections.append({
                    "class": raw_class,
                    "label": readable_class,
                    "confidence": round(
                        confidence,
                        4
                    ),
                    "confidence_percent": round(
                        confidence * 100,
                        2
                    )
                })

        if not detections:

            defect = False
            prediction = "Passed"

            raw_defect_classification = "No Defect"
            defect_classification = "No Defect"

            highest_confidence = 0.0

        else:

            defect = True

            best_detection = max(
                detections,
                key=lambda x: x["confidence"]
            )

            raw_defect_classification = (
                best_detection["class"]
            )

            defect_classification = (
                best_detection["label"]
            )

            highest_confidence = (
                best_detection["confidence"]
            )

            prediction = "Defective"

        confidence_percent = round(
            highest_confidence * 100,
            2
        )

        confidence_score = round(
            highest_confidence * 100
        )

        if not defect:

            size_score = 0
            location_score = 0
            defect_type_score = 0

            overall_severity = 0
            severity_level = "Low"

        else:

            (
                size_score,
                defect_type_score
            ) = get_defect_scores(
                raw_defect_classification
            )

            location_score = get_location_score(
                raw_defect_classification
            )

            overall_severity = round(
                size_score * 0.30
                + location_score * 0.25
                + defect_type_score * 0.25
                + confidence_score * 0.20
            )

            severity_level = get_severity_level(
                overall_severity
            )

        (
            quality_assessment,
            quality_reason
        ) = get_quality_assessment(
            defect=defect,
            severity_level=severity_level,
            confidence_percent=confidence_percent,
        )

        recommended_action = (
            get_recommended_action(
                quality_assessment
            )
        )

        return {

            "message": (
                "Inspection completed successfully"
            ),

            "filename": request.filename,

            "image_quality": image_quality,

            "prediction": prediction,

            "confidence": highest_confidence,

            "confidence_percent": confidence_percent,

            "defect": defect,

            "defect_classification": (
                defect_classification
            ),

            "raw_defect_classification": (
                raw_defect_classification
            ),

            "detections": detections,

            "model_classes": model.names,

            "severity": {

                "size_score": size_score,

                "location_score": location_score,

                "defect_type_score": (
                    defect_type_score
                ),

                "confidence_score": (
                    confidence_score
                ),

                "overall_score": (
                    overall_severity
                ),

                "level": severity_level
            },

            "quality_assessment": {

                "status": quality_assessment,

                "reason": quality_reason
            },

            "quality_control": {

                "decision": (
                    quality_assessment.upper()
                ),

                "recommended_action": (
                    recommended_action
                )
            },

            "inspected_by": (
                current_user["email"]
            ),

            "role": "Quality Engineer"
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "YOLO Detection Error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Detection failed: {str(error)}"
            )
        )