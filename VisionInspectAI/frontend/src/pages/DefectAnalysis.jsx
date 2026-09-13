import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = const API_URL = "https://visioninspectai-backend-lnih.onrender.com";

function DefectAnalysis() {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD DEFECT ANALYSIS DATA
  // ============================================================

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/reports/summary`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load report (${response.status})`
        );
      }

      const data = await response.json();

      setReport(data);
    } catch (err) {
      console.error("Defect analysis error:", err);

      setError(
        "Unable to load defect analysis data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  // ============================================================
  // DEFECT TYPES
  // ============================================================

  const defectTypes = useMemo(() => {
    if (!report?.defect_types) {
      return [];
    }

    return Object.entries(report.defect_types)
      .filter(
        ([name]) =>
          name !== "No Defect" &&
          name !== "Unknown / Unclassified"
      )
      .sort((a, b) => b[1] - a[1]);
  }, [report]);

  const maxDefectCount =
    defectTypes.length > 0
      ? Math.max(...defectTypes.map((item) => item[1]))
      : 1;

  // ============================================================
  // VALUES
  // ============================================================

  const total =
    Number(report?.total_inspections) || 0;

  const defective =
    Number(report?.defective_products) || 0;

  const defectRate =
    Number(report?.defect_rate) || 0;

  const averageSeverity =
    Number(report?.average_severity) || 0;

  const averageConfidence =
    Number(report?.average_confidence) || 0;

  const severity = report?.severity || {};

  const decisions = report?.decisions || {};

  const low = Number(severity.low) || 0;
  const medium = Number(severity.medium) || 0;
  const high = Number(severity.high) || 0;
  const critical = Number(severity.critical) || 0;

  const pass =
    Number(decisions.pass) || 0;

  const review =
    Number(decisions.review) || 0;

  const reject =
    Number(decisions.reject) || 0;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="page">
          <div
            style={{
              padding: "60px",
              textAlign: "center",
            }}
          >
            <h2>
              Loading Defect Analysis...
            </h2>

            <p>
              Fetching inspection analytics
              from the backend.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <>
        <Navbar />

        <div className="page">
          <div
            style={{
              padding: "50px",
              textAlign: "center",
            }}
          >
            <h2>
              Defect Analysis Dashboard
            </h2>

            <p
              style={{
                color: "#dc2626",
                margin: "20px 0",
              }}
            >
              {error}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadAnalysis}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <>
      <Navbar />

      <div className="page">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="dashboard-header">

          <div>
            <p className="dashboard-label">
              MANUFACTURING ANALYTICS
            </p>

            <h1>
              Defect Analysis Dashboard
            </h1>

            <p className="dashboard-subtitle">
              Analyze defect categories, severity,
              quality decisions and manufacturing
              defect patterns.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={loadAnalysis}
          >
            ↻ Refresh Analysis
          </button>

        </div>

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <div className="dashboard-stats">

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              🔍
            </div>

            <div>
              <p>Total Inspections</p>

              <h2>
                {total}
              </h2>

              <span>
                Completed inspections
              </span>
            </div>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon danger">
              ⚠
            </div>

            <div>
              <p>Defective Products</p>

              <h2>
                {defective}
              </h2>

              <span>
                {defectRate.toFixed(2)}% defect rate
              </span>
            </div>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon purple">
              📊
            </div>

            <div>
              <p>Average Severity</p>

              <h2>
                {averageSeverity.toFixed(2)}
              </h2>

              <span>
                Overall severity score
              </span>
            </div>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              🎯
            </div>

            <div>
              <p>Average Confidence</p>

              <h2>
                {averageConfidence.toFixed(2)}%
              </h2>

              <span>
                AI detection confidence
              </span>
            </div>

          </div>

        </div>

        {/* ======================================================
            DEFECT DISTRIBUTION
        ====================================================== */}

        <section className="dashboard-section">

          <div className="dashboard-section-header">

            <div>
              <h2>
                Defect Type Distribution
              </h2>

              <p>
                Frequency of detected manufacturing
                defect categories.
              </p>
            </div>

          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "14px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >

            {defectTypes.length === 0 ? (

              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#64748b",
                }}
              >
                No defect classifications available.
              </div>

            ) : (

              defectTypes.map(
                ([name, count]) => {

                  const percentage =
                    defective > 0
                      ? (count / defective) * 100
                      : 0;

                  const width =
                    (count / maxDefectCount) * 100;

                  return (
                    <div
                      key={name}
                      style={{
                        marginBottom: "22px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: "8px",
                        }}
                      >

                        <strong>
                          {name}
                        </strong>

                        <span>
                          {count} (
                          {percentage.toFixed(1)}
                          %)
                        </span>

                      </div>

                      <div
                        style={{
                          height: "14px",
                          background:
                            "#e5e7eb",
                          borderRadius: "20px",
                          overflow: "hidden",
                        }}
                      >

                        <div
                          style={{
                            width: `${width}%`,
                            height: "100%",
                            background:
                              "#2563eb",
                            borderRadius:
                              "20px",
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

        {/* ======================================================
            SEVERITY + QUALITY DECISIONS
        ====================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "24px",
            marginTop: "25px",
          }}
        >

          {/* SEVERITY */}

          <section
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "14px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >

            <h2>
              Severity Analysis
            </h2>

            <p
              style={{
                color: "#64748b",
                marginBottom: "25px",
              }}
            >
              Distribution of inspection severity
              levels.
            </p>

            <SeverityRow
              label="Low"
              value={low}
              total={total}
            />

            <SeverityRow
              label="Medium"
              value={medium}
              total={total}
            />

            <SeverityRow
              label="High"
              value={high}
              total={total}
            />

            <SeverityRow
              label="Critical"
              value={critical}
              total={total}
            />

          </section>

          {/* QUALITY DECISIONS */}

          <section
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "14px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >

            <h2>
              Quality Control Decisions
            </h2>

            <p
              style={{
                color: "#64748b",
                marginBottom: "25px",
              }}
            >
              Inspection decisions generated by
              the quality-control system.
            </p>

            <DecisionRow
              label="PASS"
              value={pass}
              total={total}
            />

            <DecisionRow
              label="REVIEW"
              value={review}
              total={total}
            />

            <DecisionRow
              label="REJECT"
              value={reject}
              total={total}
            />

          </section>

        </div>

        {/* ======================================================
            MANUFACTURING INSIGHTS
        ====================================================== */}

        <section className="dashboard-section">

          <div className="dashboard-section-header">

            <div>
              <h2>
                Manufacturing Insights
              </h2>

              <p>
                Key observations from the current
                inspection data.
              </p>
            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "20px",
            }}
          >

            <InsightCard
              icon="⚠"
              title="Most Common Defect"
              value={
                defectTypes.length > 0
                  ? defectTypes[0][0]
                  : "No Data"
              }
              description={
                defectTypes.length > 0
                  ? `${defectTypes[0][1]} occurrences`
                  : "No defect data available"
              }
            />

            <InsightCard
              icon="📈"
              title="Defect Rate"
              value={`${defectRate.toFixed(2)}%`}
              description="Percentage of inspected products classified as defective."
            />

            <InsightCard
              icon="🔎"
              title="Manual Review"
              value={review}
              description="Inspections requiring Quality Engineer verification."
            />

          </div>

        </section>

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <section className="dashboard-section">

          <div
            style={{
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/results")
              }
            >
              View Inspection Results
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  "/production-quality-report"
                )
              }
            >
              View Production Report
            </button>

          </div>

        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="dashboard-footer">
          VisionInspectAI • Smart Manufacturing
          Defect Analytics
        </footer>

      </div>
    </>
  );
}

// ============================================================
// SEVERITY ROW
// ============================================================

function SeverityRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div
      style={{
        marginBottom: "22px",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginBottom: "7px",
        }}
      >

        <strong>
          {label}
        </strong>

        <span>
          {value}
        </span>

      </div>

      <div
        style={{
          height: "12px",
          background: "#e5e7eb",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >

        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background:
              label === "Critical"
                ? "#991b1b"
                : label === "High"
                ? "#dc2626"
                : label === "Medium"
                ? "#f59e0b"
                : "#16a34a",
            borderRadius: "20px",
          }}
        />

      </div>

    </div>
  );
}

// ============================================================
// DECISION ROW
// ============================================================

function DecisionRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >

      <div>

        <strong>
          {label}
        </strong>

        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginTop: "4px",
          }}
        >
          {percentage.toFixed(1)}%
        </div>

      </div>

      <strong
        style={{
          fontSize: "25px",
        }}
      >
        {value}
      </strong>

    </div>
  );
}

// ============================================================
// INSIGHT CARD
// ============================================================

function InsightCard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "22px",
        borderRadius: "14px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >

      <div
        style={{
          fontSize: "28px",
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          color: "#64748b",
          margin: 0,
        }}
      >
        {title}
      </p>

      <h3
        style={{
          margin: "8px 0",
          fontSize: "22px",
        }}
      >
        {value}
      </h3>

      <p
        style={{
          color: "#64748b",
          fontSize: "14px",
          margin: 0,
        }}
      >
        {description}
      </p>

    </div>
  );
}

export default DefectAnalysis;