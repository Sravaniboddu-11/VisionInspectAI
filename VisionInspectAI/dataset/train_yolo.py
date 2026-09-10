from ultralytics import YOLO

DATASET_YAML = r"C:\Users\boddu\Downloads\bottle\bottle\yolo_dataset\data.yaml"

print("========================================")
print("STARTING YOLO TRAINING - ROUND 3")
print("========================================")

# Use pretrained YOLO11 Nano weights
model = YOLO("yolo11n.pt")

results = model.train(
    data=DATASET_YAML,

    # Training
    epochs=100,
    imgsz=640,
    batch=8,

    # Allow training to continue while validation improves
    patience=30,

    # Use pretrained weights
    pretrained=True,

    # New output folder
    project=r"C:\Users\boddu\Downloads\bottle\bottle\runs",
    name="bottle_defect_model_round3",

    workers=2,

    # Save best and last weights
    save=True
)

print("\n========================================")
print("TRAINING COMPLETED")
print("========================================")

print(
    r"Best model:"
    r"C:\Users\boddu\Downloads\bottle\bottle"
    r"\runs\bottle_defect_model_round3"
    r"\weights\best.pt"
)