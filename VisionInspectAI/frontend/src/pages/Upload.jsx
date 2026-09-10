import {
  useState,
} from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "./Upload.css";

function Upload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setPreview(
        URL.createObjectURL(file)
      );
      setMessage("");
    }
  };

  const uploadImage = async () => {
    if (!image) {
      alert(
        "Please select an image."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      image
    );

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      alert(
        "Please login again."
      );
      return;
    }

    try {
      const response =
        await api.post(
          "/upload/image",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setMessage(
        response.data.message
      );

      localStorage.setItem(
        "uploadedImage",
        response.data.filename
      );

      alert(
        "Image uploaded successfully!"
      );

    } catch (error) {
      console.log(
        "Upload Error:",
        error
      );

      if (error.response) {
        alert(
          error.response.data.detail ||
            "Upload failed."
        );
      } else {
        alert(
          "Cannot connect to backend."
        );
      }
    }
  };

  return (
    <>
      <Navbar />

      <main className="upload-page">

        <section className="upload-header">

          <div>
            <span className="upload-kicker">
              PRODUCT IMAGE ACQUISITION
            </span>

            <h1>
              Upload Product Image
            </h1>

            <p>
              Upload a product image to begin AI-powered
              manufacturing quality inspection.
            </p>
          </div>

          <div className="upload-system-status">
            <span className="upload-status-dot"></span>
            Inspection System Ready
          </div>

        </section>

        <section className="upload-card">

          <div className="upload-card-header">

            <div>
              <h2>
                Product Image
              </h2>

              <p>
                Select an image of the product you want to inspect.
              </p>
            </div>

            <div className="supported-format">
              JPG · PNG · JPEG
            </div>

          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >

            <label
              className="upload-dropzone"
              style={{
                flex: "1 1 280px",
                cursor: "pointer",
              }}
            >

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
              />

              <div className="upload-zone-icon">
                ↑
              </div>

              <h3>
                Select Product Image
              </h3>

              <p>
                Click here to browse and select an image
              </p>

              <span>
                Supported image formats: JPG, PNG, JPEG
              </span>

            </label>

          </div>

          {preview && (
            <div className="preview-section">

              <div className="preview-header">

                <div>
                  <span className="preview-kicker">
                    SELECTED IMAGE
                  </span>

                  <h3>
                    Image Preview
                  </h3>
                </div>

                <span className="preview-ready">
                  Ready for upload
                </span>

              </div>

              <div className="preview-container">

                <img
                  src={preview}
                  alt="Product Preview"
                  className="preview-image"
                />

              </div>

              <div className="selected-file">

                <span className="file-icon">
                  IMG
                </span>

                <div>

                  <strong>
                    {image?.name ||
                      "Selected product image"}
                  </strong>

                  <span>
                    {image
                      ? `${(
                          image.size /
                          1024
                        ).toFixed(
                          1
                        )} KB`
                      : "Image selected"}
                  </span>

                </div>

              </div>

            </div>
          )}

          <div className="upload-actions">

            <button
              type="button"
              className="upload-button"
              onClick={uploadImage}
              disabled={!image}
            >
              <span>
                ↑
              </span>

              Upload Image
            </button>

          </div>

          {message && (
            <div className="upload-success">

              <div className="success-icon">
                ✓
              </div>

              <div>

                <strong>
                  Upload Successful
                </strong>

                <p>
                  {message}
                </p>

              </div>

            </div>
          )}

        </section>

        <section className="upload-info-grid">

          <div className="upload-info-card">

            <div className="info-icon blue">
              AI
            </div>

            <div>

              <h3>
                AI Inspection
              </h3>

              <p>
                The uploaded image will be processed by the
                AI defect detection system.
              </p>

            </div>

          </div>

          <div className="upload-info-card">

            <div className="info-icon cyan">
              ✓
            </div>

            <div>

              <h3>
                Image Validation
              </h3>

              <p>
                Product images are prepared for accurate
                inspection and defect analysis.
              </p>

            </div>

          </div>

          <div className="upload-info-card">

            <div className="info-icon purple">
              QC
            </div>

            <div>

              <h3>
                Quality Control
              </h3>

              <p>
                Detection results can be reviewed before the
                final quality decision.
              </p>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}

export default Upload;