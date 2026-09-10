import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInspections } from "../utils/inspectionStorage";
import "./Dashboard.css";

// ============================================================
// ICON COMPONENT
// ============================================================

function Icon({ name, size = 22 }) {

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {

    case "search":
      return (
        <svg {...common}>
          <circle
            cx="11"
            cy="11"
            r="7"
          />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3 2.8 19a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "review":
      return (
        <svg {...common}>
          <circle
            cx="11"
            cy="11"
            r="7"
          />
          <path d="m20 20-3.8-3.8" />
          <path d="M11 8v3l2 2" />
        </svg>
      );

    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );

    case "scan":
      return (
        <svg {...common}>
          <path d="M4 7V5a1 1 0 0 1 1-1h2" />
          <path d="M17 4h2a1 1 0 0 1 1 1v2" />
          <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
          <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
          <path d="M7 12h10" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v5c0 4.4-2.8 8-7 10-4.2-2-7-5.6-7-10V6l7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "robot":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="7"
            width="16"
            height="12"
            rx="3"
          />
          <path d="M12 3v4" />
          <circle
            cx="12"
            cy="2.5"
            r="1"
          />
          <circle
            cx="9"
            cy="12"
            r="1"
          />
          <circle
            cx="15"
            cy="12"
            r="1"
          />
          <path d="M9 16h6" />
        </svg>
      );

    default:
      return null;
  }
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [user, setUser] = useState(null);


  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = () => {

    const savedUser =
      localStorage.getItem("user");

    if (savedUser) {

      try {
        setUser(
          JSON.parse(savedUser)
        );
      } catch (error) {
        console.error(
          "User data error:",
          error
        );
      }
    }

    try {

      const data =
        getInspections();

      setInspections(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Inspection data error:",
        error
      );

      setInspections([]);
    }
  };


  useEffect(() => {

    loadData();

    window.addEventListener(
      "storage",
      loadData
    );

    const interval =
      setInterval(() => {

        try {

          const data =
            getInspections();

          if (Array.isArray(data)) {
            setInspections(data);
          }

        } catch (error) {

          console.error(
            "Inspection refresh error:",
            error
          );
        }

      }, 1000);


    return () => {

      window.removeEventListener(
        "storage",
        loadData
      );

      clearInterval(interval);
    };

  }, []);


  // ============================================================
  // STATISTICS
  // ============================================================

  const totalInspections =
    inspections.length;


  const reviewProducts =
    inspections.filter((item) => {

      const decision =
        String(
          item?.qualityDecision || ""
        )
          .trim()
          .toUpperCase();

      return decision === "REVIEW";

    }).length;


  const defectiveProducts =
    inspections.filter((item) => {

      const decision =
        String(
          item?.qualityDecision || ""
        )
          .trim()
          .toUpperCase();

      return (
        item?.defect === true &&
        decision !== "REVIEW"
      );

    }).length;


  const passedProducts =
    inspections.filter((item) => {

      const decision =
        String(
          item?.qualityDecision || ""
        )
          .trim()
          .toUpperCase();

      return (
        item?.defect !== true &&
        decision !== "REVIEW"
      );

    }).length;


  const passRate =
    totalInspections > 0
      ? (
          (passedProducts /
            totalInspections) *
          100
        ).toFixed(1)
      : "0.0";


  const defectRate =
    totalInspections > 0
      ? (
          (defectiveProducts /
            totalInspections) *
          100
        ).toFixed(1)
      : "0.0";


  const reviewRate =
    totalInspections > 0
      ? (
          (reviewProducts /
            totalInspections) *
          100
        ).toFixed(1)
      : "0.0";


  // ============================================================
  // USER
  // ============================================================

  const userName =
    user?.name ||
    user?.username ||
    user?.full_name ||
    "Quality Engineer";


  // ============================================================
  // RECENT INSPECTIONS
  // ============================================================

  const recentInspections = [
    ...inspections,
  ]
    .reverse()
    .slice(0, 5);


  // ============================================================
  // HELPERS
  // ============================================================

  const getProductName = (item) => {

    return (
      item?.filename ||
      item?.product ||
      item?.name ||
      "Product"
    );
  };


  const getPrediction = (item) => {

    if (item?.prediction) {

      return String(
        item.prediction
      )
        .replaceAll(
          "_",
          " "
        )
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
    }

    return item?.defect === true
      ? "Defective"
      : "Passed";
  };


  const getConfidence = (item) => {

    const value =
      Number(
        item?.confidence
      );

    if (!Number.isFinite(value)) {
      return "0.00%";
    }

    if (value <= 1) {

      return `${(
        value * 100
      ).toFixed(2)}%`;

    }

    return `${value.toFixed(2)}%`;
  };


  const getStatus = (item) => {

    const decision =
      String(
        item?.qualityDecision || ""
      )
        .trim()
        .toUpperCase();

    if (decision === "REVIEW") {
      return "REVIEW";
    }

    if (item?.defect === true) {
      return "DEFECTIVE";
    }

    return "PASS";
  };


  const getStatusClass = (status) => {

    if (status === "PASS") {
      return "status-pass";
    }

    if (
      status === "DEFECTIVE"
    ) {
      return "status-defective";
    }

    return "status-review";
  };


  // ============================================================
  // STAT CARD
  // ============================================================

  const StatCard = ({
    icon,
    label,
    value,
    description,
    tone,
  }) => (

    <div className="stat-card">

      <div
        className={`stat-icon ${tone}`}
      >
        <Icon
          name={icon}
          size={23}
        />
      </div>

      <div className="stat-content">

        <span className="stat-label">
          {label}
        </span>

        <div className="stat-value-row">
          <strong>
            {value}
          </strong>
        </div>

        <span className="stat-description">
          {description}
        </span>

      </div>

    </div>
  );


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="dashboard-page">

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="dashboard-hero">

          <div className="hero-content">

            <div className="eyebrow">

              <span className="eyebrow-dot"></span>

              AI QUALITY INSPECTION PLATFORM

            </div>

            <h1>
              Welcome back{" "}
              <span>
                {userName}
              </span>
            </h1>

            <p>
              Monitor manufacturing quality,
              analyze defects, and manage
              AI-powered product inspections
              from one workspace.
            </p>

            <div className="hero-actions">

              <button
                className="hero-primary-button"
                onClick={() =>
                  navigate("/upload")
                }
              >
                <Icon
                  name="upload"
                  size={19}
                />

                Start New Inspection
              </button>

              <button
                className="hero-secondary-button"
                onClick={() =>
                  navigate("/results")
                }
              >
                View Inspection Results

                <Icon
                  name="arrow"
                  size={18}
                />
              </button>

            </div>

          </div>


          {/* SYSTEM STATUS */}

          <div className="hero-status-card">

            <div className="hero-status-top">

              <div className="status-live">

                <span className="status-live-dot"></span>

                System Active

              </div>

              <div className="role-pill">
                Quality Engineer
              </div>

            </div>


            <div className="hero-status-divider"></div>


            <div className="hero-system-row">

              <div className="system-icon">

                <Icon
                  name="robot"
                  size={21}
                />

              </div>

              <div>

                <span>
                  AI Inspection Engine
                </span>

                <strong>
                  Ready for inspection
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <section className="stats-grid">

          <StatCard
            icon="search"
            label="Total Inspections"
            value={totalInspections}
            description="Completed inspections"
            tone="blue"
          />

          <StatCard
            icon="check"
            label="Passed Products"
            value={passedProducts}
            description={`${passRate}% overall pass rate`}
            tone="green"
          />

          <StatCard
            icon="alert"
            label="Defective Products"
            value={defectiveProducts}
            description={`${defectRate}% defect rate`}
            tone="red"
          />

          <StatCard
            icon="review"
            label="Requires Review"
            value={reviewProducts}
            description={`${reviewRate}% need verification`}
            tone="amber"
          />

        </section>


        {/* ======================================================
            WORKFLOW
        ====================================================== */}

        <section className="section-card workflow-section">

          <div className="section-heading">

            <div>

              <div className="section-kicker">
                INSPECTION PROCESS
              </div>

              <h2>
                Inspection Workflow
              </h2>

              <p>
                Follow the complete
                AI-powered quality
                inspection process.
              </p>

            </div>

          </div>


          <div className="workflow-grid">

            <div className="workflow-card">

              <div className="workflow-number">
                01
              </div>

              <div className="workflow-icon blue-bg">

                <Icon
                  name="upload"
                  size={25}
                />

              </div>

              <div className="workflow-content">

                <span className="workflow-step">
                  STEP 01
                </span>

                <h3>
                  Upload Product
                </h3>

                <p>
                  Upload a product image
                  to begin quality inspection.
                </p>

                <button
                  className="workflow-button"
                  onClick={() =>
                    navigate("/upload")
                  }
                >
                  Upload Image

                  <Icon
                    name="arrow"
                    size={17}
                  />

                </button>

              </div>

            </div>


            <div className="workflow-card">

              <div className="workflow-number">
                02
              </div>

              <div className="workflow-icon purple-bg">

                <Icon
                  name="scan"
                  size={25}
                />

              </div>

              <div className="workflow-content">

                <span className="workflow-step">
                  STEP 02
                </span>

                <h3>
                  AI Defect Detection
                </h3>

                <p>
                  Analyze the uploaded image
                  using the AI defect
                  detection engine.
                </p>

                <button
                  className="workflow-button"
                  onClick={() =>
                    navigate("/detection")
                  }
                >
                  Start Detection

                  <Icon
                    name="arrow"
                    size={17}
                  />

                </button>

              </div>

            </div>


            <div className="workflow-card">

              <div className="workflow-number">
                03
              </div>

              <div className="workflow-icon green-bg">

                <Icon
                  name="check"
                  size={25}
                />

              </div>

              <div className="workflow-content">

                <span className="workflow-step">
                  STEP 03
                </span>

                <h3>
                  Inspection Results
                </h3>

                <p>
                  Review prediction,
                  confidence, classification,
                  severity and quality
                  decision.
                </p>

                <button
                  className="workflow-button"
                  onClick={() =>
                    navigate("/results")
                  }
                >
                  View Results

                  <Icon
                    name="arrow"
                    size={17}
                  />

                </button>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            QUALITY PERFORMANCE
        ====================================================== */}

        <section className="section-card">

          <div className="section-heading">

            <div>

              <div className="section-kicker">
                QUALITY PERFORMANCE
              </div>

              <h2>
                Production Quality
              </h2>

              <p>
                Current inspection performance
                across processed products.
              </p>

            </div>

            <div className="quality-badge">
              {passRate}% Pass Rate
            </div>

          </div>


          <div className="quality-layout">

            <div className="quality-main">

              <div className="quality-progress-header">

                <div>

                  <span>
                    Overall Quality Performance
                  </span>

                  <strong>
                    {passRate}%
                  </strong>

                </div>

              </div>


              <div className="quality-progress-track">

                <div
                  className="quality-progress-value"
                  style={{
                    width:
                      `${passRate}%`,
                  }}
                />

              </div>


              <div className="quality-metrics">

                <div className="quality-metric">

                  <span className="metric-dot green-dot"></span>

                  <span>
                    Passed
                  </span>

                  <strong>
                    {passedProducts}
                  </strong>

                </div>


                <div className="quality-metric">

                  <span className="metric-dot red-dot"></span>

                  <span>
                    Defective
                  </span>

                  <strong>
                    {defectiveProducts}
                  </strong>

                </div>


                <div className="quality-metric">

                  <span className="metric-dot amber-dot"></span>

                  <span>
                    Review
                  </span>

                  <strong>
                    {reviewProducts}
                  </strong>

                </div>


                <div className="quality-metric">

                  <span className="metric-dot blue-dot"></span>

                  <span>
                    Total
                  </span>

                  <strong>
                    {totalInspections}
                  </strong>

                </div>

              </div>

            </div>


            <div className="quality-side-card">

              <div className="quality-side-icon">

                <Icon
                  name="shield"
                  size={24}
                />

              </div>

              <div>

                <span>
                  Quality Monitoring
                </span>

                <strong>
                  Continuous inspection tracking
                </strong>

                <p>
                  Track product quality and
                  identify items that require
                  additional verification.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            RECENT INSPECTIONS
        ====================================================== */}

        <section className="section-card">

          <div className="section-heading table-heading">

            <div>

              <div className="section-kicker">
                INSPECTION ACTIVITY
              </div>

              <h2>
                Recent Inspections
              </h2>

              <p>
                Latest product quality
                inspection activity.
              </p>

            </div>


            <button
              className="outline-button"
              onClick={() =>
                navigate("/results")
              }
            >
              View All

              <Icon
                name="arrow"
                size={17}
              />

            </button>

          </div>


          {recentInspections.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">

                <Icon
                  name="search"
                  size={30}
                />

              </div>

              <h3>
                No inspections yet
              </h3>

              <p>
                Upload a product image to
                begin your first quality
                inspection.
              </p>

              <button
                className="hero-primary-button"
                onClick={() =>
                  navigate("/upload")
                }
              >

                <Icon
                  name="upload"
                  size={18}
                />

                Upload Product

              </button>

            </div>

          ) : (

            <div className="table-container">

              <table className="inspection-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Prediction
                    </th>

                    <th>
                      Confidence
                    </th>

                    <th>
                      Status
                    </th>

                    <th></th>

                  </tr>

                </thead>


                <tbody>

                  {recentInspections.map(
                    (
                      inspection,
                      index
                    ) => {

                      const status =
                        getStatus(
                          inspection
                        );

                      return (

                        <tr
                          key={
                            inspection?.id ||
                            inspection?.createdAt ||
                            `${inspection?.filename}-${index}`
                          }
                        >

                          <td>

                            <div className="product-cell">

                              <div className="product-icon">

                                <Icon
                                  name="search"
                                  size={18}
                                />

                              </div>

                              <div>

                                <strong>
                                  {getProductName(
                                    inspection
                                  )}
                                </strong>

                                <span>
                                  Inspection #
                                  {index + 1}
                                </span>

                              </div>

                            </div>

                          </td>


                          <td>

                            <span className="prediction-text">

                              {getPrediction(
                                inspection
                              )}

                            </span>

                          </td>


                          <td>

                            <span className="confidence-value">

                              {getConfidence(
                                inspection
                              )}

                            </span>

                          </td>


                          <td>

                            <span
                              className={`status-pill ${getStatusClass(
                                status
                              )}`}
                            >

                              <span className="status-dot"></span>

                              {status}

                            </span>

                          </td>


                          <td>

                            <button
                              className="row-view-button"
                              onClick={() =>
                                navigate(
                                  "/results"
                                )
                              }
                            >
                              View

                              <Icon
                                name="chevron"
                                size={16}
                              />

                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ======================================================
            INFORMATION
        ====================================================== */}

        <section className="info-grid">

          <div className="info-panel">

            <div className="info-panel-icon blue-feature">

              <Icon
                name="robot"
                size={24}
              />

            </div>

            <div>

              <span className="info-panel-label">
                ARTIFICIAL INTELLIGENCE
              </span>

              <h3>
                AI-Powered Inspection
              </h3>

              <p>
                VisionInspectAI analyzes product
                images using computer vision to
                detect and classify manufacturing
                defects.
              </p>

            </div>

          </div>


          <div className="info-panel">

            <div className="info-panel-icon green-feature">

              <Icon
                name="activity"
                size={24}
              />

            </div>

            <div>

              <span className="info-panel-label">
                QUALITY MONITORING
              </span>

              <h3>
                Continuous Monitoring
              </h3>

              <p>
                Track inspection performance,
                quality trends and product
                decisions from the dashboard.
              </p>

            </div>

          </div>

        </section>


        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="dashboard-footer">

          <div>

            <strong>
              VisionInspectAI
            </strong>

            <span>
              Smart Manufacturing Quality
              Inspection System
            </span>

          </div>

          <span className="footer-status">

            <span className="status-live-dot"></span>

            Inspection System Active

          </span>

        </footer>

      </main>
    </>
  );
}

export default Dashboard;