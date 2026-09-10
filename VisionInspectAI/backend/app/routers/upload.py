import os
import shutil

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from PIL import Image

from app.services.image_processing import preprocess_image
from app.utils.jwt_handler import get_current_user

router = APIRouter(
    prefix="/upload",
    tags=["Image Upload"]
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    # Allow only image files
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed."
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Verify image
        img = Image.open(file_path)
        img.verify()

        # Preprocess image
        processed_image = preprocess_image(file_path)

    except Exception:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    return {
        "message": "Image uploaded and processed successfully",
        "filename": file.filename,
        "uploaded_by": current_user["email"],
        "status": "Ready for AI prediction"
    }