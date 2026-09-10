from pathlib import Path

from PIL import Image
import cv2
import numpy as np


def analyze_image_quality(image_path: str):
    """
    Analyze uploaded product image quality.

    Returns:
        image dimensions
        image format
        brightness
        contrast
        blur/sharpness
        overall image quality
    """

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    # ============================================================
    # 1. OPEN IMAGE
    # ============================================================

    image = Image.open(path)

    width, height = image.size

    image_format = (
        image.format
        or path.suffix.replace(".", "").upper()
    )

    # ============================================================
    # 2. READ IMAGE USING OPENCV
    # ============================================================

    img = cv2.imread(str(path))

    if img is None:
        raise ValueError(
            "Unable to read image"
        )

    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    # ============================================================
    # 3. BRIGHTNESS
    # ============================================================

    brightness_value = float(
        np.mean(gray)
    )

    if brightness_value < 60:

        brightness = "Low"

    elif brightness_value > 200:

        brightness = "High"

    else:

        brightness = "Good"

    # ============================================================
    # 4. CONTRAST
    # ============================================================

    contrast_value = float(
        np.std(gray)
    )

    if contrast_value < 25:

        contrast = "Low"

    elif contrast_value > 80:

        contrast = "High"

    else:

        contrast = "Good"

    # ============================================================
    # 5. BLUR / SHARPNESS
    # ============================================================

    blur_value = float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()
    )

    if blur_value < 50:

        blur = "High Blur"

    elif blur_value < 150:

        blur = "Moderate Blur"

    else:

        blur = "Low Blur"

    # ============================================================
    # 6. QUALITY SCORE
    # ============================================================
    #
    # We calculate a simple quality score.
    #
    # Brightness:
    # Good = 100
    # Low/High = 40
    #
    # Contrast:
    # High/Good = 100
    # Low = 40
    #
    # Blur:
    # Low Blur = 100
    # Moderate Blur = 60
    # High Blur = 20
    #
    # ============================================================

    brightness_score = (
        100
        if brightness == "Good"
        else 40
    )

    contrast_score = (
        100
        if contrast in ["Good", "High"]
        else 40
    )

    if blur == "Low Blur":

        blur_score = 100

    elif blur == "Moderate Blur":

        blur_score = 60

    else:

        blur_score = 20

    # ============================================================
    # 7. OVERALL QUALITY SCORE
    # ============================================================

    quality_score = round(
        (
            brightness_score * 0.30
            + contrast_score * 0.30
            + blur_score * 0.40
        )
    )

    # ============================================================
    # 8. OVERALL QUALITY
    # ============================================================

    # High Blur is important for an inspection system.
    # Do not call a heavily blurred image "Acceptable".

    if blur == "High Blur":

        overall_quality = "Poor"

    elif quality_score >= 80:

        overall_quality = "Good"

    elif quality_score >= 60:

        overall_quality = "Acceptable"

    else:

        overall_quality = "Poor"

    # ============================================================
    # 9. QUALITY REVIEW FLAG
    # ============================================================

    quality_review_required = (
        overall_quality == "Poor"
        or blur == "High Blur"
        or brightness in ["Low", "High"]
        or contrast == "Low"
    )

    # ============================================================
    # 10. RETURN RESULT
    # ============================================================

    return {

        "filename":
            path.name,

        "image": {

            "width":
                width,

            "height":
                height,

            "format":
                image_format
        },

        "quality": {

            "brightness":
                brightness,

            "brightness_value":
                round(
                    brightness_value,
                    2
                ),

            "contrast":
                contrast,

            "contrast_value":
                round(
                    contrast_value,
                    2
                ),

            "blur":
                blur,

            "blur_value":
                round(
                    blur_value,
                    2
                ),

            "quality_score":
                quality_score,

            "overall":
                overall_quality,

            "review_required":
                quality_review_required
        }
    }