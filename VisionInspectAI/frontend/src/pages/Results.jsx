import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import Navbar from "../components/Navbar";
import { getInspections } from "../utils/inspectionStorage";
import "./Results.css";

function Results() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] =
    useState(null);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

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
        "Error loading inspections:",
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
      handleStorageChange
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    const timer = setInterval(() => {
      loadInspections();
    }, 1000);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      clearInterval(timer);
    };
  }, []);

  // ============================================================
  // GET DECISION
  // ============================================================

  const getQualityDecision = (inspection) => {
    if (!inspection) {
      return "REVIEW";
    }

    const storedDecision = String(
      inspection.qualityDecision ??
        inspection.quality_decision ??
        inspection.decision ??
        ""
    )
      .trim()
      .toUpperCase();

    // Existing stored decision has priority.
    if (
      storedDecision === "PASS" ||
      storedDecision === "PASSED"
    ) {
      return "PASS";
    }

    if (
      storedDecision === "REVIEW"
    ) {
      return "REVIEW";
    }

    if (
      storedDecision === "REJECT" ||
      storedDecision === "REJECTED" ||
      storedDecision === "FAIL" ||
      storedDecision === "FAILED"
    ) {
      return "REJECT";
    }

    // ========================================================
    // FALLBACK DECISION
    // ========================================================

    const defect =
      inspection.defect === true;

    const confidence =
      getConfidenceValue(inspection);

    const severity =
      calculateSeverity(inspection);

    if (
      !defect &&
      confidence >= 70
    ) {
      return "PASS";
    }

    if (severity >= 80) {
      return "REJECT";
    }

    return "REVIEW";
  };

  // ============================================================
  // DEFECT CLASSIFICATION
  // ============================================================

  const classifyDefect = (inspection) => {
    if (!inspection) {
      return "No Defect";
    }

    const decision =
      getQualityDecision(inspection);

    // PASS always means No Defect for result classification.
    if (decision === "PASS") {
      return "No Defect";
    }

    const rawValue =
      inspection.defectType ||
      inspection.defect_type ||
      inspection.defectClassification ||
      inspection.defect_classification ||
      inspection.classification ||
      inspection.predictedClass ||
      inspection.predictionClass ||
      inspection.class_name ||
      inspection.className ||
      inspection.label ||
      inspection.prediction ||
      "";

    const text = String(rawValue)
      .trim()
      .toLowerCase();

    if (
      text === "passed" ||
      text === "pass" ||
      text === "normal" ||
      text === "no defect" ||
      text === "no_defect" ||
      text === "good"
    ) {
      return "No Defect";
    }

    if (
      text.includes("broken_large") ||
      text.includes("broken-large") ||
      text.includes("broken large") ||
      text.includes("large_break") ||
      text.includes("large broken") ||
      text.includes("largebreak")
    ) {
      return "Broken Large";
    }

    if (
      text.includes("broken_small") ||
      text.includes("broken-small") ||
      text.includes("broken small") ||
      text.includes("small_break") ||
      text.includes("small broken") ||
      text.includes("smallbreak")
    ) {
      return "Broken Small";
    }

    if (
      text.includes("crack") ||
      text.includes("cracked")
    ) {
      return "Crack";
    }

    if (
      text.includes("scratch") ||
      text.includes("scratched")
    ) {
      return "Scratch";
    }

    if (
      text.includes("missing_component") ||
      text.includes("missing-component") ||
      text.includes("missing component") ||
      text.includes("component missing") ||
      text.includes("missing")
    ) {
      return "Missing Component";
    }

    if (
      text.includes("contamination") ||
      text.includes("contaminated") ||
      text.includes("contamin")
    ) {
      return "Contamination";
    }

    if (
      text.includes("manufacturing_defect") ||
      text.includes("manufacturing defect") ||
      text.includes("manufacture")
    ) {
      return "Manufacturing Defect";
    }

    if (text.length > 0) {
      return String(rawValue);
    }

    if (
      inspection.defect === true
    ) {
      return "Other Defect";
    }

    return "No Defect";
  };

  // ============================================================
  // CONFIDENCE
  // ============================================================

  const getConfidenceValue = (inspection) => {
    if (!inspection) {
      return 0;
    }

    const possibleValues = [
      inspection.confidence,
      inspection.confidenceScore,
      inspection.confidence_score,
      inspection.detectionConfidence,
      inspection.detection_confidence,
      inspection.probability,
    ];

    let value = possibleValues.find(
      (item) =>
        item !== undefined &&
        item !== null &&
        item !== ""
    );

    value = Number(value);

    if (!Number.isFinite(value)) {
      return 0;
    }

    return value <= 1
      ? value * 100
      : value;
  };

  // ============================================================
  // DISPLAY CONFIDENCE
  // ============================================================

  const getConfidence = (inspection) => {
    if (!inspection) {
      return "N/A";
    }

    const decision =
      getQualityDecision(inspection);

    const defectType =
      classifyDefect(inspection);

    // No defect has no defect-detection confidence.
    if (
      decision === "PASS" &&
      defectType === "No Defect"
    ) {
      return "N/A";
    }

    return `${getConfidenceValue(
      inspection
    ).toFixed(2)}%`;
  };

  // ============================================================
  // SEVERITY CALCULATION
  // ============================================================

  const calculateSeverity = (inspection) => {
    const defectType =
      classifyDefect(inspection);

    // No Defect must always have zero severity.
    if (defectType === "No Defect") {
      return 0;
    }

    let sizeScore = 40;

    if (defectType === "Broken Large") {
      sizeScore = 95;
    } else if (
      defectType === "Missing Component"
    ) {
      sizeScore = 90;
    } else if (
      defectType === "Crack"
    ) {
      sizeScore = 85;
    } else if (
      defectType === "Manufacturing Defect"
    ) {
      sizeScore = 70;
    } else if (
      defectType === "Contamination"
    ) {
      sizeScore = 60;
    } else if (
      defectType === "Broken Small"
    ) {
      sizeScore = 55;
    } else if (
      defectType === "Scratch"
    ) {
      sizeScore = 35;
    }

    let locationScore = 50;

    if (
      defectType === "Broken Large" ||
      defectType === "Missing Component" ||
      defectType === "Crack"
    ) {
      locationScore = 90;
    } else if (
      defectType === "Manufacturing Defect"
    ) {
      locationScore = 75;
    } else if (
      defectType === "Contamination"
    ) {
      locationScore = 65;
    } else if (
      defectType === "Broken Small"
    ) {
      locationScore = 60;
    } else if (
      defectType === "Scratch"
    ) {
      locationScore = 40;
    }

    let defectTypeScore = 50;

    if (
      defectType === "Broken Large" ||
      defectType === "Missing Component" ||
      defectType === "Crack"
    ) {
      defectTypeScore = 95;
    } else if (
      defectType === "Manufacturing Defect"
    ) {
      defectTypeScore = 75;
    } else if (
      defectType === "Broken Small"
    ) {
      defectTypeScore = 70;
    } else if (
      defectType === "Contamination"
    ) {
      defectTypeScore = 65;
    } else if (
      defectType === "Scratch"
    ) {
      defectTypeScore = 35;
    }

    const confidenceScore =
      getConfidenceValue(inspection);

    const score =
      sizeScore * 0.30 +
      locationScore * 0.25 +
      defectTypeScore * 0.25 +
      confidenceScore * 0.20;

    return Math.round(
      Math.max(
        0,
        Math.min(100, score)
      )
    );
  };

  // ============================================================
  // SEVERITY LEVEL
  // ============================================================

  const getSeverityLevel = (score) => {
    if (score >= 80) {
      return "Critical";
    }

    if (score >= 60) {
      return "High";
    }

    if (score >= 42) {
      return "Medium";
    }

    return "Low";
  };

  // ============================================================
  // RECOMMENDED ACTION
  // ============================================================

  const getRecommendedAction = (inspection) => {
    const decision =
      getQualityDecision(inspection);

    const defectType =
      classifyDefect(inspection);

    if (decision === "PASS") {
      return "Product meets quality requirements.";
    }

    if (decision === "REJECT") {
      return `Product rejected due to ${defectType}.`;
    }

    return `Product requires quality engineer review for ${defectType}.`;
  };

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const isPassed = (inspection) => {
    return (
      getQualityDecision(
        inspection
      ) === "PASS"
    );
  };

  const isReview = (inspection) => {
    return (
      getQualityDecision(
        inspection
      ) === "REVIEW"
    );
  };

  const isDefective = (inspection) => {
    const decision =
      getQualityDecision(
        inspection
      );

    return (
      decision === "REJECT"
    );
  };

  // ============================================================
  // STATISTICS
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
  // FILTER + SEARCH
  // ============================================================

  const filteredInspections = useMemo(() => {
    const searchText =
      search
        .trim()
        .toLowerCase();

    return inspections.filter(
      (inspection) => {
        const decision =
          getQualityDecision(
            inspection
          );

        const defectType =
          classifyDefect(
            inspection
          );

        // ------------------------------------------------------
        // FILTER
        // ------------------------------------------------------

        if (
          filter === "PASSED" &&
          decision !== "PASS"
        ) {
          return false;
        }

        if (
          filter === "DEFECTIVE" &&
          decision !== "REJECT"
        ) {
          return false;
        }

        if (
          filter === "REVIEW" &&
          decision !== "REVIEW"
        ) {
          return false;
        }

        // ------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------

        if (searchText) {
          const searchableText = [
            inspection.id,
            inspection.product,
            inspection.image,
            inspection.filename,
            inspection.prediction,
            inspection.defectType,
            inspection.defect_type,
            inspection.defectClassification,
            inspection.defect_classification,
            defectType,
            decision,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .toLowerCase();

          if (
            !searchableText.includes(
              searchText
            )
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }, [
    inspections,
    filter,
    search,
  ]);

  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Not available";
    }

    return parsedDate.toLocaleString();
  };

  // ============================================================
  // PRODUCT
  // ============================================================

  const getProductName = (inspection) => {
    return (
      inspection.product ||
      inspection.image ||
      inspection.filename ||
      "Unknown Product"
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="results-page">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section className="results-header">

          <div>

            <span className="results-kicker">
              QUALITY INSPECTION CENTER
            </span>

            <h1>
              Inspection Results
            </h1>

            <p>
              Review completed product inspections,
              AI predictions, defect classifications,
              severity and quality decisions.
            </p>

          </div>

          <div className="results-live">

            <span className="live-dot"></span>

            System Active

          </div>

        </section>

        {/* ====================================================
            KPI CARDS
        ===================================================== */}

        <section className="results-summary">

          <SummaryCard
            type="blue"
            icon="⌕"
            label="Total Inspections"
            value={totalInspections}
            description="Completed inspections"
          />

          <SummaryCard
            type="green"
            icon="✓"
            label="Passed Products"
            value={passedProducts}
            description={`${passRate}% overall pass rate`}
          />

          <SummaryCard
            type="red"
            icon="!"
            label="Rejected Products"
            value={defectiveProducts}
            description={`${defectRate}% rejection rate`}
          />

          <SummaryCard
            type="amber"
            icon="?"
            label="Requires Review"
            value={reviewProducts}
            description={`${reviewRate}% pending verification`}
          />

        </section>

        {/* ====================================================
            INSPECTION RECORDS
        ===================================================== */}

        <section className="results-card">

          <div className="records-header">

            <div>

              <span className="records-kicker">
                INSPECTION HISTORY
              </span>

              <h2>
                Inspection Records
              </h2>

              <p>
                Search, filter and review each completed
                inspection.
              </p>

            </div>

            <div className="records-count">

              <strong>
                {filteredInspections.length}
              </strong>

              <span>
                records
              </span>

            </div>

          </div>

          {/* ==================================================
              FILTER TOOLBAR
          =================================================== */}

          <div className="results-toolbar">

            <div className="filter-buttons">

              <FilterButton
                active={
                  filter === "ALL"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  filter === "PASSED"
                }
                onClick={() =>
                  setFilter("PASSED")
                }
              >
                Passed
              </FilterButton>

              <FilterButton
                active={
                  filter === "DEFECTIVE"
                }
                onClick={() =>
                  setFilter(
                    "DEFECTIVE"
                  )
                }
              >
                Rejected
              </FilterButton>

              <FilterButton
                active={
                  filter === "REVIEW"
                }
                onClick={() =>
                  setFilter("REVIEW")
                }
              >
                Review
              </FilterButton>

            </div>

            <div className="results-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by product, defect or decision..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

          </div>

          {/* ==================================================
              TABLE
          =================================================== */}

          {filteredInspections.length === 0 ? (

            <div className="results-empty">

              <div className="empty-icon">
                !
              </div>

              <h3>
                No inspection results found
              </h3>

              <p>
                Try another filter or search term.
              </p>

            </div>

          ) : (

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
                      Classification
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

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInspections.map(
                    (
                      inspection,
                      index
                    ) => {

                      const defectType =
                        classifyDefect(
                          inspection
                        );

                      const confidence =
                        getConfidenceValue(
                          inspection
                        );

                      const severity =
                        calculateSeverity(
                          inspection
                        );

                      const severityLevel =
                        getSeverityLevel(
                          severity
                        );

                      const decision =
                        getQualityDecision(
                          inspection
                        );

                      const hasConfidence =
                        !(
                          decision === "PASS" &&
                          defectType === "No Defect"
                        );

                      const prediction =
                        inspection.prediction ||
                        (
                          decision ===
                          "PASS"
                            ? "Passed"
                            : "Defective"
                        );

                      return (
                        <tr
                          key={
                            inspection.id ||
                            inspection.createdAt ||
                            inspection.created_at ||
                            index
                          }
                        >

                          {/* ID */}

                          <td>

                            <span className="result-id">

                              #

                              {inspection.id ||
                                `INS-${String(
                                  index + 1
                                ).padStart(
                                  3,
                                  "0"
                                )}`}

                            </span>

                          </td>

                          {/* PRODUCT */}

                          <td>

                            <div className="product-cell">

                              <div className="product-icon">
                                IMG
                              </div>

                              <div className="product-info">

                                <strong>
                                  {getProductName(
                                    inspection
                                  )}
                                </strong>

                                <span>
                                  Product inspection
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* PREDICTION */}

                          <td>

                            <span
                              className={`table-badge ${
                                decision ===
                                  "REJECT"
                                  ? "badge-danger"
                                  : decision ===
                                    "REVIEW"
                                  ? "badge-warning"
                                  : "badge-success"
                              }`}
                            >
                              {prediction}
                            </span>

                          </td>

                          {/* CLASSIFICATION */}

                          <td>

                            <span className="classification-badge">

                              {defectType}

                            </span>

                          </td>

                          {/* CONFIDENCE */}

                          <td>

                            <div className="confidence-cell">

                              <div className="confidence-value">

                                {hasConfidence
                                  ? `${confidence.toFixed(
                                      1
                                    )}%`
                                  : "N/A"}

                              </div>

                              <div className="confidence-track">

                                <div
                                  className={`confidence-bar ${
                                    hasConfidence
                                      ? confidence >=
                                        70
                                        ? "high"
                                        : confidence >=
                                          40
                                        ? "medium"
                                        : "low"
                                      : "low"
                                  }`}
                                  style={{
                                    width:
                                      hasConfidence
                                        ? `${Math.min(
                                            Math.max(
                                              confidence,
                                              0
                                            ),
                                            100
                                          )}%`
                                        : "0%",
                                  }}
                                />

                              </div>

                            </div>

                          </td>

                          {/* SEVERITY */}

                          <td>

                            <div className="severity-cell">

                              <span
                                className={`severity-badge ${severityLevel.toLowerCase()}`}
                              >
                                {severityLevel}
                              </span>

                              <span className="severity-number">

                                {severity}
                                /100

                              </span>

                            </div>

                          </td>

                          {/* DECISION */}

                          <td>

                            <span
                              className={`decision-badge ${decision.toLowerCase()}`}
                            >

                              <span></span>

                              {decision}

                            </span>

                          </td>

                          {/* VIEW */}

                          <td>

                            <button
                              type="button"
                              className="view-button"
                              onClick={() =>
                                setSelectedInspection(
                                  inspection
                                )
                              }
                            >
                              View Details
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

      </main>

      {/* ======================================================
          INSPECTION DETAILS MODAL
      ======================================================= */}

      {selectedInspection && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedInspection(
              null
            )
          }
        >

          <div
            className="results-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="results-kicker">
                  INSPECTION DETAILS
                </span>

                <h2>
                  Inspection Record
                </h2>

                <p>
                  Complete information for the selected
                  inspection.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedInspection(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            {/* DECISION SUMMARY */}

            <div className="modal-summary">

              <div className="modal-summary-item">

                <span>
                  QUALITY DECISION
                </span>

                <strong
                  className={`modal-decision ${getQualityDecision(
                    selectedInspection
                  ).toLowerCase()}`}
                >
                  {getQualityDecision(
                    selectedInspection
                  )}
                </strong>

              </div>

              <div className="modal-summary-item">

                <span>
                  SEVERITY
                </span>

                <strong
                  className={`modal-decision ${getSeverityLevel(
                    calculateSeverity(
                      selectedInspection
                    )
                  ).toLowerCase()}`}
                >
                  {getSeverityLevel(
                    calculateSeverity(
                      selectedInspection
                    )
                  )}
                </strong>

              </div>

              <div className="modal-summary-item">

                <span>
                  CONFIDENCE
                </span>

                <strong className="modal-blue-value">

                  {getConfidence(
                    selectedInspection
                  )}

                </strong>

              </div>

            </div>

            {/* DETAILS */}

            <div className="modal-section">

              <span className="modal-section-title">
                INSPECTION INFORMATION
              </span>

              <div className="modal-grid">

                <DetailItem
                  label="Inspection ID"
                  value={
                    selectedInspection.id ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Product"
                  value={getProductName(
                    selectedInspection
                  )}
                />

                <DetailItem
                  label="Prediction"
                  value={
                    selectedInspection.prediction ||
                    (
                      getQualityDecision(
                        selectedInspection
                      ) === "PASS"
                        ? "Passed"
                        : "Defective"
                    )
                  }
                />

                <DetailItem
                  label="Defect"
                  value={
                    isDefective(
                      selectedInspection
                    )
                      ? "Detected"
                      : isReview(
                          selectedInspection
                        )
                      ? "Under Review"
                      : "Not Detected"
                  }
                />

                <DetailItem
                  label="Classification"
                  value={classifyDefect(
                    selectedInspection
                  )}
                />

                <DetailItem
                  label="Confidence"
                  value={getConfidence(
                    selectedInspection
                  )}
                />

              </div>

            </div>

            {/* SEVERITY DETAILS */}

            <div className="modal-section">

              <span className="modal-section-title">
                SEVERITY ASSESSMENT
              </span>

              <div className="modal-grid">

                <DetailItem
                  label="Size Score"
                  value={
                    classifyDefect(
                      selectedInspection
                    ) === "No Defect"
                      ? "0 / 100"
                      : `${
                          selectedInspection.sizeScore ??
                          selectedInspection.size_score ??
                          0
                        } / 100`
                  }
                />

                <DetailItem
                  label="Location Score"
                  value={
                    classifyDefect(
                      selectedInspection
                    ) === "No Defect"
                      ? "0 / 100"
                      : `${
                          selectedInspection.locationScore ??
                          selectedInspection.location_score ??
                          0
                        } / 100`
                  }
                />

                <DetailItem
                  label="Defect Type Score"
                  value={
                    classifyDefect(
                      selectedInspection
                    ) === "No Defect"
                      ? "0 / 100"
                      : `${
                          selectedInspection.defectTypeScore ??
                          selectedInspection.defect_type_score ??
                          0
                        } / 100`
                  }
                />

                <DetailItem
                  label="Confidence Score"
                  value={
                    classifyDefect(
                      selectedInspection
                    ) === "No Defect"
                      ? "N/A"
                      : `${
                          selectedInspection.confidenceScore ??
                          selectedInspection.confidence_score ??
                          getConfidenceValue(
                            selectedInspection
                          )
                        } / 100`
                  }
                />

                <DetailItem
                  label="Overall Severity"
                  value={`${calculateSeverity(
                    selectedInspection
                  )} / 100`}
                />

                <DetailItem
                  label="Severity Level"
                  value={getSeverityLevel(
                    calculateSeverity(
                      selectedInspection
                    )
                  )}
                />

              </div>

            </div>

            {/* QUALITY CONTROL */}

            <div className="modal-section">

              <span className="modal-section-title">
                QUALITY CONTROL
              </span>

              <div className="recommendation-card">

                <div className="recommendation-icon">
                  QC
                </div>

                <div>

                  <span>
                    RECOMMENDED ACTION
                  </span>

                  <strong>
                    {selectedInspection.recommendedAction ||
                      selectedInspection.recommended_action ||
                      getRecommendedAction(
                        selectedInspection
                      )}
                  </strong>

                </div>

              </div>

            </div>

            {/* RECORD */}

            <div className="modal-section">

              <span className="modal-section-title">
                RECORD INFORMATION
              </span>

              <div className="modal-grid">

                <DetailItem
                  label="Inspected By"
                  value={
                    selectedInspection.inspectedBy ||
                    selectedInspection.inspected_by ||
                    selectedInspection.userEmail ||
                    selectedInspection.email ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Role"
                  value={
                    selectedInspection.role ||
                    "Quality Engineer"
                  }
                />

                <DetailItem
                  label="Image"
                  value={
                    selectedInspection.filename ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Inspection Time"
                  value={formatDate(
                    selectedInspection.createdAt ||
                      selectedInspection.created_at ||
                      selectedInspection.inspectionTime ||
                      selectedInspection.inspection_time ||
                      selectedInspection.timestamp
                  )}
                />

              </div>

            </div>

            <button
              type="button"
              className="modal-close-button"
              onClick={() =>
                setSelectedInspection(
                  null
                )
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  type,
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="summary-card">

      <div
        className={`summary-icon ${type}`}
      >
        {icon}
      </div>

      <div className="summary-content">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}

// ============================================================
// FILTER BUTTON
// ============================================================

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      className={`filter-button ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="modal-detail">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

export default Results;