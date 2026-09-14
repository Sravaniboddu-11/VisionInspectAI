const STORAGE_KEY =
  "visionInspect_inspections";


// ============================================================
// NORMALIZE DECISION
// ============================================================

const normalizeDecision = (value) => {
  const decision = String(value || "")
    .trim()
    .toUpperCase();

  if (
    decision === "PASS" ||
    decision === "PASSED"
  ) {
    return "PASS";
  }

  if (
    decision === "REVIEW" ||
    decision === "MANUAL REVIEW"
  ) {
    return "REVIEW";
  }

  if (
    decision === "REJECT" ||
    decision === "REJECTED" ||
    decision === "FAIL" ||
    decision === "FAILED" ||
    decision === "DEFECTIVE"
  ) {
    return "REJECT";
  }

  return "";
};


// ============================================================
// NORMALIZE DEFECT CLASSIFICATION
// ============================================================

const normalizeDefectType = (value) => {
  const type = String(value || "")
    .trim();

  const normalized =
    type.toLowerCase();

  if (
    !type ||
    normalized === "normal" ||
    normalized === "none" ||
    normalized === "good" ||
    normalized === "ok" ||
    normalized === "pass" ||
    normalized === "passed" ||
    normalized === "no defect" ||
    normalized === "no_defect"
  ) {
    return "No Defect";
  }

  if (
    normalized === "unknown" ||
    normalized === "unknown / unclassified" ||
    normalized === "unknown/unclassified" ||
    normalized === "unclassified"
  ) {
    return "Unknown / Unclassified";
  }

  if (
    normalized.includes("broken_small") ||
    normalized.includes("broken small")
  ) {
    return "Broken Small";
  }

  if (
    normalized.includes("broken_large") ||
    normalized.includes("broken large")
  ) {
    return "Broken Large";
  }

  if (
    normalized.includes("contamination")
  ) {
    return "Contamination";
  }

  if (
    normalized.includes("manufacturing")
  ) {
    return "Manufacturing Defect";
  }

  if (
    normalized.includes("missing") &&
    normalized.includes("component")
  ) {
    return "Missing Component";
  }

  if (
    normalized.includes("crack")
  ) {
    return "Crack";
  }

  if (
    normalized.includes("scratch")
  ) {
    return "Scratch";
  }

  return type;
};


// ============================================================
// CHECK ACTUAL DEFECT TYPE
// ============================================================

const isActualDefectType = (
  defectType
) => {
  const normalized =
    String(defectType || "")
      .trim()
      .toLowerCase();

  return (
    normalized &&
    normalized !== "no defect" &&
    normalized !== "no_defect" &&
    normalized !== "normal" &&
    normalized !== "none" &&
    normalized !== "good" &&
    normalized !== "ok" &&
    normalized !== "passed" &&
    normalized !== "pass" &&
    normalized !== "unknown" &&
    normalized !== "unknown / unclassified" &&
    normalized !== "unknown/unclassified" &&
    normalized !== "unclassified"
  );
};


// ============================================================
// CONVERT CONFIDENCE
// ============================================================

const normalizeConfidence = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    value = parseFloat(
      value
        .replace("%", "")
        .trim()
    );
  }

  value = Number(value);

  if (
    !Number.isFinite(value)
  ) {
    return null;
  }

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
// CONVERT SCORE
// ============================================================

const normalizeScore = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return Math.min(
    Math.max(number, 0),
    100
  );
};


// ============================================================
// NORMALIZE ONE INSPECTION
// ============================================================

