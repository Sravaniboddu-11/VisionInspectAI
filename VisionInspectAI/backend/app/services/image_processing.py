import cv2


def preprocess_image(image_path: str):
    """
    Preprocess the uploaded image before AI prediction.
    """

    # Read image
    image = cv2.imread(image_path)

    if image is None:
        raise Exception("Unable to read image.")

    # Resize image
    image = cv2.resize(image, (224, 224))

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Remove noise
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)

    return denoised