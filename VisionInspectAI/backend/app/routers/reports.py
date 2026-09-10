from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.utils.jwt_handler import get_current_user
from app.models.inspection import Inspection


router = APIRouter(
    prefix="/reports",
    tags=["Production Reports"]
)


def normalize_defect_name(name):
    """
    Converts different versions of the same defect
    into one consistent name.
    """

    if not name:
        return None

    value = str(name).strip().lower()

    replacements = {
        "broken_small": "Broken Small",
        "broken small": "Broken Small",

        "broken_large": "Broken Large",
        "broken large": "Broken Large",

        "manufacturing_defect": "Manufacturing Defect",
        "manufacturing defect": "Manufacturing Defect",

        "crack": "Crack",
        "scratch": "Scratch",

        "missing_component": "Missing Component",
        "missing component": "Missing Component",

        "no_defect": "No Defect",
        "no defect": "No Defect",

        "unknown": "Unknown / Unclassified",
        "unknown / unclassified": "Unknown / Unclassified",
    }

    return replacements.get(
        value,
        value.replace("_", " ").title()
    )


@router.get("/summary")
def production_quality_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    inspections = (
        db.query(Inspection)
        .order_by(Inspection.id.desc())
        .all()
    )

    total = len(inspections)

    passed = 0
    defective = 0

    defect_types = {}

    low = 0
    medium = 0
    high = 0
    critical = 0

    pass_count = 0
    review_count = 0
    reject_count = 0

    confidence_values = []
    severity_values = []

    for inspection in inspections:

        # =====================================================
        # PREDICTION
        # =====================================================

        prediction = str(
            inspection.prediction or ""
        ).strip().lower()

        if prediction in [
            "passed",
            "pass",
            "good"
        ]:
            passed += 1

        elif prediction in [
            "defective",
            "defect",
            "failed",
            "fail"
        ]:
            defective += 1

        # =====================================================
        # DEFECT TYPE
        # =====================================================

        raw_defect = inspection.defect_classification

        normalized_defect = normalize_defect_name(
            raw_defect
        )

        if normalized_defect and normalized_defect not in [
            "No Defect",
            "Unknown / Unclassified"
        ]:

            defect_types[normalized_defect] = (
                defect_types.get(normalized_defect, 0) + 1
            )

        # =====================================================
        # CONFIDENCE
        # =====================================================

        confidence = inspection.confidence

        if confidence is not None:

            try:
                confidence = float(confidence)

                if confidence <= 1:
                    confidence *= 100

                confidence_values.append(confidence)

            except (ValueError, TypeError):
                pass

        # =====================================================
        # SEVERITY LEVEL
        # =====================================================

        severity = inspection.severity_level

        if severity:

            severity = str(
                severity
            ).strip().lower()

            if severity == "low":
                low += 1

            elif severity == "medium":
                medium += 1

            elif severity == "high":
                high += 1

            elif severity == "critical":
                critical += 1

        # =====================================================
        # SEVERITY SCORE
        # =====================================================

        severity_score = inspection.severity_score

        if severity_score is not None:

            try:
                severity_values.append(
                    float(severity_score)
                )

            except (ValueError, TypeError):
                pass

        # =====================================================
        # QUALITY DECISION
        # =====================================================

        decision = inspection.quality_decision

        if decision:

            decision = str(
                decision
            ).strip().lower()

            if decision == "pass":
                pass_count += 1

            elif decision == "review":
                review_count += 1

            elif decision in [
                "reject",
                "fail"
            ]:
                reject_count += 1

    # =========================================================
    # CALCULATIONS
    # =========================================================

    defect_rate = (
        round(
            (defective / total) * 100,
            2
        )
        if total > 0
        else 0
    )

    pass_rate = (
        round(
            (passed / total) * 100,
            2
        )
        if total > 0
        else 0
    )

    average_confidence = (
        round(
            sum(confidence_values)
            / len(confidence_values),
            2
        )
        if confidence_values
        else 0
    )

    average_severity = (
        round(
            sum(severity_values)
            / len(severity_values),
            2
        )
        if severity_values
        else 0
    )

    # =========================================================
    # FINAL REPORT
    # =========================================================

    return {

        "report_name":
            "Production Quality Report",

        "total_inspections":
            total,

        "passed_products":
            passed,

        "defective_products":
            defective,

        "pass_rate":
            pass_rate,

        "defect_rate":
            defect_rate,

        "average_confidence":
            average_confidence,

        "average_severity":
            average_severity,

        "defect_types":
            defect_types,

        "severity": {

            "low":
                low,

            "medium":
                medium,

            "high":
                high,

            "critical":
                critical
        },

        "decisions": {

            "pass":
                pass_count,

            "review":
                review_count,

            "reject":
                reject_count
        },

        "generated_for":
            current_user["email"]
    }