const normalizeInspection = (
  inspection
) => {

  if (
    !inspection ||
    typeof inspection !==
      "object"
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // BASIC VALUES
  // ----------------------------------------------------------

  const filename =
    inspection.filename ||
    inspection.product ||
    "Unknown";

  const product =
    inspection.product ||
    filename ||
    "Product";

  const prediction =
    String(
      inspection.prediction ||
        ""
    ).trim();

  const predictionLower =
    prediction.toLowerCase();

  // ----------------------------------------------------------
  // CLASSIFICATION
  // ----------------------------------------------------------

  const rawDefectType =
    inspection.defectType ||
    inspection.defect_type ||
    inspection.defectClassification ||
    inspection.defect_classification ||
    inspection.classification ||
    "";

  let defectType =
    normalizeDefectType(
      rawDefectType
    );

  // ----------------------------------------------------------
  // EXISTING DEFECT FLAG
  // ----------------------------------------------------------

  let defect =
    inspection.defect === true;

  // ----------------------------------------------------------
  // QUALITY DECISION
  // ----------------------------------------------------------

  let qualityDecision =
    normalizeDecision(
      inspection.qualityDecision ||
        inspection.quality_decision ||
        inspection.decision ||
        inspection.status
    );

  const predictionIndicatesPassed =
    predictionLower === "passed" ||
    predictionLower === "pass" ||
    predictionLower === "good" ||
    predictionLower === "normal";

  const predictionIndicatesDefect =
    predictionLower.includes("defective") ||
    predictionLower.includes("defect") ||
    predictionLower.includes("broken") ||
    predictionLower.includes("contamination") ||
    predictionLower.includes("crack") ||
    predictionLower.includes("scratch") ||
    predictionLower.includes("missing");

  // ----------------------------------------------------------
  // CASE 1:
  // PASSED + NO DEFECT
  // ----------------------------------------------------------

  const isNoDefectResult =
    !defect &&
    !isActualDefectType(
      defectType
    ) &&
    (
      predictionIndicatesPassed ||
      qualityDecision === "PASS"
    );

  if (isNoDefectResult) {

    defect = false;

    defectType =
      "No Defect";

    qualityDecision =
      "PASS";

    return {
      ...inspection,

      id:
        inspection.id ||
        Date.now(),

      product,

      filename,

      prediction:
        "Passed",

      confidence:
        null,

      defect:
        false,

      defectType:
        "No Defect",

      sizeScore:
        0,

      locationScore:
        0,

      defectTypeScore:
        0,

      confidenceScore:
        0,

      severityScore:
        0,

      severityLevel:
        "Low",

      qualityDecision:
        "PASS",

      recommendedAction:
        "Product meets the current quality requirements.",

      inspectedBy:
        inspection.inspectedBy ||
        inspection.inspected_by ||
        "Unknown User",

      inspectedByName:
        inspection.inspectedByName ||
        "User",

      role:
        inspection.role ||
        "Quality Engineer",

      createdAt:
        inspection.createdAt ||
        inspection.inspection_time ||
        new Date().toISOString(),

      status:
        "Passed",
    };
  }

  // ----------------------------------------------------------
  // CASE 2:
  // DEFECTIVE + NO DEFECT
  // ----------------------------------------------------------

  const contradictoryResult =
    (
      predictionIndicatesDefect ||
      defect === true
    ) &&
    defectType === "No Defect";

  if (
    contradictoryResult
  ) {

    defect = true;

    defectType =
      "Unknown / Unclassified";

    qualityDecision =
      "REVIEW";

    return {
      ...inspection,

      id:
        inspection.id ||
        Date.now(),

      product,

      filename,

      prediction:
        "Defective",

      confidence:
        null,

      defect:
        true,

      defectType:
        "Unknown / Unclassified",

      sizeScore:
        0,

      locationScore:
        0,

      defectTypeScore:
        0,

      confidenceScore:
        0,

      severityScore:
        0,

      severityLevel:
        "Unknown",

      qualityDecision:
        "REVIEW",

      recommendedAction:
        "Inspection requires quality engineer verification because the defect classification is unavailable.",

      inspectedBy:
        inspection.inspectedBy ||
        inspection.inspected_by ||
        "Unknown User",

      inspectedByName:
        inspection.inspectedByName ||
        "User",

      role:
        inspection.role ||
        "Quality Engineer",

      createdAt:
        inspection.createdAt ||
        inspection.inspection_time ||
        new Date().toISOString(),

      status:
        "Defective",
    };
  }

  // ----------------------------------------------------------
  // CASE 3:
  // ACTUAL DEFECT
  // ----------------------------------------------------------

  const actualDefect =
    defect ||
    isActualDefectType(
      defectType
    ) ||
    predictionIndicatesDefect;

  if (
    actualDefect
  ) {

    defect = true;

    if (
      !defectType ||
      defectType ===
        "No Defect"
    ) {
      defectType =
        "Unknown / Unclassified";
    }

    if (
      qualityDecision !== "REVIEW" &&
      qualityDecision !== "REJECT"
    ) {
      qualityDecision =
        "REVIEW";
    }

    const confidence =
      normalizeConfidence(
        inspection.confidence
      );

    const severityScore =
      normalizeScore(
        inspection.severityScore ??
          inspection.severity_score
      );

    const severityLevel =
      inspection.severityLevel ||
      inspection.severity_level ||
      (
        severityScore >= 80
          ? "Critical"
          : severityScore >= 60
          ? "High"
          : severityScore >= 40
          ? "Medium"
          : "Low"
      );

    return {
      ...inspection,

      id:
        inspection.id ||
        Date.now(),

      product,

      filename,

      prediction:
        "Defective",

      confidence,

      defect:
        true,

      defectType,

      defectClassification:
        defectType,

      defect_classification:
        defectType,

      sizeScore:
        normalizeScore(
          inspection.sizeScore
        ),

      locationScore:
        normalizeScore(
          inspection.locationScore
        ),

      defectTypeScore:
        normalizeScore(
          inspection.defectTypeScore
        ),

      confidenceScore:
        normalizeScore(
          inspection.confidenceScore ??
            confidence ??
            0
        ),

      severityScore,

      severityLevel,

      qualityDecision,

      recommendedAction:
        inspection.recommendedAction ||
        inspection.recommended_action ||
        (
          qualityDecision === "REJECT"
            ? "Product rejected due to detected defect."
            : "Product requires quality engineer review."
        ),

      inspectedBy:
        inspection.inspectedBy ||
        inspection.inspected_by ||
        "Unknown User",

      inspectedByName:
        inspection.inspectedByName ||
        "User",

      role:
        inspection.role ||
        "Quality Engineer",

      createdAt:
        inspection.createdAt ||
        inspection.inspection_time ||
        new Date().toISOString(),

      status:
        "Defective",
    };
  }

  // ----------------------------------------------------------
  // CASE 4:
  // FALLBACK PASSED RESULT
  // ----------------------------------------------------------

  return {
    ...inspection,

    id:
      inspection.id ||
      Date.now(),

    product,

    filename,

    prediction:
      "Passed",

    confidence:
      null,

    defect:
      false,

    defectType:
      "No Defect",

    sizeScore:
      0,

    locationScore:
      0,

    defectTypeScore:
      0,

    confidenceScore:
      0,

    severityScore:
      0,

    severityLevel:
      "Low",

    qualityDecision:
      "PASS",

    recommendedAction:
      "Product meets the current quality requirements.",

    inspectedBy:
      inspection.inspectedBy ||
      inspection.inspected_by ||
      "Unknown User",

    inspectedByName:
      inspection.inspectedByName ||
      "User",

    role:
      inspection.role ||
      "Quality Engineer",

    createdAt:
      inspection.createdAt ||
      inspection.inspection_time ||
      new Date().toISOString(),

    status:
      "Passed",
  };
};


// ============================================================
// GET ALL SAVED INSPECTIONS
//
// Existing dashboards continue using this function.
// ============================================================

export const getInspections = () => {

  try {

    const data =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!data) {
      return [];
    }

    const parsed =
      JSON.parse(data);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    const normalized =
      parsed
        .map(
          normalizeInspection
        )
        .filter(
          Boolean
        );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );

    return normalized;

  } catch (error) {

    console.error(
      "Error reading inspections:",
      error
    );

    return [];
  }
};


