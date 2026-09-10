import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getInspections } from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function QualityAnalytics() {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);

  // ============================================================
  // LOAD INSPECTIONS
  // ============================================================

  const loadInspections = () => {
    try {
      const data = getInspections();

      if (Array.isArray(data)) {
        setInspections(data);
      } else {
        setInspections([]);
      }
    } catch (error) {
      console.error(
        "Unable to load inspections:",
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

    const interval = setInterval(() => {
      loadInspections();
    }, 1000);

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

      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // DECISION
  // ============================================================

  const getDecision = (item) => {
    const decision = String(
      item?.qualityDecision ||
        item?.quality_decision ||
        item?.decision ||
        item?.status ||
        ""
    )
      .trim()
      .toUpperCase();

    if (
      decision === "REVIEW"
    ) {
      return "REVIEW";
    }

    if (
      decision === "REJECT" ||
      decision === "REJECTED" ||
      decision === "FAIL" ||
      decision === "FAILED"
    ) {
      return "REJECT";
    }

    if (
      decision === "PASS" ||
      decision === "PASSED"
    ) {
      return "PASS";
    }

    return "";
  };

  // ============================================================
  // PREDICTION
  // ============================================================

  const getPrediction = (item) => {
    return String(
      item?.prediction ||
        item?.classification ||
        item?.defectType ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  // ============================================================
  // CONFIRMED DEFECT
  //
  // REVIEW IS NOT COUNTED AS A CONFIRMED DEFECT.
  // ONLY REJECTED DEFECTS ARE COUNTED HERE.
  // ============================================================

  const isConfirmedDefective = (item) => {
    const decision =
      getDecision(item);

    if (
      decision === "REVIEW"
    ) {
      return false;
    }

    if (
      decision === "PASS"
    ) {
      return false;
    }

    if (
      decision === "REJECT"
    ) {
      return true;
    }

    // Fallback for older records
    // that may not contain a decision.
    if (
      item?.defect === true
    ) {
      return true;
    }

    const prediction =
      getPrediction(item);

    return (
      prediction.includes("defect") ||
      prediction.includes("broken") ||
      prediction.includes("crack") ||
      prediction.includes("scratch") ||
      prediction.includes("missing") ||
      prediction.includes("contamination")
    );
  };

  // ============================================================
  // DEFECT CLASSIFICATION
  // ============================================================

  const getDefectType = (item) => {
    let type =
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
      item?.prediction ||
      "";

    type = String(type).trim();

    const normalized =
      type.toLowerCase();

    // No defect values
    if (
      !type ||
      normalized === "normal" ||
      normalized === "pass" ||
      normalized === "passed" ||
      normalized === "good" ||
      normalized === "ok" ||
      normalized === "no defect" ||
      normalized === "no_defect" ||
      normalized === "none"
    ) {
      return null;
    }

    // Broken Small
    if (
      normalized === "broken_small" ||
      normalized === "broken small" ||
      normalized.includes("broken_small") ||
      normalized.includes("broken small")
    ) {
      return "Broken Small";
    }

    // Broken Large
    if (
      normalized === "broken_large" ||
      normalized === "broken large" ||
      normalized.includes("broken_large") ||
      normalized.includes("broken large")
    ) {
      return "Broken Large";
    }

    // Manufacturing Defect
    if (
      normalized.includes("manufacturing")
    ) {
      return "Manufacturing Defect";
    }

    // Crack
    if (
      normalized.includes("crack")
    ) {
      return "Crack";
    }

    // Scratch
    if (
      normalized.includes("scratch")
    ) {
      return "Scratch";
    }

    // Missing Component
    if (
      normalized.includes("missing") &&
      normalized.includes("component")
    ) {
      return "Missing Component";
    }

    // Contamination
    if (
      normalized.includes("contamination") ||
      normalized.includes("contamin")
    ) {
      return "Contamination";
    }

    return type;
  };

  // ============================================================
  // CONFIDENCE
  // ============================================================

  const getConfidence = (item) => {
    let value =
      item?.confidence ??
      item?.confidenceScore ??
      item?.confidence_score;

    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value === "string"
    ) {
      value = parseFloat(
        value.replace("%", "").trim()
      );
    }

    value = Number(value);

    if (Number.isNaN(value)) {
      return null;
    }

    // Convert 0-1 into percentage
    if (
      value >= 0 &&
      value <= 1
    ) {
      value *= 100;
    }

    return Math.min(
      Math.max(value, 0),
      100
    );
  };

  // ============================================================
  // SEVERITY SCORE
  // ============================================================

  const getSeverityScore = (item) => {
    let value =
      item?.severityScore ??
      item?.severity_score;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    value = Number(value);

    if (Number.isNaN(value)) {
      return null;
    }

    return Math.min(
      Math.max(value, 0),
      100
    );
  };

  // ============================================================
  // SEVERITY LEVEL
  // ============================================================

  const getSeverityLevel = (item) => {
    const level = String(
      item?.severityLevel ||
        item?.severity_level ||
        item?.severity ||
        ""
    )
      .trim()
      .toLowerCase();

    if (
      level === "low"
    ) {
      return "Low";
    }

    if (
      level === "medium"
    ) {
      return "Medium";
    }

    if (
      level === "high"
    ) {
      return "High";
    }

    if (
      level === "critical"
    ) {
      return "Critical";
    }

    const score =
      getSeverityScore(item);

    if (score === null) {
      return null;
    }

    if (score >= 80) {
      return "Critical";
    }

    if (score >= 60) {
      return "High";
    }

    if (score >= 40) {
      return "Medium";
    }

    return "Low";
  };

  // ============================================================
  // ANALYSIS
  // ============================================================

  const analysis = useMemo(() => {
    const total =
      inspections.length;

    // ----------------------------------------------------------
    // QUALITY CONTROL DECISIONS
    // ----------------------------------------------------------

    let passed = 0;
    let review = 0;
    let rejected = 0;

    inspections.forEach(
      (item) => {
        const decision =
          getDecision(item);

        if (
          decision === "PASS"
        ) {
          passed++;
        } else if (
          decision === "REVIEW"
        ) {
          review++;
        } else if (
          decision === "REJECT"
        ) {
          rejected++;
        }
      }
    );

    // ----------------------------------------------------------
    // CONFIRMED DEFECTS
    // ----------------------------------------------------------

    const defective =
      inspections.filter(
        isConfirmedDefective
      ).length;

    const defectRate =
      total > 0
        ? (defective / total) * 100
        : 0;

    // ----------------------------------------------------------
    // CONFIDENCE
    //
    // Preserve the existing behavior:
    // average all valid AI confidence values.
    // ----------------------------------------------------------

    const confidenceValues =
      inspections
        .map((item) =>
          getConfidence(item)
        )
        .filter(
          (value) =>
            value !== null &&
            !Number.isNaN(value)
        );

    const averageConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          confidenceValues.length
        : 0;

    // ----------------------------------------------------------
    // SEVERITY
    //
    // Severity is calculated only for confirmed
    // rejected/defective products.
    // ----------------------------------------------------------

    const severityValues =
      inspections
        .filter(
          isConfirmedDefective
        )
        .map((item) =>
          getSeverityScore(item)
        )
        .filter(
          (value) =>
            value !== null &&
            !Number.isNaN(value)
        );

    const averageSeverity =
      severityValues.length > 0
        ? severityValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          severityValues.length
        : 0;

    // ----------------------------------------------------------
    // DEFECT TYPES
    //
    // IMPORTANT:
    // REVIEW records are excluded.
    // Only confirmed defective records are counted.
    // ----------------------------------------------------------

    const defectTypes = {};

    inspections.forEach(
      (item) => {
        if (
          !isConfirmedDefective(item)
        ) {
          return;
        }

        const type =
          getDefectType(item);

        if (!type) {
          return;
        }

        defectTypes[type] =
          (defectTypes[type] || 0) + 1;
      }
    );

    // ----------------------------------------------------------
    // SORT DEFECT TYPES
    // ----------------------------------------------------------

    const sortedDefectTypes =
      Object.fromEntries(
        Object.entries(
          defectTypes
        ).sort(
          ([, countA], [, countB]) =>
            countB - countA
        )
      );

    // ----------------------------------------------------------
    // SEVERITY LEVELS
    //
    // ONLY CONFIRMED DEFECTS.
    // ----------------------------------------------------------

    const severity = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    inspections.forEach(
      (item) => {
        if (
          !isConfirmedDefective(item)
        ) {
          return;
        }

        const level =
          getSeverityLevel(item);

        if (
          level &&
          severity[level] !==
            undefined
        ) {
          severity[level]++;
        }
      }
    );

    return {
      total,
      defective,
      defectRate,
      averageConfidence,
      averageSeverity,
      defectTypes:
        sortedDefectTypes,
      severity,
      passed,
      review,
      rejected,
    };
  }, [inspections]);

  // ============================================================
  // STYLES
  // ============================================================

  const pageStyle = {
    minHeight: "100vh",

    background: "#111827",

    fontFamily:
      "Arial, Helvetica, sans-serif",

    color: "#F8FAFC",

    boxSizing: "border-box",
  };

  const contentStyle = {
    padding:
      "35px 45px",

    boxSizing:
      "border-box",
  };

  const cardStyle = {
    background: "#1E293B",

    borderRadius: "14px",

    padding: "24px",

    border:
      "1px solid #334155",

    boxShadow:
      "0 8px 24px rgba(0, 0, 0, 0.20)",
  };

  const sectionStyle = {
    ...cardStyle,

    marginTop: "24px",
  };

  const getPercentage = (
    value
  ) => {
    if (
      analysis.defective ===
      0
    ) {
      return 0;
    }

    return Math.round(
      (value /
        analysis.defective) *
        100
    );
  };

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div style={pageStyle}>

      {/* ======================================================
          SUPERVISOR NAVBAR
          ====================================================== */}

      <SupervisorNavbar
        active="analytics"
      />

      {/* ======================================================
          PAGE CONTENT
          ====================================================== */}

      <main style={contentStyle}>

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "25px",
            gap: "20px",
            flexWrap:
              "wrap",
          }}
        >

          <div>

            <div
              style={{
                color: "#38BDF8",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1.5px",
                marginBottom: "8px",
              }}
            >
              FACTORY QUALITY ANALYTICS
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                color: "#F8FAFC",
                fontWeight: "700",
              }}
            >
              Defect Analysis Dashboard
            </h1>

            <p
              style={{
                color: "#94A3B8",
                marginTop: "8px",
                fontSize: "16px",
              }}
            >
              AI-powered manufacturing defect
              analysis and quality monitoring
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/supervisor/results"
              )
            }
            style={{
              border:
                "1px solid #334155",

              background:
                "#2563EB",

              color:
                "#F8FAFC",

              padding:
                "12px 20px",

              borderRadius:
                "9px",

              cursor:
                "pointer",

              fontWeight:
                "600",

              fontSize:
                "15px",

              transition:
                "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "#38BDF8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "#2563EB";
            }}
          >
            View Inspection Results →
          </button>

        </div>

        {/* ====================================================
            KPI CARDS
            ==================================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap:
              "20px",
          }}
        >

          {/* TOTAL */}

          <div style={cardStyle}>

            <div
              style={{
                color:
                  "#94A3B8",
                fontSize:
                  "16px",
              }}
            >
              Total Inspections
            </div>

            <div
              style={{
                fontSize:
                  "34px",
                fontWeight:
                  "700",
                marginTop:
                  "8px",
                color:
                  "#F8FAFC",
              }}
            >
              {analysis.total}
            </div>

            <small
              style={{
                color:
                  "#94A3B8",
              }}
            >
              Inspections analyzed
            </small>

          </div>

          {/* CONFIRMED DEFECTS */}

          <div style={cardStyle}>

            <div
              style={{
                color:
                  "#94A3B8",
                fontSize:
                  "16px",
              }}
            >
              Total Defects
            </div>

            <div
              style={{
                fontSize:
                  "34px",
                fontWeight:
                  "700",
                marginTop:
                  "8px",
                color:
                  "#F8FAFC",
              }}
            >
              {analysis.defective}
            </div>

            <small
              style={{
                color:
                  "#38BDF8",
                fontWeight:
                  "600",
              }}
            >
              {analysis.defectRate.toFixed(
                1
              )}
              % defect rate
            </small>

          </div>

          {/* CONFIDENCE */}

          <div style={cardStyle}>

            <div
              style={{
                color:
                  "#94A3B8",
                fontSize:
                  "16px",
              }}
            >
              Average Confidence
            </div>

            <div
              style={{
                fontSize:
                  "34px",
                fontWeight:
                  "700",
                marginTop:
                  "8px",
                color:
                  "#F8FAFC",
              }}
            >
              {analysis.averageConfidence.toFixed(
                2
              )}
              %
            </div>

            <small
              style={{
                color:
                  "#94A3B8",
              }}
            >
              AI prediction confidence
            </small>

          </div>

          {/* SEVERITY */}

          <div style={cardStyle}>

            <div
              style={{
                color:
                  "#94A3B8",
                fontSize:
                  "16px",
              }}
            >
              Average Severity
            </div>

            <div
              style={{
                fontSize:
                  "34px",
                fontWeight:
                  "700",
                marginTop:
                  "8px",
                color:
                  "#F8FAFC",
              }}
            >
              {analysis.averageSeverity.toFixed(
                2
              )}
              /100
            </div>

            <small
              style={{
                color:
                  "#94A3B8",
              }}
            >
              Confirmed defect severity
            </small>

          </div>

        </div>

        {/* ====================================================
            DEFECT TYPE ANALYSIS
            ==================================================== */}

        <div style={sectionStyle}>

          <h2
            style={{
              marginTop: 0,
              marginBottom:
                "22px",
              fontSize:
                "25px",
              color:
                "#F8FAFC",
            }}
          >
            Defect Type Analysis
          </h2>

          {Object.keys(
            analysis.defectTypes
          ).length === 0 ? (

            <p
              style={{
                color:
                  "#94A3B8",
                marginTop:
                  "20px",
              }}
            >
              No defect classification data
              available.
            </p>

          ) : (

            Object.entries(
              analysis.defectTypes
            ).map(
              ([type, count]) => {

                const percentage =
                  getPercentage(
                    count
                  );

                return (
                  <div
                    key={type}
                    style={{
                      marginBottom:
                        "20px",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          "8px",
                      }}
                    >

                      <strong
                        style={{
                          color:
                            "#F8FAFC",
                          fontSize:
                            "15px",
                        }}
                      >
                        {type}
                      </strong>

                      <span
                        style={{
                          color:
                            "#94A3B8",
                        }}
                      >
                        {count} ({percentage}%)
                      </span>

                    </div>

                    <div
                      style={{
                        width:
                          "100%",
                        height:
                          "10px",
                        background:
                          "#334155",
                        borderRadius:
                          "10px",
                        overflow:
                          "hidden",
                      }}
                    >

                      <div
                        style={{
                          width:
                            `${percentage}%`,
                          height:
                            "100%",
                          background:
                            "#2563EB",
                          borderRadius:
                            "10px",
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

        {/* ====================================================
            SEVERITY ANALYSIS
            ==================================================== */}

        <div style={sectionStyle}>

          <h2
            style={{
              marginTop: 0,
              marginBottom:
                "22px",
              fontSize:
                "25px",
              color:
                "#F8FAFC",
            }}
          >
            Severity Analysis
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "16px",
            }}
          >

            {/* LOW */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                background:
                  "rgba(34, 197, 94, 0.10)",
                border:
                  "1px solid rgba(34, 197, 94, 0.35)",
              }}
            >

              <div
                style={{
                  color:
                    "#22C55E",
                  fontWeight:
                    "600",
                }}
              >
                Low
              </div>

              <strong
                style={{
                  display:
                    "block",
                  fontSize:
                    "30px",
                  marginTop:
                    "5px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.severity.Low}
              </strong>

              <div
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Minor defects
              </div>

            </div>

            {/* MEDIUM */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                background:
                  "rgba(245, 158, 11, 0.10)",
                border:
                  "1px solid rgba(245, 158, 11, 0.35)",
              }}
            >

              <div
                style={{
                  color:
                    "#F59E0B",
                  fontWeight:
                    "600",
                }}
              >
                Medium
              </div>

              <strong
                style={{
                  display:
                    "block",
                  fontSize:
                    "30px",
                  marginTop:
                    "5px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.severity.Medium}
              </strong>

              <div
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Inspection required
              </div>

            </div>

            {/* HIGH */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                background:
                  "rgba(239, 68, 68, 0.10)",
                border:
                  "1px solid rgba(239, 68, 68, 0.35)",
              }}
            >

              <div
                style={{
                  color:
                    "#EF4444",
                  fontWeight:
                    "600",
                }}
              >
                High
              </div>

              <strong
                style={{
                  display:
                    "block",
                  fontSize:
                    "30px",
                  marginTop:
                    "5px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.severity.High}
              </strong>

              <div
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Rework recommended
              </div>

            </div>

            {/* CRITICAL */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                background:
                  "rgba(239, 68, 68, 0.16)",
                border:
                  "1px solid rgba(239, 68, 68, 0.45)",
              }}
            >

              <div
                style={{
                  color:
                    "#EF4444",
                  fontWeight:
                    "600",
                }}
              >
                Critical
              </div>

              <strong
                style={{
                  display:
                    "block",
                  fontSize:
                    "30px",
                  marginTop:
                    "5px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.severity.Critical}
              </strong>

              <div
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Product rejection
              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            QUALITY CONTROL DECISIONS
            ==================================================== */}

        <div style={sectionStyle}>

          <h2
            style={{
              marginTop:
                0,
              marginBottom:
                "22px",
              fontSize:
                "25px",
              color:
                "#F8FAFC",
            }}
          >
            Quality Control Decisions
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "18px",
            }}
          >

            {/* PASS */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                border:
                  "1px solid rgba(34, 197, 94, 0.35)",
                background:
                  "rgba(34, 197, 94, 0.10)",
              }}
            >

              <h3
                style={{
                  color:
                    "#22C55E",
                  marginTop:
                    0,
                }}
              >
                PASS
              </h3>

              <strong
                style={{
                  fontSize:
                    "30px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.passed}
              </strong>

              <p
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Products accepted
              </p>

            </div>

            {/* REVIEW */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                border:
                  "1px solid rgba(245, 158, 11, 0.35)",
                background:
                  "rgba(245, 158, 11, 0.10)",
              }}
            >

              <h3
                style={{
                  color:
                    "#F59E0B",
                  marginTop:
                    0,
                }}
              >
                REVIEW
              </h3>

              <strong
                style={{
                  fontSize:
                    "30px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.review}
              </strong>

              <p
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Manual verification
              </p>

            </div>

            {/* REJECT */}

            <div
              style={{
                padding:
                  "20px",
                borderRadius:
                  "12px",
                border:
                  "1px solid rgba(239, 68, 68, 0.35)",
                background:
                  "rgba(239, 68, 68, 0.10)",
              }}
            >

              <h3
                style={{
                  color:
                    "#EF4444",
                  marginTop:
                    0,
                }}
              >
                REJECT
              </h3>

              <strong
                style={{
                  fontSize:
                    "30px",
                  color:
                    "#F8FAFC",
                }}
              >
                {analysis.rejected}
              </strong>

              <p
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                Products rejected
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            QUALITY ASSESSMENT
            ==================================================== */}

        <div style={sectionStyle}>

          <h2
            style={{
              marginTop:
                0,
              marginBottom:
                "22px",
              fontSize:
                "25px",
              color:
                "#F8FAFC",
            }}
          >
            Quality Assessment
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap:
                "20px",
            }}
          >

            {/* DEFECT RATE */}

            <div>

              <strong
                style={{
                  color:
                    "#F8FAFC",
                }}
              >
                Defect Rate
              </strong>

              <div
                style={{
                  fontSize:
                    "27px",
                  fontWeight:
                    "700",
                  marginTop:
                    "8px",
                  color:
                    "#38BDF8",
                }}
              >
                {analysis.defectRate.toFixed(
                  2
                )}
                %
              </div>

              <p
                style={{
                  color:
                    "#94A3B8",
                  lineHeight:
                    "1.5",
                }}
              >
                Percentage of inspected products
                confirmed as defective.
              </p>

            </div>

            {/* AI CONFIDENCE */}

            <div>

              <strong
                style={{
                  color:
                    "#F8FAFC",
                }}
              >
                AI Confidence
              </strong>

              <div
                style={{
                  fontSize:
                    "27px",
                  fontWeight:
                    "700",
                  marginTop:
                    "8px",
                  color:
                    "#38BDF8",
                }}
              >
                {analysis.averageConfidence.toFixed(
                  2
                )}
                %
              </div>

              <p
                style={{
                  color:
                    "#94A3B8",
                  lineHeight:
                    "1.5",
                }}
              >
                Average confidence of the AI
                predictions.
              </p>

            </div>

            {/* SEVERITY SCORE */}

            <div>

              <strong
                style={{
                  color:
                    "#F8FAFC",
                }}
              >
                Severity Score
              </strong>

              <div
                style={{
                  fontSize:
                    "27px",
                  fontWeight:
                    "700",
                  marginTop:
                    "8px",
                  color:
                    "#38BDF8",
                }}
              >
                {analysis.averageSeverity.toFixed(
                  2
                )}
                /100
              </div>

              <p
                style={{
                  color:
                    "#94A3B8",
                  lineHeight:
                    "1.5",
                }}
              >
                Average severity score among
                confirmed defective products.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            FOOTER
            ==================================================== */}

        <div
          style={{
            textAlign:
              "center",

            color:
              "#94A3B8",

            marginTop:
              "30px",

            paddingBottom:
              "20px",

            fontSize:
              "14px",
          }}
        >
          VisionInspectAI • Defect Analysis &
          Manufacturing Quality Monitoring
        </div>

      </main>
    </div>
  );
}

export default QualityAnalytics;