import React, {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./Supervisor.css";
import { getInspections } from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function Supervisor() {
  const navigate = useNavigate();

  const [inspections, setInspections] =
    useState([]);

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") ||
        "{}"
    );
  } catch (error) {
    console.error(
      "Invalid user data:",
      error
    );
  }

  // ============================================================
  // LOAD INSPECTIONS
  // ============================================================

  const loadInspections = () => {
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
        "Error loading inspections:",
        error
      );

      setInspections([]);
    }
  };

  useEffect(() => {
    loadInspections();

    const handleStorage = () => {
      loadInspections();
    };

    const handleFocus = () => {
      loadInspections();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        loadInspections();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const interval =
      setInterval(
        loadInspections,
        2000
      );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      clearInterval(
        interval
      );
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    sessionStorage.removeItem(
      "token"
    );

    sessionStorage.removeItem(
      "user"
    );

    navigate("/login", {
      replace: true,
    });
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getDecision = (
    item
  ) => {
    return String(
      item?.qualityDecision ||
        item?.quality_decision ||
        item?.decision ||
        ""
    )
      .trim()
      .toUpperCase();
  };

  const getPrediction = (
    item
  ) => {
    return String(
      item?.prediction ||
        item?.status ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  const getDefectType = (
    item
  ) => {
    return String(
      item?.defectType ||
        item?.defect_type ||
        item?.defectClassification ||
        item?.defect_classification ||
        item?.classification ||
        item?.predictedClass ||
        item?.predictionClass ||
        item?.class_name ||
        item?.className ||
        item?.label ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  const getConfidence = (
    item
  ) => {
    let value =
      item?.confidence ??
      item?.confidenceScore ??
      item?.detectionConfidence ??
      item?.probability ??
      0;

    value = Number(value);

    if (
      !Number.isFinite(value)
    ) {
      return 0;
    }

    return value <= 1
      ? value * 100
      : Math.min(
          value,
          100
        );
  };

  const getSeverity = (
    item
  ) => {
    return String(
      item?.severityLevel ||
        item?.severity_level ||
        item?.severity ||
        ""
    ).trim();
  };

  const getProduct = (
    item
  ) => {
    return (
      item?.product ||
      item?.productName ||
      item?.image ||
      item?.filename ||
      "Unknown Product"
    );
  };

  // ============================================================
  // QUALITY STATUS
  // ============================================================

  const isReview = (
    item
  ) => {
    return (
      getDecision(item) ===
      "REVIEW"
    );
  };

  const isPassed = (
    item
  ) => {
    const decision =
      getDecision(item);

    return (
      decision === "PASS" ||
      decision === "PASSED"
    );
  };

  const isDefective = (
    item
  ) => {
    if (isReview(item)) {
      return false;
    }

    if (isPassed(item)) {
      return false;
    }

    if (item?.defect === true) {
      return true;
    }

    const decision =
      getDecision(item);

    const prediction =
      getPrediction(item);

    const defectType =
      getDefectType(item);

    if (
      decision === "REJECT" ||
      decision === "REJECTED" ||
      decision === "FAIL" ||
      decision === "FAILED"
    ) {
      return true;
    }

    if (
      defectType &&
      defectType !== "normal" &&
      defectType !== "no defect" &&
      defectType !== "no_defect" &&
      defectType !== "none" &&
      defectType !== "good" &&
      defectType !== "passed" &&
      defectType !== "pass"
    ) {
      return true;
    }

    if (
      prediction.includes(
        "defect"
      ) ||
      prediction.includes(
        "broken"
      ) ||
      prediction.includes(
        "contamination"
      )
    ) {
      return true;
    }

    return false;
  };

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalInspections =
    inspections.length;

  const passedProducts =
    inspections.filter(
      isPassed
    ).length;

  const reviewProducts =
    inspections.filter(
      isReview
    ).length;

  const defectiveProducts =
    inspections.filter(
      isDefective
    ).length;

  const classifiedCount =
    passedProducts +
    reviewProducts +
    defectiveProducts;

  const unclassifiedCount =
    Math.max(
      0,
      totalInspections -
        classifiedCount
    );

  const finalDefectiveProducts =
    defectiveProducts +
    unclassifiedCount;

  const qualityRate =
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
          (finalDefectiveProducts /
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
  // DEFECT TYPES
  //
  // Dashboard monitoring shows exactly:
  // Broken Small
  // Broken Large
  // Contamination
  // Manufacturing Defect
  //
  // Crack, Scratch and Missing Component are excluded.
  // ============================================================

  const brokenLarge =
    inspections.filter(
      (item) => {
        if (
          !isDefective(item)
        ) {
          return false;
        }

        const type =
          getDefectType(item);

        return (
          type.includes(
            "broken_large"
          ) ||
          type.includes(
            "broken large"
          )
        );
      }
    ).length;

  const brokenSmall =
    inspections.filter(
      (item) => {
        if (
          !isDefective(item)
        ) {
          return false;
        }

        const type =
          getDefectType(item);

        return (
          type.includes(
            "broken_small"
          ) ||
          type.includes(
            "broken small"
          )
        );
      }
    ).length;

  const contamination =
    inspections.filter(
      (item) => {
        if (
          !isDefective(item)
        ) {
          return false;
        }

        const type =
          getDefectType(item);

        return type.includes(
          "contamin"
        );
      }
    ).length;

  const manufacturingDefects =
    Math.max(
      0,
      finalDefectiveProducts -
        brokenSmall -
        brokenLarge -
        contamination
    );

  // ============================================================
  // SEVERITY
  // ============================================================

  const highSeverity =
    inspections.filter(
      (item) =>
        String(
          item?.severityLevel ||
            item?.severity_level ||
            item?.severity ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "high"
    ).length;

  const mediumSeverity =
    inspections.filter(
      (item) =>
        String(
          item?.severityLevel ||
            item?.severity_level ||
            item?.severity ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "medium"
    ).length;

  const lowSeverity =
    inspections.filter(
      (item) =>
        String(
          item?.severityLevel ||
            item?.severity_level ||
            item?.severity ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "low"
    ).length;

  const criticalSeverity =
    inspections.filter(
      (item) =>
        String(
          item?.severityLevel ||
            item?.severity_level ||
            item?.severity ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "critical"
    ).length;

  // ============================================================
  // AVERAGE CONFIDENCE
  // ============================================================

  const averageConfidence =
    totalInspections > 0
      ? (
          inspections.reduce(
            (
              sum,
              item
            ) =>
              sum +
              getConfidence(
                item
              ),
            0
          ) /
          totalInspections
        ).toFixed(1)
      : "0.0";

  // ============================================================
  // RECENT INSPECTIONS
  // ============================================================

  const recentInspections =
    [...inspections]
      .sort(
        (a, b) => {
          const dateA =
            new Date(
              a?.createdAt ||
                a?.created_at ||
                a?.date ||
                a?.timestamp ||
                0
            );

          const dateB =
            new Date(
              b?.createdAt ||
                b?.created_at ||
                b?.date ||
                b?.timestamp ||
                0
            );

          return (
            dateB -
            dateA
          );
        }
      )
      .slice(
        0,
        10
      );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="supervisor-page">

      {/* ======================================================
          SHARED SUPERVISOR NAVBAR
      ====================================================== */}

      <SupervisorNavbar
        active="dashboard"
      />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="supervisor-main">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="supervisor-header">

          <div className="header-copy">

            <div className="header-label-row">

              <span className="page-label">
                FACTORY OPERATIONS
              </span>

              <span className="system-status">

                <span></span>

                SYSTEM ACTIVE

              </span>

            </div>

            <h1>
              Supervisor Dashboard
            </h1>

            <p className="header-description">
              Production quality overview,
              AI inspection performance,
              defect distribution and
              operational monitoring.
            </p>

          </div>

          <div className="supervisor-user">

            <div className="user-avatar">
              👤
            </div>

            <div className="user-details">

              <strong>
                {user?.name ||
                  user?.full_name ||
                  "Factory Supervisor"}
              </strong>

              <span>
                Factory Supervisor
              </span>

            </div>

            <div className="user-status">

              <span></span>

            </div>

          </div>

        </section>

        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <section className="statistics-section">

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon blue-icon">
                ◉
              </div>

              <span className="stat-tag blue-tag">
                ACTIVITY
              </span>

            </div>

            <div className="stat-card-value">
              {totalInspections}
            </div>

            <div className="stat-card-label">
              Total Inspections
            </div>

            <div className="stat-card-footer">
              Completed inspection records
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon green-icon">
                ✓
              </div>

              <span className="stat-tag green-tag">
                QUALITY
              </span>

            </div>

            <div className="stat-card-value">
              {passedProducts}
            </div>

            <div className="stat-card-label">
              Passed Products
            </div>

            <div className="stat-card-footer">
              {qualityRate}% production pass rate
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon red-icon">
                !
              </div>

              <span className="stat-tag red-tag">
                DEFECTS
              </span>

            </div>

            <div className="stat-card-value">
              {finalDefectiveProducts}
            </div>

            <div className="stat-card-label">
              Defective Products
            </div>

            <div className="stat-card-footer">
              {defectRate}% confirmed defect rate
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon amber-icon">
                ?
              </div>

              <span className="stat-tag amber-tag">
                REVIEW
              </span>

            </div>

            <div className="stat-card-value">
              {reviewProducts}
            </div>

            <div className="stat-card-label">
              Requires Review
            </div>

            <div className="stat-card-footer">
              {reviewRate}% of inspections
            </div>

          </div>

        </section>

        {/* ====================================================
            PRODUCTION + AI
        ==================================================== */}

        <section className="top-analytics-grid">

          <div className="dashboard-section production-overview">

            <div className="section-title">

              <div>

                <span className="section-kicker">
                  PRODUCTION HEALTH
                </span>

                <h2>
                  Production Quality
                </h2>

                <p>
                  Current manufacturing
                  quality performance
                </p>

              </div>

              <span className="live-status">

                <span></span>

                LIVE

              </span>

            </div>

            <div className="production-main">

              <div className="quality-score">

                <strong>
                  {qualityRate}%
                </strong>

                <span>
                  Quality Rate
                </span>

              </div>

              <div className="quality-progress-area">

                <div className="quality-progress-header">

                  <span>
                    Production Quality
                  </span>

                  <strong>
                    {qualityRate}%
                  </strong>

                </div>

                <div className="progress-container">

                  <div
                    className="progress-bar"
                    style={{
                      width:
                        `${qualityRate}%`,
                    }}
                  />

                </div>

                <div className="production-details">

                  <div>

                    <span className="detail-dot success-dot"></span>

                    <span>
                      Passed
                    </span>

                    <strong>
                      {passedProducts}
                    </strong>

                  </div>

                  <div>

                    <span className="detail-dot danger-dot"></span>

                    <span>
                      Defective
                    </span>

                    <strong>
                      {finalDefectiveProducts}
                    </strong>

                  </div>

                  <div>

                    <span className="detail-dot warning-dot"></span>

                    <span>
                      Review
                    </span>

                    <strong>
                      {reviewProducts}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="dashboard-section ai-overview">

            <div className="section-title">

              <div>

                <span className="section-kicker">
                  AI MONITORING
                </span>

                <h2>
                  Inspection Performance
                </h2>

                <p>
                  Computer vision inspection
                  indicators
                </p>

              </div>

            </div>

            <div className="ai-metric-grid">

              <div className="ai-metric">

                <span className="ai-metric-icon">
                  🤖
                </span>

                <div>

                  <span>
                    Avg. AI Confidence
                  </span>

                  <strong>
                    {averageConfidence}%
                  </strong>

                </div>

              </div>

              <div className="ai-metric">

                <span className="ai-metric-icon success">
                  ✓
                </span>

                <div>

                  <span>
                    Successful
                  </span>

                  <strong>
                    {passedProducts}
                  </strong>

                </div>

              </div>

              <div className="ai-metric">

                <span className="ai-metric-icon danger">
                  !
                </span>

                <div>

                  <span>
                    Detected Defects
                  </span>

                  <strong>
                    {finalDefectiveProducts}
                  </strong>

                </div>

              </div>

              <div className="ai-metric">

                <span className="ai-metric-icon warning">
                  🔎
                </span>

                <div>

                  <span>
                    Review Queue
                  </span>

                  <strong>
                    {reviewProducts}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            DEFECT DETECTION MONITORING
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="section-kicker">
                DEFECT ANALYTICS
              </span>

              <h2>
                Defect Detection Monitoring
              </h2>

              <p>
                Distribution of confirmed
                defective inspections
              </p>

            </div>

            <div className="section-stat">

              <strong>
                {finalDefectiveProducts}
              </strong>

              <span>
                Total Defects
              </span>

            </div>

          </div>

          <div className="defect-grid">

            <DefectCard
              label="Broken Small"
              value={
                brokenSmall
              }
              total={
                finalDefectiveProducts
              }
              type="warning"
            />

            <DefectCard
              label="Broken Large"
              value={
                brokenLarge
              }
              total={
                finalDefectiveProducts
              }
              type="danger"
            />

            <DefectCard
              label="Contamination"
              value={
                contamination
              }
              total={
                finalDefectiveProducts
              }
              type="info"
            />

            <DefectCard
              label="Manufacturing Defect"
              value={
                manufacturingDefects
              }
              total={
                finalDefectiveProducts
              }
              type="success"
            />

          </div>

        </section>

        {/* ====================================================
            SEVERITY
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="section-kicker">
                RISK DISTRIBUTION
              </span>

              <h2>
                Severity Distribution
              </h2>

              <p>
                Defect severity across
                inspected products
              </p>

            </div>

          </div>

          <div className="severity-grid">

            <SeverityCard
              label="Critical"
              count={
                criticalSeverity
              }
              color="critical"
            />

            <SeverityCard
              label="High"
              count={
                highSeverity
              }
              color="high"
            />

            <SeverityCard
              label="Medium"
              count={
                mediumSeverity
              }
              color="medium"
            />

            <SeverityCard
              label="Low"
              count={
                lowSeverity
              }
              color="low"
            />

          </div>

        </section>

        {/* ====================================================
            OPERATIONAL INSIGHTS
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="section-kicker">
                OPERATIONS
              </span>

              <h2>
                Operational Insights
              </h2>

              <p>
                Current observations from
                inspection activity
              </p>

            </div>

          </div>

          <div className="operational-grid">

            <div className="operation-card success">

              <div className="operation-icon">
                ✓
              </div>

              <div>

                <span>
                  INSPECTION ACTIVITY
                </span>

                <h3>
                  {totalInspections}
                </h3>

                <p>
                  Total inspection records
                  currently available in
                  the system.
                </p>

              </div>

            </div>

            <div className="operation-card warning">

              <div className="operation-icon">
                🔎
              </div>

              <div>

                <span>
                  QUALITY REVIEW
                </span>

                <h3>
                  {reviewProducts}
                </h3>

                <p>
                  Inspection records currently
                  requiring quality-engineer review.
                </p>

              </div>

            </div>

            <div className="operation-card info">

              <div className="operation-icon">
                📈
              </div>

              <div>

                <span>
                  QUALITY PERFORMANCE
                </span>

                <h3>
                  {qualityRate}%
                </h3>

                <p>
                  Current production pass rate
                  calculated from inspection records.
                </p>

              </div>

            </div>

            <div className="operation-card danger">

              <div className="operation-icon">
                !
              </div>

              <div>

                <span>
                  DEFECT RATE
                </span>

                <h3>
                  {defectRate}%
                </h3>

                <p>
                  Current confirmed defective
                  product rate.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            RECENT INSPECTIONS
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="section-kicker">
                INSPECTION HISTORY
              </span>

              <h2>
                Recent Inspections
              </h2>

              <p>
                Latest AI inspection activity
              </p>

            </div>

            <button
              type="button"
              className="view-all-button"
              onClick={() =>
                navigate(
                  "/supervisor/results"
                )
              }
            >
              View All

              <span>
                →
              </span>

            </button>

          </div>

          <div className="results-table-container">

            <table className="results-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Prediction
                  </th>

                  <th>
                    Defect
                  </th>

                  <th>
                    Confidence
                  </th>

                  <th>
                    Severity
                  </th>

                  <th>
                    Decision
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentInspections.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-table-cell"
                    >
                      No inspections available.
                    </td>

                  </tr>

                ) : (

                  recentInspections.map(
                    (
                      item,
                      index
                    ) => {

                      const passed =
                        isPassed(
                          item
                        );

                      const review =
                        isReview(
                          item
                        );

                      const defective =
                        isDefective(
                          item
                        );

                      const prediction =
                        passed
                          ? "Passed"
                          : "Defective";

                      const decision =
                        getDecision(
                          item
                        ) ||
                        (
                          review
                            ? "REVIEW"
                            : defective
                            ? "REJECT"
                            : "PASS"
                        );

                      const defectType =
                        defective ||
                        review
                          ? getDefectType(
                              item
                            )
                          : "";

                      const displayDefect =
                        !defective &&
                        !review
                          ? "No Defect"
                          : defectType
                          ? defectType.replace(
                              /_/g,
                              " "
                            )
                          : "Manufacturing Defect";

                      const severity =
                        getSeverity(
                          item
                        ) ||
                        "Low";

                      const confidence =
                        getConfidence(
                          item
                        );

                      const showConfidence =
                        passed &&
                        displayDefect ===
                          "No Defect";

                      return (

                        <tr
                          key={
                            item?.id ||
                            item?._id ||
                            `${item?.filename}-${index}`
                          }
                        >

                          {/* ID */}

                          <td>

                            <span className="table-id">

                              #
                              {item?.id ||
                                item?._id ||
                                index + 1}

                            </span>

                          </td>

                          {/* PRODUCT */}

                          <td>

                            <div className="table-product">

                              <div className="table-product-icon">
                                IMG
                              </div>

                              <div>

                                <strong>
                                  {getProduct(
                                    item
                                  )}
                                </strong>

                                <span>
                                  Inspection record
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* PREDICTION */}

                          <td>

                            <span
                              className={`status-badge ${
                                prediction ===
                                "Defective"
                                  ? "defective"
                                  : "passed"
                              }`}
                            >

                              <span></span>

                              {prediction}

                            </span>

                          </td>

                          {/* DEFECT */}

                          <td>

                            <span
                              className={
                                displayDefect ===
                                "No Defect"
                                  ? "defect-name no-defect"
                                  : "defect-name"
                              }
                            >
                              {displayDefect}
                            </span>

                          </td>

                          {/* CONFIDENCE */}

                          <td>

                            {showConfidence ? (

                              <span className="confidence-cell">
                                <strong>
                                  N/A
                                </strong>
                              </span>

                            ) : (

                              <div className="confidence-cell">

                                <strong>
                                  {confidence.toFixed(
                                    2
                                  )}
                                  %
                                </strong>

                                <div className="mini-progress">

                                  <span
                                    style={{
                                      width:
                                        `${Math.min(
                                          confidence,
                                          100
                                        )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )}

                          </td>

                          {/* SEVERITY */}

                          <td>

                            <span
                              className={`severity-label severity-${severity
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >
                              {severity}
                            </span>

                          </td>

                          {/* DECISION */}

                          <td>

                            <span
                              className={`decision-label decision-${decision
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >

                              <span></span>

                              {decision}

                            </span>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="supervisor-footer">

          <div>

            <strong>
              VisionInspectAI
            </strong>

            <span>
              Smart Manufacturing Quality
              Inspection System
            </span>

          </div>

          <span>
            Factory Supervisor Monitoring
          </span>

        </footer>

      </main>

    </div>
  );
}

// ============================================================
// DEFECT CARD
// ============================================================

function DefectCard({
  label,
  value,
  total,
  type,
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          (value / total) * 100
        )
      : 0;

  return (
    <div
      className={`defect-card ${type}`}
    >

      <div className="defect-card-top">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

      <div className="defect-bar">

        <span
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

      <small>
        {percentage.toFixed(1)}%
        of defects
      </small>

    </div>
  );
}

// ============================================================
// SEVERITY CARD
// ============================================================

function SeverityCard({
  label,
  count,
  color,
}) {
  return (
    <div
      className={`severity-card ${color}`}
    >

      <div className="severity-card-top">

        <span className="severity-indicator"></span>

        <span>
          {label}
        </span>

      </div>

      <strong>
        {count}
      </strong>

      <small>
        Inspections
      </small>

    </div>
  );
}

export default Supervisor;