// ============================================================
// SAVE A NEW INSPECTION
//
// The backend now permanently saves the inspection in
// PostgreSQL. This function keeps a local copy so that the
// existing dashboards continue working without modification.
// ============================================================

export const saveInspection = (
  inspection
) => {

  try {

    const inspections =
      getInspections();

    const baseInspection = {
      ...inspection,

      id:
        inspection?.id ||
        Date.now(),

      product:
        inspection?.product ||
        inspection?.filename ||
        "Product",

      filename:
        inspection?.filename ||
        "Unknown",

      inspectedBy:
        inspection?.inspectedBy ||
        inspection?.inspected_by ||
        "Unknown User",

      createdAt:
        inspection?.createdAt ||
        inspection?.inspection_time ||
        new Date().toISOString(),
    };

    const newInspection =
      normalizeInspection(
        baseInspection
      );

    if (!newInspection) {

      console.error(
        "Invalid inspection data."
      );

      return null;
    }

    /*
     * Prevent duplicate local records when the same
     * PostgreSQL inspection is returned again.
     */

    const existingIndex =
      inspections.findIndex(
        (item) =>
          String(item.id) ===
          String(newInspection.id)
      );

    if (
      existingIndex !== -1
    ) {

      inspections[
        existingIndex
      ] = newInspection;

    } else {

      inspections.push(
        newInspection
      );
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        inspections
      )
    );

    console.log(
      "Inspection saved locally:",
      newInspection
    );

    return newInspection;

  } catch (error) {

    console.error(
      "Error saving inspection:",
      error
    );

    return null;
  }
};


// ============================================================
// REPLACE LOCAL INSPECTION CACHE
//
// Called after login with the inspections retrieved from
// PostgreSQL for the logged-in user.
// ============================================================

export const replaceInspections = (
  inspections
) => {

  try {

    if (
      !Array.isArray(inspections)
    ) {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([])
      );

      return [];
    }

    const normalized =
      inspections
        .map(
          normalizeInspection
        )
        .filter(
          Boolean
        );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );

    console.log(
      "Inspection history synchronized:",
      normalized.length
    );

    return normalized;

  } catch (error) {

    console.error(
      "Error synchronizing inspection history:",
      error
    );

    return [];
  }
};


// ============================================================
// DELETE ALL INSPECTIONS
//
// This clears only the browser cache.
// Database records remain stored permanently.
// ============================================================

export const clearInspections = () => {

  localStorage.removeItem(
    STORAGE_KEY
  );
};


// ============================================================
// DELETE ONE INSPECTION
//
// This clears only the browser cache.
// Database records remain stored permanently.
// ============================================================

export const deleteInspection = (
  id
) => {

  const inspections =
    getInspections();

  const updatedInspections =
    inspections.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      updatedInspections
    )
  );

  return updatedInspections;
};