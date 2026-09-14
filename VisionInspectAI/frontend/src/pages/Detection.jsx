import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { saveInspection } from "../utils/inspectionStorage";
import "./Detection.css";

const BACKEND_URL = "https://visioninspectai-jvbu.onrender.com";

function Detection() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadedImage = localStorage.getItem("uploadedImage");

  const runDetection = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    if (!uploadedImage) {
      alert("Please upload a product image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post(
        "/detection/predict",
        {
          filename: uploadedImage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      console.log("Backend Detection Response:", data);

      const severity = data.severity || {};
      const qualityControl = data.quality_control || {};
      const imageQuality = data.image_quality || {};

      const confidence = Number(data.confidence || 0);

      const confidenceScore = Number(
        severity.confidence_score ?? confidence * 100
      );

      const inspectionData = {
        id: Date.now(),

        filename: data.filename || uploadedImage,

        prediction: data.prediction || "Unknown",

        confidence: confidence,

        defect: data.defect === true,

        defectType:
          data.defect_classification ||
          "No Defect",

        image_quality: imageQuality,

        sizeScore: Number(
          severity.size_score ?? 0
        ),

        locationScore: Number(
          severity.location_score ?? 0
        ),

        defectTypeScore: Number(
          severity.defect_type_score ?? 0
        ),

        confidenceScore: Number(
          confidenceScore
        ),

        severityScore: Number(
          severity.overall_score ?? 0
        ),

        severityLevel:
          severity.level || "Low",

        qualityDecision:
          qualityControl.decision ||
          "REVIEW",

        recommendedAction:
          qualityControl.recommended_action ||
          "Manual inspection required.",

        inspectedBy:
          data.inspected_by ||
          "Unknown User",

        role:
          data.role ||
          "Quality Engineer",

        createdAt:
          new Date().toISOString(),
      };

      console.log(
        "Complete Inspection Data:",
        inspectionData
      );

      setResult(inspectionData);

      localStorage.setItem(
        "inspectionResult",
        JSON.stringify(inspectionData)
      );

      saveInspection(inspectionData);

      alert(
        "Inspection completed successfully!"
      );
    } catch (error) {
      console.error(
        "Detection Error:",
        error
      );

      if (error.response) {
        console.log(
          "STATUS:",
          error.response.status
        );

        console.log(
          "BACKEND ERROR:",
          error.response.data
        );

        const backendMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Detection failed.";

        alert(
          `Detection failed:\n\n${backendMessage}`
        );
      } else if (error.request) {
        console.error(
          "No response received from backend:",
          error.request
        );

        alert(
          `Cannot connect to backend.\n\n${error.message}`
        );
      } else {
        alert(
          `Request error:\n\n${error.message}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrediction = (value) => {
    if (!value) {
      return "Unknown";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) => letter.toUpperCase()
      );
  };

  const getDecisionClass = (decision) => {
    const value = String(decision || "")
      .trim()
      .toUpperCase();

    if (value === "PASS") {
      return "decision-pass";
    }

    if (value === "REJECT") {
      return "decision-reject";
    }

    return "decision-review";
  };

  const getSeverityClass = (severity) => {
    const value = String(severity || "")
      .trim()
      .toLowerCase();

    if (value === "critical") {
      return "severity-critical";
    }

    if (value === "high") {
      return "severity-high";
    }

    if (value === "medium") {
      return "severity-medium";
    }

    return "severity-low";
  };

  const quality =
    result?.image_quality?.quality || {};

  const imageInfo =
    result?.image_quality?.image || {};

  return (
    <>
      <Navbar />

      <main className="detection-page">

        {/* PAGE HEADER */}

        <section className="detection-header">

          <div>

            <span className="detection-kicker">
              AI-POWERED QUALITY INSPECTION
            </span>

            <h1>
              Product Detection
            </h1>

            <p>
              Analyze the uploaded product image
              using the VisionInspectAI defect
              detection engine.
            </p>

          </div>

          <div className="detection-system-status">

            <span className="system-status-dot"></span>

            AI Engine Ready

          </div>

        </section>

        {/* MAIN INSPECTION CARD */}

        <section className="detection-card">

          <div className="detection-card-header">

            <div>

              <span className="card-kicker">
                INSPECTION INPUT
              </span>

              <h2>
                Uploaded Product
              </h2>

              <p>
                Review the image before starting
                AI detection.
              </p>

            </div>

            {uploadedImage && (
              <div className="image-ready-badge">

                <span></span>

                Image Ready

              </div>
            )}

          </div>

          {/* IMAGE AREA */}

          {uploadedImage ? (

            <div className="detection-image-section">

              <div className="detection-image-wrapper">

                <img
                  src={`${BACKEND_URL}/uploads/${encodeURIComponent(
                    uploadedImage
                  )}`}
                  alt="Uploaded Product"
                  className="detection-product-image"
                  onError={(e) => {
                    console.error(
                      "Image failed to load:",
                      e.currentTarget.src
                    );
                  }}
                />

              </div>

              <div className="image-file-name">

                <span className="file-badge">
                  IMG
                </span>

                <div>

                  <strong>
                    {uploadedImage}
                  </strong>

                  <span>
                    Uploaded product image
                  </span>

                </div>

              </div>

            </div>

          ) : (

            <div className="no-image-state">

              <div className="no-image-icon">
                IMG
              </div>

              <h3>
                No product image available
              </h3>

              <p>
                Please upload a product image
                before starting detection.
              </p>

            </div>

          )}

          {/* DETECTION ACTION */}

          <div className="detection-action-area">

            <div className="detection-action-info">

              <div className="ai-status-icon">
                AI
              </div>

              <div>

                <strong>
                  AI Defect Detection
                </strong>

                <span>
                  Analyze product defects, image
                  quality, severity and quality
                  decision.
                </span>

              </div>

            </div>

            <button
              className="run-detection-button"
              onClick={runDetection}
              disabled={
                loading || !uploadedImage
              }
            >

              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Inspecting...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Inspect Product
                </>
              )}

            </button>

          </div>

        </section>

        {/* RESULT */}

        {result && (

          <section className="result-section">

            {/* RESULT HEADER */}

            <div className="result-header">

              <div>

                <span className="detection-kicker">
                  INSPECTION OUTPUT
                </span>

                <h2>
                  Inspection Result
                </h2>

                <p>
                  AI-generated product inspection
                  analysis.
                </p>

              </div>

              <div
                className={`decision-badge ${getDecisionClass(
                  result.qualityDecision
                )}`}
              >

                <span></span>

                {result.qualityDecision}

              </div>

            </div>

            {/* SUMMARY CARDS */}

            <div className="result-summary-grid">

              <div className="result-summary-card">

                <span className="summary-label">
                  PREDICTION
                </span>

                <strong>
                  {formatPrediction(
                    result.prediction
                  )}
                </strong>

                <small>
                  AI classification
                </small>

              </div>

              <div className="result-summary-card">

                <span className="summary-label">
                  CONFIDENCE
                </span>

                <strong>
                  {(
                    result.confidence * 100
                  ).toFixed(2)}
                  %
                </strong>

                <small>
                  Detection confidence
                </small>

              </div>

              <div className="result-summary-card">

                <span className="summary-label">
                  DEFECT
                </span>

                <strong
                  className={
                    result.defect
                      ? "text-danger"
                      : "text-success"
                  }
                >
                  {result.defect
                    ? "Detected"
                    : "Not Detected"}
                </strong>

                <small>
                  Inspection status
                </small>

              </div>

              <div className="result-summary-card">

                <span className="summary-label">
                  CLASSIFICATION
                </span>

                <strong>
                  {formatPrediction(
                    result.defectType
                  )}
                </strong>

                <small>
                  Defect category
                </small>

              </div>

            </div>

            {/* IMAGE QUALITY */}

            <div className="result-panel">

              <div className="result-panel-header">

                <div>

                  <span className="panel-kicker">
                    IMAGE ANALYSIS
                  </span>

                  <h3>
                    Image Quality Analysis
                  </h3>

                </div>

              </div>

              {result.image_quality ? (

                <div className="analysis-grid">

                  <div className="analysis-item">

                    <span>
                      Dimensions
                    </span>

                    <strong>
                      {imageInfo.width || "-"}
                      {" × "}
                      {imageInfo.height || "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Format
                    </span>

                    <strong>
                      {imageInfo.format || "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Brightness
                    </span>

                    <strong>
                      {quality.brightness || "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Brightness Value
                    </span>

                    <strong>
                      {quality.brightness_value ?? "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Contrast
                    </span>

                    <strong>
                      {quality.contrast || "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Contrast Value
                    </span>

                    <strong>
                      {quality.contrast_value ?? "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Blur
                    </span>

                    <strong>
                      {quality.blur || "-"}
                    </strong>

                  </div>

                  <div className="analysis-item">

                    <span>
                      Blur Value
                    </span>

                    <strong>
                      {quality.blur_value ?? "-"}
                    </strong>

                  </div>

                  <div className="analysis-item overall-quality">

                    <span>
                      Overall Image Quality
                    </span>

                    <strong>
                      {quality.overall || "-"}
                    </strong>

                  </div>

                </div>

              ) : (

                <div className="unavailable-message">
                  Image quality analysis unavailable.
                </div>

              )}

            </div>

            {/* SEVERITY */}

            <div className="result-panel">

              <div className="result-panel-header">

                <div>

                  <span className="panel-kicker">
                    RISK ASSESSMENT
                  </span>

                  <h3>
                    Severity Assessment
                  </h3>

                </div>

                <span
                  className={`severity-badge ${getSeverityClass(
                    result.severityLevel
                  )}`}
                >
                  {result.severityLevel}
                </span>

              </div>

              <div className="severity-score-main">

                <div>

                  <span>
                    Overall Severity Score
                  </span>

                  <strong>
                    {result.severityScore}
                    <small>/100</small>
                  </strong>

                </div>

                <div className="severity-progress">

                  <div
                    className="severity-progress-fill"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            result.severityScore || 0
                          ),
                          0
                        ),
                        100
                      )}%`,
                    }}
                  ></div>

                </div>

              </div>

              <div className="severity-grid">

                <div className="severity-item">

                  <span>
                    Size Score
                  </span>

                  <strong>
                    {result.sizeScore}/100
                  </strong>

                </div>

                <div className="severity-item">

                  <span>
                    Location Score
                  </span>

                  <strong>
                    {result.locationScore}/100
                  </strong>

                </div>

                <div className="severity-item">

                  <span>
                    Defect Type Score
                  </span>

                  <strong>
                    {result.defectTypeScore}/100
                  </strong>

                </div>

                <div className="severity-item">

                  <span>
                    Confidence Score
                  </span>

                  <strong>
                    {Number(
                      result.confidenceScore || 0
                    ).toFixed(0)}
                    /100
                  </strong>

                </div>

              </div>

            </div>

            {/* QUALITY CONTROL */}

            <div className="result-panel quality-control-panel">

              <div className="result-panel-header">

                <div>

                  <span className="panel-kicker">
                    FINAL QUALITY CONTROL
                  </span>

                  <h3>
                    Quality Control Decision
                  </h3>

                </div>

                <div
                  className={`large-decision ${getDecisionClass(
                    result.qualityDecision
                  )}`}
                >
                  {result.qualityDecision}
                </div>

              </div>

              <div className="recommendation-box">

                <div className="recommendation-icon">
                  !
                </div>

                <div>

                  <span>
                    RECOMMENDED ACTION
                  </span>

                  <strong>
                    {result.recommendedAction}
                  </strong>

                </div>

              </div>

            </div>

            {/* INSPECTION DETAILS */}

            <div className="result-panel">

              <div className="result-panel-header">

                <div>

                  <span className="panel-kicker">
                    RECORD INFORMATION
                  </span>

                  <h3>
                    Inspection Details
                  </h3>

                </div>

              </div>

              <div className="details-grid">

                <div className="detail-item">

                  <span>
                    Inspected By
                  </span>

                  <strong>
                    {result.inspectedBy}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Role
                  </span>

                  <strong>
                    {result.role}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Image
                  </span>

                  <strong>
                    {result.filename}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Inspection Time
                  </span>

                  <strong>
                    {result.createdAt
                      ? new Date(
                          result.createdAt
                        ).toLocaleString()
                      : "-"}
                  </strong>

                </div>

              </div>

            </div>

          </section>

        )}

      </main>
    </>
  );
}

export default Detection;