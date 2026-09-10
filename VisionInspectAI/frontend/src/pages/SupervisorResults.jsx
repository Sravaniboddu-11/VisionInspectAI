import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SupervisorSubPages.css";
import { getInspections } from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function SupervisorResults() {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // ============================================================
  // LOAD REAL INSPECTION DATA
  // ============================================================

  const loadInspections = () => {
    try {
      const data = getInspections();

      setInspections(
        Array.isArray(data) ? data : []
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

    const interval = setInterval(
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

      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ============================================================
  // DECISION
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

  // ============================================================
  // PREDICTION
  // ============================================================

  const getPrediction = (item) => {
    return String(
      item?.prediction ||
        item?.status ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  // ============================================================
  // DEFECT CLASSIFICATION
  // ============================================================

  const getDefectType = (item) => {
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
        item?.prediction ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  // ============================================================
  // CONFIDENCE
  // ============================================================

  const getConfidence = (item) => {
    let value =
      item?.confidence ??
      item?.confidenceScore ??
      item?.detectionConfidence ??
      item?.probability ??
      0;

    value = Number(value);

    if (!Number.isFinite(value)) {
      return 0;
    }

    if (value <= 1) {
      return value * 100;
    }

    return Math.min(value, 100);
  };

  // ============================================================
  // SEVERITY
  // ============================================================

  const getSeverity = (item) => {
    return String(
      item?.severityLevel ||
        item?.severity_level ||
        item?.severity ||
        ""
    ).trim();
  };

  // ============================================================
  // PRODUCT
  // ============================================================

  const getProduct = (item) => {
    return (
      item?.product ||
      item?.productName ||
      item?.image ||
      item?.filename ||
      "Unknown Product"
    );
  };

  // ============================================================
  // REVIEW
  // REVIEW IS A SEPARATE QUALITY STATUS
  // ============================================================

  const isReview = (item) => {
    return getDecision(item) === "REVIEW";
  };

  // ============================================================
  // PASSED
  // ============================================================

  const isPassed = (item) => {
    return getDecision(item) === "PASS";
  };

  // ============================================================
  // CONFIRMED DEFECTIVE
  //
  // A defect currently under REVIEW is NOT counted as a
  // confirmed defective product.
  // ============================================================

  const isConfirmedDefective = (item) => {
    return (
      item?.defect === true &&
      !isReview(item)
    );
  };

  // ============================================================
  // CLASSIFICATION
  // ============================================================

  const getClassification = (item) => {
    if (!item) {
      return "No Defect";
    }

    const raw = getDefectType(item);

    if (!item.defect) {
      return "No Defect";
    }

    if (
      raw.includes("broken_small") ||
      raw.includes("broken small") ||
      raw.includes("small_break") ||
      raw.includes("small broken")
    ) {
      return "Broken Small";
    }

    if (
      raw.includes("broken_large") ||
      raw.includes("broken large") ||
      raw.includes("large_break") ||
      raw.includes("large broken")
    ) {
      return "Broken Large";
    }

    if (raw.includes("crack")) {
      return "Crack";
    }

    if (raw.includes("scratch")) {
      return "Scratch";
    }

    if (raw.includes("missing")) {
      return "Missing Component";
    }

    if (raw.includes("contamin")) {
      return "Contamination";
    }

    if (raw.includes("manufactur")) {
      return "Manufacturing Defect";
    }

    if (
      raw === "passed" ||
      raw === "pass" ||
      raw === "normal" ||
      raw === "no defect" ||
      raw === "no_defect" ||
      raw === "good"
    ) {
      return "No Defect";
    }

    if (raw) {
      return raw
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
    }

    return "Other Defect";
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredData = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return inspections.filter(
      (item) => {
        const classification =
          getClassification(item);

        const prediction =
          isConfirmedDefective(item)
            ? "Defective"
            : "Passed";

        const decision =
          getDecision(item);

        const searchableText = [
          item?.id,
          item?._id,
          getProduct(item),
          item?.filename,
          item?.prediction,
          prediction,
          classification,
          decision,
          getSeverity(item),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          searchableText.includes(
            searchText
          );

        let matchesFilter = true;

        if (filter === "PASSED") {
          matchesFilter =
            isPassed(item);
        }

        if (filter === "DEFECTIVE") {
          matchesFilter =
            isConfirmedDefective(item);
        }

        if (filter === "REVIEW") {
          matchesFilter =
            isReview(item);
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    inspections,
    search,
    filter,
  ]);

  // ============================================================
  // DYNAMIC SUMMARY
  // ============================================================

  const total =
    inspections.length;

  const passed =
    inspections.filter(
      isPassed
    ).length;

  const defective =
    inspections.filter(
      isConfirmedDefective
    ).length;

  const review =
    inspections.filter(
      isReview
    ).length;

  const passRate =
    total > 0
      ? (
          (passed / total) *
          100
        ).toFixed(1)
      : "0.0";

  const defectRate =
    total > 0
      ? (
          (defective / total) *
          100
        ).toFixed(1)
      : "0.0";

  const reviewRate =
    total > 0
      ? (
          (review / total) *
          100
        ).toFixed(1)
      : "0.0";

  // Keep calculated rates available for existing functionality.
  void passRate;
  void defectRate;
  void reviewRate;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="supervisor-results-page">

      {/* ======================================================
          SHARED SUPERVISOR NAVBAR
          ====================================================== */}

      <SupervisorNavbar active="results" />

      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="supervisor-results-main">

        {/* HEADER */}

        <div className="supervisor-results-header">

          <div>

            <p className="supervisor-results-label">
              INSPECTION MONITORING
            </p>

            <h1>
              Inspection Results
            </h1>

            <p className="supervisor-results-description">
              Review completed product inspections
              and AI predictions.
            </p>

          </div>

          {/* SUMMARY */}

          <div className="results-summary">

            <div>

              <strong>
                {total}
              </strong>

              <span>
                Total Inspections
              </span>

            </div>

            <div className="summary-pass">

              <strong>
                {passed}
              </strong>

              <span>
                Passed
              </span>

            </div>

            <div className="summary-defect">

              <strong>
                {defective}
              </strong>

              <span>
                Defective
              </span>

            </div>

            <div className="summary-review">

              <strong>
                {review}
              </strong>

              <span>
                Review
              </span>

            </div>

          </div>

        </div>

        {/* ====================================================
            RESULTS PANEL
            ==================================================== */}

        <section className="results-panel">

          <div className="results-toolbar">

            <div className="results-filter-buttons">

              <button
                type="button"
                className={
                  filter === "ALL"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  filter === "PASSED"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("PASSED")
                }
              >
                Passed
              </button>

              <button
                type="button"
                className={
                  filter === "DEFECTIVE"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("DEFECTIVE")
                }
              >
                Defective
              </button>

              <button
                type="button"
                className={
                  filter === "REVIEW"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("REVIEW")
                }
              >
                Review
              </button>

            </div>

            <div className="results-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search inspection, product or defect..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          {/* TABLE */}

          <div className="results-table-wrapper">

            <table className="supervisor-results-table">

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
                    Defect Classification
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

                {filteredData.map(
                  (item, index) => {

                    const confirmedDefect =
                      isConfirmedDefective(
                        item
                      );

                    const prediction =
                      confirmedDefect
                        ? "Defective"
                        : isReview(item)
                        ? "Defective"
                        : "Passed";

                    const classification =
                      getClassification(
                        item
                      );

                    const confidence =
                      getConfidence(item);

                    const noDefectPassed =
                      isPassed(item) &&
                      classification ===
                        "No Defect";

                    const severity =
                      getSeverity(item) ||
                      "Low";

                    const decision =
                      getDecision(item) ||
                      (
                        isReview(item)
                          ? "REVIEW"
                          : confirmedDefect
                          ? "REJECT"
                          : "PASS"
                      );

                    return (
                      <tr
                        key={
                          item?.id ||
                          item?._id ||
                          `${item?.filename}-${index}`
                        }
                      >

                        {/* ID */}

                        <td className="inspection-id">

                          #
                          {item?.id ||
                            item?._id ||
                            index + 1}

                        </td>

                        {/* PRODUCT */}

                        <td className="product-name">

                          {getProduct(item)}

                        </td>

                        {/* PREDICTION */}

                        <td>

                          <span
                            className={`prediction-badge ${
                              prediction ===
                              "Passed"
                                ? "prediction-pass"
                                : "prediction-defective"
                            }`}
                          >
                            {prediction}
                          </span>

                        </td>

                        {/* CLASSIFICATION */}

                        <td>

                          <span
                            className={
                              classification ===
                              "No Defect"
                                ? "no-defect"
                                : "defect-name"
                            }
                          >
                            {classification}
                          </span>

                        </td>

                        {/* CONFIDENCE */}

                        <td>

                          {noDefectPassed ? (
                            <span
                              className="confidence-cell"
                            >
                              <span>
                                N/A
                              </span>
                            </span>
                          ) : (
                            <div className="confidence-cell">

                              <span>
                                {confidence.toFixed(
                                  2
                                )}
                                %
                              </span>

                              <div className="confidence-track">

                                <div
                                  className={`confidence-fill ${
                                    confidence >= 70
                                      ? "confidence-green"
                                      : confidence >= 40
                                      ? "confidence-amber"
                                      : "confidence-red"
                                  }`}
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
                            className={`severity-badge severity-${severity
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
                            className={`decision-badge decision-${decision
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
                          >
                            {decision}
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

            {filteredData.length === 0 && (

              <div className="no-results">
                No inspection results found.
              </div>

            )}

          </div>

          {/* FOOTER */}

          <div className="results-footer">

            Showing{" "}

            <strong>
              {filteredData.length}
            </strong>{" "}

            of{" "}

            <strong>
              {total}
            </strong>{" "}

            inspections

          </div>

        </section>

      </main>

    </div>
  );
}

export default SupervisorResults;