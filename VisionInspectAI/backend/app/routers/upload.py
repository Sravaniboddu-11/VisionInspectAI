import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from PIL import Image, UnidentifiedImageError

from app.services.image_processing import preprocess_image
from app.utils.jwt_handler import get_current_user


router = APIRouter(
    prefix="/upload",
    tags=["Image Upload"]
)


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

# backend/
# ├── app/
# └── uploads/

BACKEND_DIR = Path(__file__).resolve().parents[2]

UPLOAD_FOLDER = BACKEND_DIR / "uploads"

UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# UPLOAD IMAGE
# ============================================================

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # CHECK FILE TYPE
    # --------------------------------------------------------

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image file type could not be determined."
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed."
        )

    # --------------------------------------------------------
    # CHECK FILENAME
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename was provided."
        )

    # Prevent directory traversal
    safe_filename = Path(file.filename).name

    file_path = UPLOAD_FOLDER / safe_filename

    # --------------------------------------------------------
    # SAVE FILE
    # --------------------------------------------------------

    try:

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as error:

        print(
            "File Save Error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=f"Could not save image: {str(error)}"
        )

    # --------------------------------------------------------
    # VERIFY IMAGE
    # --------------------------------------------------------

    try:

        with Image.open(file_path) as img:
            img.verify()

    except UnidentifiedImageError:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    except Exception as error:

        print(
            "Image Verification Error:",
            error
        )

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=f"Image verification failed: {str(error)}"
        )

    # --------------------------------------------------------
    # PREPROCESS IMAGE
    # --------------------------------------------------------

    try:

        processed_image = preprocess_image(
            str(file_path)
        )

        print(
            "Preprocessing completed:",
            processed_image
        )

    except Exception as error:

        print(
            "Image Preprocessing Error:",
            error
        )

        # Keep the original valid image so that detection
        # can still use it.
        print(
            "Original uploaded image retained."
        )

    # --------------------------------------------------------
    # SUCCESS RESPONSE
    # --------------------------------------------------------

    return {
        "message": "Image uploaded and processed successfully",
        "filename": safe_filename,
        "uploaded_by": current_user["email"],
        "status": "Ready for AI prediction"
    }