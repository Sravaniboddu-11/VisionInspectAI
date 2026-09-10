import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./SupervisorAnalytics.css";
import { getInspections } from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function SupervisorAnalytics() {
  const navigate = useNavigate();

  const [inspections, setInspections] =
    useState([]);

  // ============================================================
  // LOAD DYNAMIC INSPECTION DATA
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

    const handleVisibility = () => {
      if (!document.hidden) {
        loadInspections();
      }
    };

    const handleFocus = () => {
      loadInspections();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.addEventListener(
      "focus",
      handleFocus
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

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      clearInterval(
        interval
      );
    };
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

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

  const getSeverity = (
    item
  ) => {
    return String(
      item?.severityLevel ||
        item?.severity_level ||
        item?.severity ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  // ============================================================
  // REVIEW
  // ============================================================

  const isReview = (
    item
  ) => {
    return (
      getDecision(item) ===
      "REVIEW"
    );
  };

  // ============================================================
  // PASS
  // ============================================================

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

  // ============================================================
  // CONFIRMED DEFECTIVE
  // ============================================================

  const isDefective = (
    item
  ) => {
    // REVIEW is a separate category.
    if (isReview(item)) {
      return false;
    }

    // PASS is a separate category.
    if (isPassed(item)) {
      return false;
    }

    // Explicit defect flag.
    if (item?.defect === true) {
      return true;
    }

    const prediction =
      getPrediction(item);

    const defectType =
      getDefectType(item);

    const decision =
      getDecision(item);

    // Explicit reject/fail decisions.
    if (
      decision === "REJECT" ||
      decision === "REJECTED" ||
      decision === "FAIL" ||
      decision === "FAILED"
    ) {
      return true;
    }

    // Any meaningful defect classification.
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

    // Defect-related prediction.
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
  // TOTAL / PASS / DEFECT / REVIEW
  // ============================================================

  const total =
    inspections.length;

  const passed =
    inspections.filter(
      isPassed
    ).length;

  const review =
    inspections.filter(
      isReview
    ).length;

  const rawDefective =
    inspections.filter(
      isDefective
    ).length;

  const classifiedCount =
    passed +
    review +
    rawDefective;

  const unclassified =
    Math.max(
      0,
      total -
        classifiedCount
    );

  const defective =
    rawDefective +
    unclassified;

  const passRate =
    total > 0
      ? (
          (passed /
            total) *
          100
        ).toFixed(1)
      : "0.0";

  const defectRate =
    total > 0
      ? (
          (defective /
            total) *
          100
        ).toFixed(1)
      : "0.0";

  const reviewRate =
    total > 0
      ? (
          (review /
            total) *
          100
        ).toFixed(1)
      : "0.0";

  // ============================================================
  // SEVERITY DISTRIBUTION
  //
  // Represents all inspection records.
  // ============================================================

  const critical =
    inspections.filter(
      (item) =>
        getSeverity(item) ===
        "critical"
    ).length;

  const high =
    inspections.filter(
      (item) =>
        getSeverity(item) ===
        "high"
    ).length;

  const medium =
    inspections.filter(
      (item) =>
        getSeverity(item) ===
        "medium"
    ).length;

  const low =
    inspections.filter(
      (item) =>
        getSeverity(item) ===
        "low"
    ).length;

  // ============================================================
  // DEFECT DETECTION MONITORING
  //
  // EXACTLY FOUR DISPLAY CATEGORIES:
  //
  // 1. Broken Small
  // 2. Broken Large
  // 3. Contamination
  // 4. Manufacturing Defect
  //
  // Crack, Scratch and Missing Component are not displayed.
  // ============================================================

  const defectDistribution =
    useMemo(() => {
      const categories = [
        "Broken Small",
        "Broken Large",
        "Contamination",
        "Manufacturing Defect",
      ];

      const counts = {
        "Broken Small": 0,
        "Broken Large": 0,
        Contamination: 0,
        "Manufacturing Defect": 0,
      };

      inspections.forEach(
        (item) => {
          if (
            !isDefective(item)
          ) {
            return;
          }

          const raw =
            getDefectType(item);

          let label =
            "Manufacturing Defect";

          // ------------------------------
          // BROKEN SMALL
          // ------------------------------

          if (
            raw.includes(
              "broken_small"
            ) ||
            raw.includes(
              "broken small"
            ) ||
            raw.includes(
              "small_break"
            ) ||
            raw.includes(
              "small broken"
            )
          ) {
            label =
              "Broken Small";
          }

          // ------------------------------
          // BROKEN LARGE
          // ------------------------------

          else if (
            raw.includes(
              "broken_large"
            ) ||
            raw.includes(
              "broken large"
            ) ||
            raw.includes(
              "large_break"
            ) ||
            raw.includes(
              "large broken"
            )
          ) {
            label =
              "Broken Large";
          }

          // ------------------------------
          // CONTAMINATION
          // ------------------------------

          else if (
            raw.includes(
              "contamin"
            )
          ) {
            label =
              "Contamination";
          }

          // ------------------------------
          // MANUFACTURING DEFECT
          // ------------------------------

          else if (
            raw.includes(
              "manufactur"
            )
          ) {
            label =
              "Manufacturing Defect";
          }

          // ------------------------------
          // ONLY FOUR CATEGORIES ALLOWED
          // ------------------------------

          if (
            categories.includes(
              label
            )
          ) {
            counts[label]++;
          }
        }
      );

      return categories
        .map(
          (label) => ({
            label,
            count:
              counts[label],
          })
        )
        .sort(
          (a, b) =>
            b.count -
            a.count
        );
    }, [inspections]);

  const maxDefect =
    Math.max(
      ...defectDistribution.map(
        (item) =>
          item.count
      ),
      1
    );

  // ============================================================
  // AVERAGE AI CONFIDENCE
  // ============================================================

  const averageConfidence =
    total > 0
      ? (
          inspections.reduce(
            (
              sum,
              item
            ) => {
              let value =
                Number(
                  item?.confidence ??
                    item?.confidenceScore ??
                    item?.detectionConfidence ??
                    item?.probability ??
                    0
                );

              if (
                !Number.isFinite(
                  value
                )
              ) {
                value = 0;
              }

              if (
                value <= 1
              ) {
                value *= 100;
              }

              return (
                sum +
                Math.min(
                  Math.max(
                    value,
                    0
                  ),
                  100
                )
              );
            },
            0
          ) / total
        ).toFixed(1)
      : "0.0";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="supervisor-analytics-page">

      {/* ======================================================
          SHARED SUPERVISOR NAVBAR
      ====================================================== */}

      <SupervisorNavbar
        active="analytics"
      />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="supervisor-analytics-main">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="analytics-header">

          <div>

            <p className="analytics-label">
              QUALITY ANALYTICS
            </p>

            <h1>
              Production Analytics
            </h1>

            <p>
              Analyze inspection performance,
              manufacturing defects and
              quality trends.
            </p>

          </div>

          <div className="analytics-status">

            <span></span>

            Live Data

          </div>

        </div>

        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <section className="analytics-kpi-grid">

          <div className="analytics-kpi blue">

            <div className="analytics-kpi-icon">
              ⌕
            </div>

            <div>

              <span>
                Total Inspections
              </span>

              <strong>
                {total}
              </strong>

              <small>
                Overall inspections
              </small>

            </div>

          </div>

          <div className="analytics-kpi green">

            <div className="analytics-kpi-icon">
              ✓
            </div>

            <div>

              <span>
                Pass Rate
              </span>

              <strong>
                {passRate}%
              </strong>

              <small>
                {passed} passed products
              </small>

            </div>

          </div>

          <div className="analytics-kpi red">

            <div className="analytics-kpi-icon">
              !
            </div>

            <div>

              <span>
                Defect Rate
              </span>

              <strong>
                {defectRate}%
              </strong>

              <small>
                {defective} defective products
              </small>

            </div>

          </div>

          <div className="analytics-kpi purple">

            <div className="analytics-kpi-icon">
              ?
            </div>

            <div>

              <span>
                Review Rate
              </span>

              <strong>
                {reviewRate}%
              </strong>

              <small>
                {review} require review
              </small>

            </div>

          </div>

        </section>

        {/* ====================================================
            QUALITY OVERVIEW
        ==================================================== */}

        <section className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Quality Overview
              </h2>

              <p>
                Current production inspection
                performance
              </p>

            </div>

            <div className="analytics-live-value">

              <span>
                AI Confidence
              </span>

              <strong>
                {averageConfidence}%
              </strong>

            </div>

          </div>

          <div className="quality-overview">

            <div
              className="quality-circle"
              style={{
                "--pass-rate":
                  passRate,
              }}
            >

              <div>

                <strong>
                  {passRate}%
                </strong>

                <span>
                  Pass Rate
                </span>

              </div>

            </div>

            <div className="quality-bars">

              <div className="quality-bar-row">

                <div>

                  <span>
                    Passed Products
                  </span>

                  <strong>
                    {passed}
                  </strong>

                </div>

                <div className="analytics-progress">

                  <div
                    className="analytics-progress-green"
                    style={{
                      width:
                        `${passRate}%`,
                    }}
                  />

                </div>

              </div>

              <div className="quality-bar-row">

                <div>

                  <span>
                    Defective Products
                  </span>

                  <strong>
                    {defective}
                  </strong>

                </div>

                <div className="analytics-progress">

                  <div
                    className="analytics-progress-red"
                    style={{
                      width:
                        `${defectRate}%`,
                    }}
                  />

                </div>

              </div>

              <div className="quality-bar-row">

                <div>

                  <span>
                    Manual Review
                  </span>

                  <strong>
                    {review}
                  </strong>

                </div>

                <div className="analytics-progress">

                  <div
                    className="analytics-progress-purple"
                    style={{
                      width:
                        `${reviewRate}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            INSPECTION DISTRIBUTION + SEVERITY
        ==================================================== */}

        <section className="analytics-two-column">

          {/* INSPECTION DISTRIBUTION */}

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <h2>
                  Inspection Distribution
                </h2>

                <p>
                  Passed, defective and
                  review cases
                </p>

              </div>

            </div>

            <div className="distribution-chart">

              <div className="distribution-item">

                <div
                  className="distribution-circle green-circle"
                  style={{
                    "--pass-rate":
                      passRate,
                  }}
                >

                  <strong>
                    {passRate}%
                  </strong>

                </div>

                <div>

                  <strong>
                    Passed
                  </strong>

                  <span>
                    {passed} inspections
                  </span>

                </div>

              </div>

              <div className="distribution-item">

                <div
                  className="distribution-circle red-circle"
                  style={{
                    "--defect-rate":
                      defectRate,
                  }}
                >

                  <strong>
                    {defectRate}%
                  </strong>

                </div>

                <div>

                  <strong>
                    Defective
                  </strong>

                  <span>
                    {defective} inspections
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* SEVERITY */}

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <h2>
                  Severity Analysis
                </h2>

                <p>
                  Current inspection severity
                  distribution
                </p>

              </div>

            </div>

            <div className="severity-list">

              <div className="severity-row">

                <div>

                  <span className="severity-dot critical"></span>

                  Critical

                </div>

                <strong>
                  {critical}
                </strong>

              </div>

              <div className="severity-row">

                <div>

                  <span className="severity-dot high"></span>

                  High

                </div>

                <strong>
                  {high}
                </strong>

              </div>

              <div className="severity-row">

                <div>

                  <span className="severity-dot medium"></span>

                  Medium

                </div>

                <strong>
                  {medium}
                </strong>

              </div>

              <div className="severity-row">

                <div>

                  <span className="severity-dot low"></span>

                  Low

                </div>

                <strong>
                  {low}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            DEFECT DETECTION MONITORING
        ==================================================== */}

        <section className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <div className="analytics-label">
                DEFECT ANALYTICS
              </div>

              <h2>
                Defect Detection Monitoring
              </h2>

              <p>
                Distribution of confirmed defective
                inspections
              </p>

            </div>

            <div className="analytics-live-value">

              <span>
                Total Defects
              </span>

              <strong>
                {defective}
              </strong>

            </div>

          </div>

          <div className="defect-analytics-list">

            {defectDistribution.map(
              (
                item,
                index
              ) => {

                const percentage =
                  defective > 0
                    ? (
                        (item.count /
                          defective) *
                        100
                      ).toFixed(1)
                    : "0.0";

                const width =
                  (
                    item.count /
                    maxDefect
                  ) * 100;

                return (
                  <div
                    className="defect-analytics-row"
                    key={
                      `${item.label}-${index}`
                    }
                  >

                    <div className="defect-analytics-header">

                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.count}
                      </strong>

                    </div>

                    <div className="defect-analytics-track">

                      <div
                        style={{
                          width:
                            `${width}%`,
                        }}
                      />

                    </div>

                    <small>
                      {percentage}% of defects
                    </small>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* ====================================================
            OPERATIONAL INSIGHTS
        ==================================================== */}

        <section className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Operational Insights
              </h2>

              <p>
                Current observations from
                inspection data
              </p>

            </div>

          </div>

          <div className="analytics-insights">

            <div className="analytics-insight success">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Quality Performance
                </strong>

                <p>
                  {passRate}% of the current
                  inspection records passed
                  quality inspection.
                </p>

              </div>

            </div>

            <div className="analytics-insight danger">

              <span>
                !
              </span>

              <div>

                <strong>
                  Defect Rate
                </strong>

                <p>
                  {defectRate}% of the current
                  inspection records are confirmed
                  as defective.
                </p>

              </div>

            </div>

            <div className="analytics-insight warning">

              <span>
                🔎
              </span>

              <div>

                <strong>
                  Quality Review
                </strong>

                <p>
                  {review} current inspections
                  require quality-engineer review.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default SupervisorAnalytics;