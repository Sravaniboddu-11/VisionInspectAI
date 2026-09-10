import os
import shutil
import random
import cv2

# ============================================================
# 1. YOUR DATASET PATH
# ============================================================

BASE_DIR = r"C:\Users\boddu\Downloads\bottle\bottle"

TRAIN_GOOD = os.path.join(BASE_DIR, "train", "good")
TEST_DIR = os.path.join(BASE_DIR, "test")
GROUND_TRUTH = os.path.join(BASE_DIR, "ground_truth")

# New YOLO dataset will be created here
OUTPUT_DIR = os.path.join(BASE_DIR, "yolo_dataset")

# ============================================================
# 2. DEFECT CLASSES
# ============================================================

CLASS_NAMES = {
    "broken_large": 0,
    "broken_small": 1,
    "contamination": 2
}

# ============================================================
# 3. CREATE YOLO FOLDERS
# ============================================================

folders = [
    os.path.join(OUTPUT_DIR, "images", "train"),
    os.path.join(OUTPUT_DIR, "images", "val"),
    os.path.join(OUTPUT_DIR, "images", "test"),

    os.path.join(OUTPUT_DIR, "labels", "train"),
    os.path.join(OUTPUT_DIR, "labels", "val"),
    os.path.join(OUTPUT_DIR, "labels", "test"),
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)

# ============================================================
# 4. IMAGE EXTENSIONS
# ============================================================

IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp")


def get_images(folder):
    if not os.path.exists(folder):
        return []

    return [
        os.path.join(folder, file)
        for file in os.listdir(folder)
        if file.lower().endswith(IMAGE_EXTENSIONS)
    ]


# ============================================================
# 5. CONVERT MASK TO YOLO BOUNDING BOX
# ============================================================

def mask_to_yolo(mask_path, class_id, label_path):

    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

    if mask is None:
        print("Could not read mask:", mask_path)
        return False

    # Convert mask to binary
    _, binary = cv2.threshold(mask, 1, 255, cv2.THRESH_BINARY)

    # Find connected defect regions
    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    height, width = binary.shape

    labels = []

    for contour in contours:

        x, y, w, h = cv2.boundingRect(contour)

        # Ignore extremely tiny regions
        if w < 3 or h < 3:
            continue

        # YOLO center coordinates
        center_x = (x + w / 2) / width
        center_y = (y + h / 2) / height

        normalized_width = w / width
        normalized_height = h / height

        labels.append(
            f"{class_id} "
            f"{center_x:.6f} "
            f"{center_y:.6f} "
            f"{normalized_width:.6f} "
            f"{normalized_height:.6f}"
        )

    if not labels:
        return False

    with open(label_path, "w") as file:
        file.write("\n".join(labels))

    return True


# ============================================================
# 6. COPY GOOD IMAGES
# ============================================================

print("\n========================================")
print("Preparing GOOD images")
print("========================================")

good_images = get_images(TRAIN_GOOD)

print("Good images found:", len(good_images))

random.seed(42)
random.shuffle(good_images)

# Use 80% for training and 20% validation
split_index = int(len(good_images) * 0.8)

good_train = good_images[:split_index]
good_val = good_images[split_index:]

for image_path in good_train:

    filename = os.path.basename(image_path)

    destination = os.path.join(
        OUTPUT_DIR,
        "images",
        "train",
        filename
    )

    shutil.copy2(image_path, destination)

    # Good image has no defect
    label_filename = os.path.splitext(filename)[0] + ".txt"

    label_path = os.path.join(
        OUTPUT_DIR,
        "labels",
        "train",
        label_filename
    )

    # Empty label file = no defect
    open(label_path, "w").close()


for image_path in good_val:

    filename = os.path.basename(image_path)

    destination = os.path.join(
        OUTPUT_DIR,
        "images",
        "val",
        filename
    )

    shutil.copy2(image_path, destination)

    label_filename = os.path.splitext(filename)[0] + ".txt"

    label_path = os.path.join(
        OUTPUT_DIR,
        "labels",
        "val",
        label_filename
    )

    open(label_path, "w").close()


# ============================================================
# 7. PROCESS DEFECT IMAGES
# ============================================================

print("\n========================================")
print("Preparing DEFECT images")
print("========================================")

