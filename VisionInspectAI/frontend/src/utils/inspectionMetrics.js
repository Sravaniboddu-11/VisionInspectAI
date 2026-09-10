// ============================================================
// VISIONINSPECTAI
// SHARED INSPECTION METRICS
//
// All Supervisor pages should use these same functions.
// This prevents Dashboard, Results, Analytics and Weekly
// Analytics from showing different numbers.
// ============================================================


// ============================================================
// PREDICTION
// ============================================================

export const getPrediction = (item) => {
  return String(
    item?.prediction ||
      item?.status ||
      ""
  )
    .trim()
    .toLowerCase();
};


// ============================================================
// QUALITY DECISION
// ============================================================

export const getDecision = (item) => {
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
// DEFECT TYPE
// ============================================================

export const getDefectType = (item) => {
  return String(
    item?.defectType ||
      item?.defect_type ||
      item?.classification ||
      ""
  )
    .trim()
    .toLowerCase();
};


// ============================================================
// DEFECT CHECK
//
// IMPORTANT:
// Use the same rule everywhere.
// ============================================================

export const isDefective = (item) => {
  if (!item) {
    return false;
  }

  // Primary database/storage value
  if (item.defect === true) {
    return true;
  }

  const prediction =
    getPrediction(item);

  const defectType =
    getDefectType(item);

  const decision =
    getDecision(item);

  // Rejected/failed products are defective
  if (
    decision === "REJECT" ||
    decision === "REJECTED" ||
    decision === "FAIL" ||
    decision === "FAILED"
  ) {
    return true;
  }

  // Known defect classifications
  if (
    defectType &&
    defectType !== "normal" &&
    defectType !== "no defect" &&
    defectType !== "no_defect" &&
    defectType !== "none" &&
    defectType !== "unknown" &&
    defectType !== "unknown / unclassified" &&
    defectType !== "good" &&
    defectType !== "passed" &&
    defectType !== "pass"
  ) {
    return true;
  }

  // Prediction-based fallback
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
// REVIEW CHECK
// ============================================================

export const isReview = (item) => {
  return getDecision(item) === "REVIEW";
};


// ============================================================
// PASSED CHECK
// ============================================================

export const isPassed = (item) => {
  const decision =
    getDecision(item);

  if (
    decision === "PASS" ||
    decision === "PASSED"
  ) {
    return true;
  }

  return (
    !isDefective(item) &&
    !isReview(item)
  );
};


// ============================================================
// COMMON SUMMARY
// ============================================================

export const calculateInspectionSummary = (
  inspections
) => {
  const data = Array.isArray(
    inspections
  )
    ? inspections
    : [];

  const total =
    data.length;

  const passed =
    data.filter(
      isPassed
    ).length;

  const defective =
    data.filter(
      isDefective
    ).length;

  const review =
    data.filter(
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

  return {
    total,
    passed,
    defective,
    review,
    passRate,
    defectRate,
    reviewRate,
  };
};
