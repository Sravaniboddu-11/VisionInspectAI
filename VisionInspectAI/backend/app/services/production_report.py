from datetime import datetime


def generate_production_quality_report(inspection: dict):
    """
    Generate a production quality report from an inspection result.
    Does not modify the existing detection or severity logic.
    """

    severity = inspection.get("severity", {})
    quality = inspection.get("image_quality", {})
    quality_data = quality.get("quality", {})
    image_data = quality.get("image", {})
    quality_control = inspection.get("quality_control", {})

    report = {
        "report_title": "Production Quality Report",

        "inspection": {
            "inspection_id": inspection.get(
                "inspection_id",
                f"INS-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            ),

            "image": inspection.get(
                "filename",
                "Unknown"
            ),

            "inspection_time": inspection.get(
                "inspection_time",
                datetime.now().isoformat()
            ),

            "inspected_by": inspection.get(
                "inspected_by",
                "Unknown"
            ),

            "role": inspection.get(
                "role",
                "Quality Engineer"
            )
        },

        "product_result": {
            "prediction": inspection.get(
                "prediction",
                "Unknown"
            ),

            "defect": inspection.get(
                "defect",
                False
            ),

            "defect_classification": inspection.get(
                "defect_classification",
                "Unknown / Unclassified"
            ),

            "confidence": inspection.get(
                "confidence",
                0
            )
        },

        "image_quality": {
            "dimensions": (
                f"{image_data.get('width', 'Unknown')} x "
                f"{image_data.get('height', 'Unknown')}"
            ),

            "format": image_data.get(
                "format",
                "Unknown"
            ),

            "brightness": quality_data.get(
                "brightness",
                "Unknown"
            ),

            "brightness_value": quality_data.get(
                "brightness_value",
                0
            ),

            "contrast": quality_data.get(
                "contrast",
                "Unknown"
            ),

            "contrast_value": quality_data.get(
                "contrast_value",
                0
            ),

            "blur": quality_data.get(
                "blur",
                "Unknown"
            ),

            "blur_value": quality_data.get(
                "blur_value",
                0
            ),

            "overall_quality": quality_data.get(
                "overall",
                "Unknown"
            )
        },

        "severity_assessment": {
            "size_score": severity.get(
                "size_score",
                0
            ),

            "location_score": severity.get(
                "location_score",
                0
            ),

            "defect_type_score": severity.get(
                "defect_type_score",
                0
            ),

            "confidence_score": severity.get(
                "confidence_score",
                0
            ),

            "overall_score": severity.get(
                "overall_score",
                0
            ),

            "severity_level": severity.get(
                "level",
                "Unknown"
            )
        },

        "quality_control": {
            "decision": quality_control.get(
                "decision",
                "REVIEW"
            ),

            "recommended_action": quality_control.get(
                "recommended_action",
                "Quality engineer review required."
            )
        }
    }

    return report