for defect_name, class_id in CLASS_NAMES.items():

    image_folder = os.path.join(
        TEST_DIR,
        defect_name
    )

    mask_folder = os.path.join(
        GROUND_TRUTH,
        defect_name
    )

    images = get_images(image_folder)

    print(
        defect_name,
        "images found:",
        len(images)
    )

    random.shuffle(images)

    # 80% train, 20% validation
    split_index = int(len(images) * 0.8)

    train_images = images[:split_index]
    val_images = images[split_index:]

    # --------------------------------------------------------
    # TRAIN
    # --------------------------------------------------------

    for image_path in train_images:

        filename = os.path.basename(image_path)

        destination = os.path.join(
            OUTPUT_DIR,
            "images",
            "train",
            filename
        )

        # Prevent filename conflicts
        new_filename = f"{defect_name}_{filename}"

        destination = os.path.join(
            OUTPUT_DIR,
            "images",
            "train",
            new_filename
        )

        shutil.copy2(image_path, destination)

        # Find corresponding mask
        image_name_without_extension = os.path.splitext(filename)[0]

        mask_candidates = [
            image_name_without_extension + ".png",
            image_name_without_extension + "_mask.png"
        ]

        mask_path = None

        for candidate in mask_candidates:

            possible_path = os.path.join(
                mask_folder,
                candidate
            )

            if os.path.exists(possible_path):
                mask_path = possible_path
                break

        label_filename = (
            os.path.splitext(new_filename)[0] + ".txt"
        )

        label_path = os.path.join(
            OUTPUT_DIR,
            "labels",
            "train",
            label_filename
        )

        if mask_path:

            success = mask_to_yolo(
                mask_path,
                class_id,
                label_path
            )

            if not success:
                print(
                    "Warning: no defect region found:",
                    mask_path
                )

        else:
            print(
                "WARNING: Mask not found for:",
                filename
            )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    for image_path in val_images:

        filename = os.path.basename(image_path)

        new_filename = f"{defect_name}_{filename}"

        destination = os.path.join(
            OUTPUT_DIR,
            "images",
            "val",
            new_filename
        )

        shutil.copy2(image_path, destination)

        image_name_without_extension = os.path.splitext(filename)[0]

        mask_candidates = [
            image_name_without_extension + ".png",
            image_name_without_extension + "_mask.png"
        ]

        mask_path = None

        for candidate in mask_candidates:

            possible_path = os.path.join(
                mask_folder,
                candidate
            )

            if os.path.exists(possible_path):
                mask_path = possible_path
                break

        label_filename = (
            os.path.splitext(new_filename)[0] + ".txt"
        )

        label_path = os.path.join(
            OUTPUT_DIR,
            "labels",
            "val",
            label_filename
        )

        if mask_path:

            mask_to_yolo(
                mask_path,
                class_id,
                label_path
            )

        else:
            print(
                "WARNING: Validation mask not found:",
                filename
            )


# ============================================================
# 8. COPY TEST IMAGES
# ============================================================

print("\n========================================")
print("Preparing TEST images")
print("========================================")

for defect_name in CLASS_NAMES:

    image_folder = os.path.join(
        TEST_DIR,
        defect_name
    )

    images = get_images(image_folder)

    for image_path in images:

        filename = os.path.basename(image_path)

        new_filename = f"{defect_name}_{filename}"

        destination = os.path.join(
            OUTPUT_DIR,
            "images",
            "test",
            new_filename
        )

        shutil.copy2(image_path, destination)


# ============================================================
# 9. CREATE data.yaml
# ============================================================

yaml_path = os.path.join(
    OUTPUT_DIR,
    "data.yaml"
)

yaml_content = f"""path: {OUTPUT_DIR.replace(os.sep, '/')}
train: images/train
val: images/val
test: images/test

names:
  0: broken_large
  1: broken_small
  2: contamination
"""

with open(yaml_path, "w") as file:
    file.write(yaml_content)

# ============================================================
# 10. FINAL SUMMARY
# ============================================================

print("\n========================================")
print("YOLO DATASET PREPARATION COMPLETE")
print("========================================")

print("Dataset location:")
print(OUTPUT_DIR)

print("\nClasses:")
print("0 -> broken_large")
print("1 -> broken_small")
print("2 -> contamination")

print("\nYAML file:")
print(yaml_path)

print("\nYou can now train the YOLO model.")