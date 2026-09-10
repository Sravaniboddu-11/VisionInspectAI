import React, { useEffect, useMemo, useState } from "react";
import { getInspections } from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function WeeklyDefectAnalysis() {
  const [inspections, setInspections] = useState([]);

  // ============================================================
  // LOAD INSPECTIONS
  // ============================================================

  const loadInspections = () => {
    try {
      const data = getInspections();

      setInspections(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Error loading inspection data:",
        error
      );

      setInspections([]);
    }
  };

  useEffect(() => {
    loadInspections();

    const handleStorageChange = () => {
      loadInspections();
    };

    const handleFocus = () => {
      loadInspections();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadInspections();
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    const interval = setInterval(
      loadInspections,
      2000
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const getDecision = (item) => {
    return String(
      item?.qualityDecision ||
        item?.quality_decision ||
        item?.decision ||
        ""
    )
      .trim()
      .toUpperCase();
  };

  const isDefective = (item) => {
    if (getDecision(item) === "REVIEW") {
      return false;
    }

    if (getDecision(item) === "PASS") {
      return false;
    }

    if (item?.defect === true) {
      return true;
    }

    const prediction = String(
      item?.prediction ||
        item?.status ||
        item?.result ||
        ""
    )
      .trim()
      .toLowerCase();

    const defectType = String(
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

    if (
      getDecision(item) === "REJECT" ||
      getDecision(item) === "REJECTED" ||
      getDecision(item) === "FAIL" ||
      getDecision(item) === "FAILED"
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
  // GET INSPECTION DATE
  // ============================================================

  const getInspectionDate = (item) => {
    const date =
      item?.createdAt ||
      item?.created_at ||
      item?.date ||
      item?.inspectionDate ||
      item?.inspection_time ||
      item?.timestamp;

    if (!date) {
      return null;
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  // ============================================================
  // WEEKLY DATA
  // ============================================================

  const weeklyData = useMemo(() => {
    if (inspections.length === 0) {
      return [];
    }

    const validInspections = inspections
      .map((item) => ({
        item,
        date: getInspectionDate(item),
      }))
      .filter(
        (entry) => entry.date !== null
      );

    // ----------------------------------------------------------
    // ACTUAL DATE-BASED WEEKS
    // ----------------------------------------------------------

    if (validInspections.length > 0) {
      const firstDate = new Date(
        Math.min(
          ...validInspections.map(
            (entry) =>
              entry.date.getTime()
          )
        )
      );

      const weekMap = {};

      validInspections.forEach(
        ({ item, date }) => {
          const difference =
            date.getTime() -
            firstDate.getTime();

          const weekNumber =
            Math.floor(
              difference /
                (7 * 24 * 60 * 60 * 1000)
            ) + 1;

          if (!weekMap[weekNumber]) {
            weekMap[weekNumber] = {
              week: weekNumber,
              total: 0,
              defective: 0,
              passed: 0,
              review: 0,
            };
          }

          weekMap[weekNumber].total++;

          const decision =
            getDecision(item);

          if (decision === "REVIEW") {
            weekMap[weekNumber].review++;
          } else if (
            decision === "PASS"
          ) {
            weekMap[weekNumber].passed++;
          } else if (
            isDefective(item)
          ) {
            weekMap[weekNumber].defective++;
          } else {
            // Keep old/undefined records from
            // disappearing from the weekly totals.
            weekMap[weekNumber].passed++;
          }
        }
      );

      return Object.values(
        weekMap
      ).sort(
        (a, b) =>
          a.week - b.week
      );
    }

    // ----------------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------------
    // If records have no dates, divide them into
    // groups of 10.
    // ----------------------------------------------------------

    const fallbackWeeks = [];

    for (
      let i = 0;
      i < inspections.length;
      i += 10
    ) {
      const group =
        inspections.slice(
          i,
          i + 10
        );

      const defective =
        group.filter(
          isDefective
        ).length;

      const review =
        group.filter(
          (item) =>
            getDecision(item) ===
            "REVIEW"
        ).length;

      const passed =
        group.length -
        defective -
        review;

      fallbackWeeks.push({
        week:
          fallbackWeeks.length + 1,
        total: group.length,
        defective,
        passed,
        review,
      });
    }

    return fallbackWeeks;
  }, [inspections]);

  // ============================================================
  // TOTALS
  // ============================================================

  const totalInspections =
    inspections.length;

  const totalDefects =
    inspections.filter(
      isDefective
    ).length;

  const maximumDefects =
    Math.max(
      ...weeklyData.map(
        (item) =>
          item.defective
      ),
      1
    );

  // ============================================================
  // STYLES
  // ============================================================

  const pageStyle = {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px",
    fontFamily:
      "Arial, sans-serif",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div style={pageStyle}>

      {/* ======================================================
          SHARED SUPERVISOR NAVBAR
          ====================================================== */}

      <SupervisorNavbar active="weekly" />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        style={{
          marginBottom: "25px",
          marginTop: "25px",
        }}
      >

        <p
          style={{
            color: "#2563eb",
            fontWeight: "700",
            fontSize: "13px",
            letterSpacing: "1px",
            marginBottom: "6px",
          }}
        >
          MANUFACTURING ANALYTICS
        </p>

        <h1
          style={{
            margin: 0,
            color: "#111827",
          }}
        >
          Weekly Defect Analysis
        </h1>

        <p
          style={{
            color: "#64748b",
            marginTop: "8px",
          }}
        >
          Monitor weekly manufacturing
          defects and production quality
          trends.
        </p>

      </div>

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >

        {/* TOTAL INSPECTIONS */}

        <div style={cardStyle}>

          <p
            style={{
              color: "#64748b",
              margin: 0,
            }}
          >
            Total Inspections
          </p>

          <h2
            style={{
              fontSize: "32px",
              margin: "8px 0",
              color: "#111827",
            }}
          >
            {totalInspections}
          </h2>

          <span
            style={{
              color: "#64748b",
            }}
          >
            All inspection records
          </span>

        </div>

        {/* TOTAL DEFECTS */}

        <div style={cardStyle}>

          <p
            style={{
              color: "#64748b",
              margin: 0,
            }}
          >
            Total Defects
          </p>

          <h2
            style={{
              fontSize: "32px",
              margin: "8px 0",
              color: "#7c3aed",
            }}
          >
            {totalDefects}
          </h2>

          <span
            style={{
              color: "#64748b",
            }}
          >
            Detected manufacturing defects
          </span>

        </div>

        {/* WEEKS ANALYSED */}

        <div style={cardStyle}>

          <p
            style={{
              color: "#64748b",
              margin: 0,
            }}
          >
            Weeks Analysed
          </p>

          <h2
            style={{
              fontSize: "32px",
              margin: "8px 0",
              color: "#2563eb",
            }}
          >
            {weeklyData.length}
          </h2>

          <span
            style={{
              color: "#64748b",
            }}
          >
            Production monitoring periods
          </span>

        </div>

      </div>

      {/* ======================================================
          WEEKLY DEFECT CHART
          ====================================================== */}

      <div style={cardStyle}>

        <h2
          style={{
            marginTop: 0,
            color: "#111827",
          }}
        >
          Week-wise Defect Trend
        </h2>

        <p
          style={{
            color: "#64748b",
          }}
        >
          Number of defective products
          detected each week.
        </p>

        {weeklyData.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "#64748b",
            }}
          >
            No weekly inspection data available.
          </div>

        ) : (

          <div
            style={{
              display: "flex",
              alignItems:
                "flex-end",
              gap: "25px",
              minHeight: "300px",
              padding:
                "30px 10px 20px",
              overflowX: "auto",
            }}
          >

            {weeklyData.map(
              (item) => {

                const barHeight =
                  Math.max(
                    (item.defective /
                      maximumDefects) *
                      220,
                    item.defective > 0
                      ? 12
                      : 4
                  );

                return (
                  <div
                    key={
                      item.week
                    }
                    style={{
                      minWidth: "90px",
                      textAlign:
                        "center",
                    }}
                  >

                    <div
                      style={{
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom:
                          "8px",
                      }}
                    >
                      {item.defective}
                    </div>

                    <div
                      style={{
                        height: "220px",
                        display: "flex",
                        alignItems:
                          "flex-end",
                        justifyContent:
                          "center",
                      }}
                    >

                      <div
                        style={{
                          width: "55px",
                          height:
                            `${barHeight}px`,
                          background:
                            "#7c3aed",
                          borderRadius:
                            "8px 8px 0 0",
                          transition:
                            "height 0.3s ease",
                        }}
                      />

                    </div>

                    <strong
                      style={{
                        display: "block",
                        marginTop:
                          "10px",
                        color:
                          "#374151",
                      }}
                    >
                      Week {item.week}
                    </strong>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          WEEKLY TABLE
          ====================================================== */}

      <div
        style={{
          ...cardStyle,
          marginTop: "24px",
        }}
      >

        <h2
          style={{
            marginTop: 0,
            color: "#111827",
          }}
        >
          Weekly Production Quality
        </h2>

        <div
          style={{
            overflowX: "auto",
          }}
        >

          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              marginTop: "15px",
            }}
          >

            <thead>

              <tr
                style={{
                  background:
                    "#f8fafc",
                }}
              >

                <th style={tableHeader}>
                  Week
                </th>

                <th style={tableHeader}>
                  Inspections
                </th>

                <th style={tableHeader}>
                  Defective
                </th>

                <th style={tableHeader}>
                  Passed
                </th>

                <th style={tableHeader}>
                  Review
                </th>

                <th style={tableHeader}>
                  Defect Rate
                </th>

              </tr>

            </thead>

            <tbody>

              {weeklyData.map(
                (item) => {

                  const defectRate =
                    item.total >
                    0
                      ? (
                          (item.defective /
                            item.total) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={
                        item.week
                      }
                    >

                      <td style={tableCell}>
                        <strong>
                          Week{" "}
                          {item.week}
                        </strong>
                      </td>

                      <td style={tableCell}>
                        {item.total}
                      </td>

                      <td
                        style={{
                          ...tableCell,
                          fontWeight:
                            "700",
                          color:
                            "#7c3aed",
                        }}
                      >
                        {item.defective}
                      </td>

                      <td
                        style={{
                          ...tableCell,
                          color:
                            "#15803d",
                          fontWeight:
                            "600",
                        }}
                      >
                        {item.passed}
                      </td>

                      <td
                        style={{
                          ...tableCell,
                          color:
                            "#b45309",
                          fontWeight:
                            "600",
                        }}
                      >
                        {item.review}
                      </td>

                      <td style={tableCell}>
                        {defectRate}%
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================================================
          INFORMATION
          ====================================================== */}

      <div
        style={{
          ...cardStyle,
          marginTop: "24px",
        }}
      >

        <h2
          style={{
            marginTop: 0,
            color: "#111827",
          }}
        >
          Weekly Quality Monitoring
        </h2>

        <p
          style={{
            color: "#64748b",
            lineHeight: "1.7",
          }}
        >
          This dashboard allows the Factory
          Supervisor to monitor manufacturing
          quality week by week. It highlights
          the number of inspections, defective
          products, passed products and
          inspections requiring review.
        </p>

        <p
          style={{
            color: "#64748b",
            lineHeight: "1.7",
          }}
        >
          Example: Week 1 can show 30
          defective products, Week 2 can show
          25 defective products, allowing
          production quality trends to be
          compared over time.
        </p>

      </div>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer
        style={{
          textAlign: "center",
          marginTop: "30px",
          paddingBottom: "20px",
          color: "#64748b",
        }}
      >
        VisionInspectAI • Weekly Manufacturing
        Defect Monitoring
      </footer>

    </div>
  );
}

// ============================================================
// TABLE STYLES
// ============================================================

const tableHeader = {
  padding: "14px",
  textAlign: "left",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#475569",
  fontSize: "14px",
};

const tableCell = {
  padding: "14px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
};

export default WeeklyDefectAnalysis;