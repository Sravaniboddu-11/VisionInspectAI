import React, {
  useEffect,
  useState,
} from "react";

import SupervisorNavbar from "../components/SupervisorNavbar";
import { getInspections } from "../utils/inspectionStorage";

export default function ProductionQualityReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD REPORT
  // ============================================================

  useEffect(() => {
    loadReport();

    const handleStorage = () => {
      loadReport();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        loadReport();
      }
    };

    window.addEventListener("storage", handleStorage);

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const interval = setInterval(() => {
      loadReport();
    }, 2000);

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "storage",
        handleStorage
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  // ============================================================
  // LOAD REPORT
  // ============================================================

  function loadReport() {
    try {
      setError("");

      const inspections = getInspections();

      if (!Array.isArray(inspections)) {
        throw new Error(
          "Inspection data is not available."
        );
      }

      const generatedReport =
        createReportFromInspections(
          inspections
        );

      setReport(generatedReport);
    } catch (err) {
      console.error(
        "Production Quality Report Error:",
        err
      );

      setError(
        "Unable to load production quality report."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CREATE REPORT
  // ============================================================

  function createReportFromInspections(
    inspections
  ) {
    const total = inspections.length;

    let passedProducts = 0;
    let defectiveProducts = 0;
    let reviewProducts = 0;

    let passCount = 0;
    let reviewCount = 0;
    let rejectCount = 0;

    const defectTypes = {};

    let low = 0;
    let medium = 0;
    let high = 0;
    let critical = 0;

    const confidenceValues = [];
    const severityValues = [];

    // ==========================================================
    // PROCESS EACH INSPECTION
    // ==========================================================

    inspections.forEach((inspection) => {
      if (!inspection) {
        return;
      }

      // --------------------------------------------------------
      // QUALITY DECISION
      // --------------------------------------------------------

      const rawDecision = String(
        inspection?.qualityDecision ??
          inspection?.quality_decision ??
          inspection?.decision ??
          ""
      )
        .trim()
        .toUpperCase();

      let qualityDecision = rawDecision;

      if (
        qualityDecision === "PASSED"
      ) {
        qualityDecision = "PASS";
      }

      if (
        qualityDecision === "REJECTED" ||
        qualityDecision === "FAILED" ||
        qualityDecision === "DEFECTIVE" ||
        qualityDecision === "FAIL"
      ) {
        qualityDecision = "REJECT";
      }

      if (
        qualityDecision !== "PASS" &&
        qualityDecision !== "REVIEW" &&
        qualityDecision !== "REJECT"
      ) {
        qualityDecision =
          inferDecisionFromInspection(
            inspection
          );
      }

      // --------------------------------------------------------
      // QUALITY COUNTS
      // --------------------------------------------------------

      if (
        qualityDecision === "PASS"
      ) {
        passedProducts++;
        passCount++;
      } else if (
        qualityDecision === "REVIEW"
      ) {
        reviewProducts++;
        reviewCount++;
      } else {
        defectiveProducts++;
        rejectCount++;
      }

      // --------------------------------------------------------
      // CONFIDENCE
      // --------------------------------------------------------

      let confidenceValue =
        inspection?.confidence ??
        inspection?.confidenceScore ??
        inspection?.confidence_score ??
        inspection?.detectionConfidence ??
        inspection?.probability;

      if (
        typeof confidenceValue ===
        "string"
      ) {
        confidenceValue = parseFloat(
          confidenceValue
            .replace("%", "")
            .trim()
        );
      }

      confidenceValue =
        Number(confidenceValue);

      if (
        Number.isFinite(
          confidenceValue
        )
      ) {
        const confidence =
          confidenceValue <= 1
            ? confidenceValue * 100
            : confidenceValue;

        confidenceValues.push(
          Math.min(
            Math.max(
              confidence,
              0
            ),
            100
          )
        );
      }

      // ========================================================
      // DEFECT CLASSIFICATION
      //
      // Count defect classifications for both:
      // - REVIEW
      // - REJECT
      //
      // PASS products are not counted as defects.
      // ========================================================

      const hasDefectDecision =
        qualityDecision === "REVIEW" ||
        qualityDecision === "REJECT";

      if (hasDefectDecision) {
        const rawDefectType =
          inspection?.defectClassification ??
          inspection?.defect_classification ??
          inspection?.defectType ??
          inspection?.defect_type ??
          inspection?.classification ??
          null;

        let defectType = null;

        if (
          rawDefectType !== null &&
          rawDefectType !== undefined
        ) {
          const cleanType =
            String(rawDefectType).trim();

          const lowerType =
            cleanType.toLowerCase();

          if (
            cleanType &&
            lowerType !== "none" &&
            lowerType !== "no defect" &&
            lowerType !== "no_defect" &&
            lowerType !== "unknown" &&
            lowerType !==
              "unknown / unclassified"
          ) {
            defectType =
              normalizeDefectName(
                cleanType
              );
          }
        }

        if (defectType) {
          defectTypes[defectType] =
            (
              defectTypes[defectType] ||
              0
            ) + 1;
        } else {
          defectTypes[
            "Manufacturing Defect"
          ] =
            (
              defectTypes[
                "Manufacturing Defect"
              ] || 0
            ) + 1;
        }
      }

      // ========================================================
      // ONLY CONFIRMED REJECTED PRODUCTS
      // contribute to:
      // - Severity
      // - Average Severity
      // ========================================================

      const confirmedDefective =
        qualityDecision === "REJECT";

      if (!confirmedDefective) {
        return;
      }

      // --------------------------------------------------------
      // SEVERITY LEVEL
      // --------------------------------------------------------

      const severityLevel = String(
        inspection?.severityLevel ??
          inspection?.severity_level ??
          inspection?.severity ??
          ""
      )
        .trim()
        .toLowerCase();

      if (
        severityLevel === "low"
      ) {
        low++;
      } else if (
        severityLevel === "medium"
      ) {
        medium++;
      } else if (
        severityLevel === "high"
      ) {
        high++;
      } else if (
        severityLevel === "critical"
      ) {
        critical++;
      }

      // --------------------------------------------------------
      // SEVERITY SCORE
      // --------------------------------------------------------

      const severityScore =
        Number(
          inspection?.severityScore ??
            inspection?.severity_score
        );

      if (
        Number.isFinite(
          severityScore
        )
      ) {
        severityValues.push(
          Math.min(
            Math.max(
              severityScore,
              0
            ),
            100
          )
        );
      }
    });

    // ============================================================
    // CALCULATIONS
    // ============================================================

    const defectRate =
      total > 0
        ? Number(
            (
              (defectiveProducts /
                total) *
              100
            ).toFixed(2)
          )
        : 0;

    const averageConfidence =
      confidenceValues.length > 0
        ? Number(
            (
              confidenceValues.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              confidenceValues.length
            ).toFixed(2)
          )
        : 0;

    const averageSeverity =
      severityValues.length > 0
        ? Number(
            (
              severityValues.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              severityValues.length
            ).toFixed(2)
          )
        : 0;

    // ============================================================
    // RETURN REPORT
    // ============================================================

    return {
      report_name:
        "Production Quality Report",

      total_inspections:
        total,

      passed_products:
        passedProducts,

      defective_products:
        defectiveProducts,

      review_products:
        reviewProducts,

      defect_rate:
        defectRate,

      average_confidence:
        averageConfidence,

      average_severity:
        averageSeverity,

      defect_types:
        defectTypes,

      severity: {
        low,
        medium,
        high,
        critical,
      },

      decisions: {
        pass:
          passCount,

        review:
          reviewCount,

        reject:
          rejectCount,
      },
    };
  }

  // ============================================================
  // DECISION FALLBACK
  // ============================================================

  function inferDecisionFromInspection(
    inspection
  ) {
    const prediction = String(
      inspection?.prediction ??
        ""
    )
      .trim()
      .toLowerCase();

    const defect =
      inspection?.defect === true;

    const defectType = String(
      inspection?.defectClassification ??
        inspection?.defect_classification ??
        inspection?.defectType ??
        inspection?.defect_type ??
        inspection?.classification ??
        ""
    )
      .trim()
      .toLowerCase();

    if (
      prediction === "passed" ||
      prediction === "pass" ||
      prediction === "good" ||
      prediction === "normal"
    ) {
      return "PASS";
    }

    if (
      prediction === "review" ||
      prediction === "pending"
    ) {
      return "REVIEW";
    }

    if (
      defect ||
      prediction === "defective" ||
      prediction === "defect" ||
      prediction === "failed" ||
      prediction === "fail" ||
      defectType.includes(
        "broken"
      ) ||
      defectType.includes(
        "contamination"
      ) ||
      defectType.includes(
        "crack"
      ) ||
      defectType.includes(
        "scratch"
      ) ||
      defectType.includes(
        "missing"
      ) ||
      defectType.includes(
        "manufacturing"
      )
    ) {
      return "REJECT";
    }

    return "PASS";
  }

  // ============================================================
  // NORMALIZE DEFECT NAME
  // ============================================================

  function normalizeDefectName(
    name
  ) {
    const normalized = String(name)
      .trim()
      .toLowerCase();

    if (
      normalized ===
        "broken_small" ||
      normalized ===
        "broken small" ||
      normalized.includes(
        "broken_small"
      ) ||
      normalized.includes(
        "broken small"
      )
    ) {
      return "Broken Small";
    }

    if (
      normalized ===
        "broken_large" ||
      normalized ===
        "broken large" ||
      normalized.includes(
        "broken_large"
      ) ||
      normalized.includes(
        "broken large"
      )
    ) {
      return "Broken Large";
    }

    if (
      normalized.includes(
        "contamination"
      )
    ) {
      return "Contamination";
    }

    if (
      normalized.includes(
        "manufacturing"
      )
    ) {
      return "Manufacturing Defect";
    }

    if (
      normalized.includes(
        "missing"
      ) &&
      normalized.includes(
        "component"
      )
    ) {
      return "Missing Component";
    }

    if (
      normalized.includes(
        "crack"
      )
    ) {
      return "Crack";
    }

    if (
      normalized.includes(
        "scratch"
      )
    ) {
      return "Scratch";
    }

    return String(name)
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

  // ============================================================
  // FORMAT DEFECT NAME
  // ============================================================

  function formatDefectName(
    name
  ) {
    if (!name) {
      return "Unknown";
    }

    const normalized = String(name)
      .trim()
      .toLowerCase();

    if (
      normalized ===
        "broken_small" ||
      normalized ===
        "broken small"
    ) {
      return "Broken Small";
    }

    if (
      normalized ===
        "broken_large" ||
      normalized ===
        "broken large"
    ) {
      return "Broken Large";
    }

    if (
      normalized ===
      "manufacturing defect"
    ) {
      return "Manufacturing Defect";
    }

    if (
      normalized ===
      "missing component"
    ) {
      return "Missing Component";
    }

    if (
      normalized ===
      "contamination"
    ) {
      return "Contamination";
    }

    if (
      normalized ===
      "crack"
    ) {
      return "Crack";
    }

    if (
      normalized ===
      "scratch"
    ) {
      return "Scratch";
    }

    return String(name)
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

  // ============================================================
  // DOWNLOAD REPORT
  // ============================================================

  function downloadReport() {
    if (!report) {
      return;
    }

    const generatedAt =
      new Date().toLocaleString();

    const totalDefectClassifications =
      Object.values(
        report.defect_types || {}
      ).reduce(
        (sum, count) =>
          sum + Number(count),
        0
      );

    const defectRows =
      Object.entries(
        report.defect_types || {}
      )
        .sort(
          ([, a], [, b]) =>
            Number(b) -
            Number(a)
        )
        .map(
          ([type, count]) => {
            const percentage =
              totalDefectClassifications > 0
                ? (
                    (Number(count) /
                      totalDefectClassifications) *
                    100
                  ).toFixed(1)
                : "0.0";

            return `
              <tr>
                <td>
                  ${escapeHtml(
                    formatDefectName(
                      type
                    )
                  )}
                </td>
                <td>
                  ${count}
                </td>
                <td>
                  ${percentage}%
                </td>
              </tr>
            `;
          }
        )
        .join("");

    const reportHtml = `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  VisionInspectAI Production Quality Report
</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 45px;
  background: #111827;
  color: #F8FAFC;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  line-height: 1.6;
}

.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.header {
  padding-bottom: 28px;
  border-bottom: 1px solid #334155;
  margin-bottom: 30px;
}

.kicker {
  color: #38BDF8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

h1 {
  margin: 8px 0;
  font-size: 34px;
  line-height: 1.2;
}

.subtitle {
  color: #94A3B8;
  font-size: 16px;
}

.generated {
  color: #64748B;
  font-size: 13px;
  margin-top: 12px;
}

.section {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 26px;
  margin-bottom: 24px;
}

.section-kicker {
  color: #38BDF8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.3px;
  margin-bottom: 6px;
}

.section h2 {
  margin: 0 0 18px;
  font-size: 23px;
  color: #F8FAFC;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.summary-card {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 21px;
}

.summary-label {
  color: #94A3B8;
  font-size: 13px;
}

.summary-value {
  color: #F8FAFC;
  font-size: 29px;
  font-weight: 700;
  margin-top: 8px;
}

.green {
  color: #22C55E;
}

.red {
  color: #EF4444;
}

.cyan {
  color: #38BDF8;
}

.orange {
  color: #F59E0B;
}

.theory-box {
  background: #273449;
  border: 1px solid #334155;
  border-left:
    4px solid #38BDF8;
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.theory-box h3 {
  margin: 0 0 8px;
  color: #F8FAFC;
  font-size: 17px;
}

.theory-box p {
  color: #CBD5E1;
  margin: 0 0 12px;
}

.theory-box p:last-child {
  margin-bottom: 0;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

th {
  text-align: left;
  padding: 14px 12px;
  background: #0F172A;
  color: #94A3B8;
  border-bottom: 1px solid #334155;
}

td {
  padding: 14px 12px;
  color: #CBD5E1;
  border-bottom: 1px solid #334155;
}

.severity-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
}

.severity-card {
  padding: 20px;
  border-radius: 10px;
}

.severity-count {
  margin-top: 7px;
  color: #F8FAFC;
  font-size: 30px;
  font-weight: 700;
}

.severity-low {
  background:
    rgba(34, 197, 94, 0.10);
  border:
    1px solid rgba(34, 197, 94, 0.30);
  color: #22C55E;
}

.severity-medium {
  background:
    rgba(245, 158, 11, 0.10);
  border:
    1px solid rgba(245, 158, 11, 0.30);
  color: #F59E0B;
}

.severity-high,
.severity-critical {
  background:
    rgba(239, 68, 68, 0.10);
  border:
    1px solid rgba(239, 68, 68, 0.30);
  color: #EF4444;
}

.decision-grid {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 16px;
}

.decision-card {
  padding: 22px;
  border-radius: 10px;
  text-align: center;
}

.decision-count {
  margin-top: 6px;
  color: #F8FAFC;
  font-size: 30px;
  font-weight: 700;
}

.decision-description {
  color: #94A3B8;
  font-size: 13px;
}

.decision-pass {
  background:
    rgba(34, 197, 94, 0.10);
  border:
    1px solid rgba(34, 197, 94, 0.30);
}

.decision-review {
  background:
    rgba(245, 158, 11, 0.10);
  border:
    1px solid rgba(245, 158, 11, 0.30);
}

.decision-reject {
  background:
    rgba(239, 68, 68, 0.10);
  border:
    1px solid rgba(239, 68, 68, 0.30);
}

.info-grid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 15px;
}

.info-card {
  background: #273449;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 18px;
}

.info-card h3 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #F8FAFC;
}

.info-card p {
  margin: 0;
  color: #94A3B8;
}

.footer {
  text-align: center;
  color: #94A3B8;
  padding-top: 22px;
  margin-top: 30px;
  border-top: 1px solid #334155;
  font-size: 13px;
}

@media print {

  body {
    background: white;
    color: #111827;
    padding: 25px;
  }

  .section,
  .summary-card {
    break-inside: avoid;
  }

  .theory-box {
    break-inside: avoid;
  }

}

@media (max-width: 800px) {

  body {
    padding: 20px;
  }

  .summary-grid,
  .severity-grid,
  .decision-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="kicker">
VISIONINSPECTAI • QUALITY CONTROL
</div>

<h1>
Production Quality Report
</h1>

<div class="subtitle">
AI-based manufacturing inspection summary
</div>

<div class="generated">
Generated: ${generatedAt}
</div>

</div>

<section class="section">

<div class="section-kicker">
EXECUTIVE SUMMARY
</div>

<h2>
Production Quality Overview
</h2>

<div class="summary-grid">

<div class="summary-card">
<div class="summary-label">
Total Inspections
</div>
<div class="summary-value">
${report.total_inspections}
</div>
</div>

<div class="summary-card">
<div class="summary-label">
Passed Products
</div>
<div class="summary-value green">
${report.passed_products}
</div>
</div>

<div class="summary-card">
<div class="summary-label">
Defective Products
</div>
<div class="summary-value red">
${report.defective_products}
</div>
</div>

<div class="summary-card">
<div class="summary-label">
Defect Rate
</div>
<div class="summary-value cyan">
${report.defect_rate}%
</div>
</div>

<div class="summary-card">
<div class="summary-label">
Average Confidence
</div>
<div class="summary-value cyan">
${report.average_confidence}%
</div>
</div>

<div class="summary-card">
<div class="summary-label">
Average Severity
</div>
<div class="summary-value orange">
${report.average_severity}/100
</div>
</div>

</div>

</section>

<section class="section">

<div class="section-kicker">
DEFECT ANALYSIS
</div>

<h2>
Defect Summary
</h2>

<div class="table-wrapper">

<table>

<thead>

<tr>
<th>Defect Type</th>
<th>Count</th>
<th>Percentage</th>
</tr>

</thead>

<tbody>

${
  defectRows ||
  `
  <tr>
    <td colspan="3">
      No defect data available
    </td>
  </tr>
  `
}

</tbody>

</table>

</div>

<div class="theory-box">

<h3>
Defect classification
</h3>

<p>
Defect classification organizes quality problems
into meaningful categories such as broken components,
cracks, scratches, missing components, contamination,
or other manufacturing defects.
</p>

<p>
The count of each defect type indicates how frequently
that category occurred among the inspection results
classified as REVIEW or REJECT.
</p>

<p>
Frequently occurring defect categories can indicate
recurring manufacturing problems and may require
further investigation of the production process.
</p>

</div>

</section>

<section class="section">

<div class="section-kicker">
RISK ASSESSMENT
</div>

<h2>
Severity Summary
</h2>

<div class="severity-grid">

<div class="severity-card severity-low">
<strong>Low</strong>

<div class="severity-count">
${report.severity?.low ?? 0}
</div>
</div>

<div class="severity-card severity-medium">
<strong>Medium</strong>

<div class="severity-count">
${report.severity?.medium ?? 0}
</div>
</div>

<div class="severity-card severity-high">
<strong>High</strong>

<div class="severity-count">
${report.severity?.high ?? 0}
</div>
</div>

<div class="severity-card severity-critical">
<strong>Critical</strong>

<div class="severity-count">
${report.severity?.critical ?? 0}
</div>
</div>

</div>

<div class="theory-box">

<h3>
Severity assessment
</h3>

<p>
Severity represents the relative level of
quality risk associated with a confirmed
manufacturing defect. It helps the quality
team prioritize inspection, rework, corrective
action, or rejection.
</p>

<p>
Low-severity defects generally represent minor
quality concerns. Medium-severity defects may
require further inspection or verification.
High-severity defects represent a significant
quality concern and may require rework.
</p>

<p>
Critical defects represent the highest level
of quality concern and may justify rejection
of the affected product depending on the
inspection rules and production requirements.
</p>

</div>

</section>

<section class="section">

<div class="section-kicker">
QUALITY DECISION
</div>

<h2>
Quality Control Summary
</h2>

<div class="decision-grid">

<div class="decision-card decision-pass">

<strong style="color:#22C55E;">
PASS
</strong>

<div class="decision-count">
${report.decisions?.pass ?? 0}
</div>

<div class="decision-description">
Products accepted
</div>

</div>

<div class="decision-card decision-review">

<strong style="color:#F59E0B;">
REVIEW
</strong>

<div class="decision-count">
${report.decisions?.review ?? 0}
</div>

<div class="decision-description">
Additional verification
</div>

</div>

<div class="decision-card decision-reject">

<strong style="color:#EF4444;">
REJECT
</strong>

<div class="decision-count">
${report.decisions?.reject ?? 0}
</div>

<div class="decision-description">
Products rejected
</div>

</div>

</div>

<div class="theory-box">

<h3>
PASS
</h3>

<p>
A PASS decision indicates that the inspection
result satisfies the quality conditions recorded
by the system and the product can proceed through
the production workflow.
</p>

<h3>
REVIEW
</h3>

<p>
A REVIEW decision indicates that the inspection
result requires additional verification before
the product receives a final quality decision.
</p>

<h3>
REJECT
</h3>

<p>
A REJECT decision indicates that the product has
been identified as unacceptable according to the
recorded inspection decision and may require
corrective action, rework, or rejection.
</p>

</div>

</section>

<section class="section">

<div class="section-kicker">
QUALITY METRICS
</div>

<h2>
Metric Interpretation
</h2>

<div class="info-grid">

<div class="info-card">

<h3>
Defect Rate
</h3>

<p>
Defect rate represents the percentage of inspected
products identified as confirmed defective.
It provides a high-level indication of
manufacturing quality.
</p>

</div>

<div class="info-card">

<h3>
AI Confidence
</h3>

<p>
Average confidence represents the average confidence
associated with the recorded AI inspection
predictions. It provides an indication of
prediction certainty.
</p>

</div>

<div class="info-card">

<h3>
Average Severity
</h3>

<p>
Average severity represents the average severity
score among the confirmed defective inspection
results and provides an indication of overall
quality risk.
</p>

</div>

<div class="info-card">

<h3>
Production Monitoring
</h3>

<p>
Tracking defect frequency, severity, confidence,
and quality decisions helps quality teams identify
recurring problems and monitor manufacturing
performance.
</p>

</div>

</div>

</section>

<section class="section">

<div class="section-kicker">
REPORT CONCLUSION
</div>

<h2>
Production Quality Interpretation
</h2>

<div class="theory-box">

<p>
The Production Quality Report consolidates the
inspection results generated by VisionInspectAI
into a structured quality-monitoring document.
</p>

<p>
Reviewing inspection volume, defect classifications,
severity distribution, AI confidence, and quality
decisions provides a clear overview of product
quality performance.
</p>

<p>
These results can support quality monitoring,
defect investigation, corrective action planning,
process improvement, and continuous manufacturing
quality assessment.
</p>

</div>

</section>

<section class="section">

<div class="section-kicker">
SYSTEM INFORMATION
</div>

<h2>
Report Information
</h2>

<div class="info-grid">

<div class="info-card">

<h3>
System
</h3>

<p>
VisionInspectAI
</p>

</div>

<div class="info-card">

<h3>
Report Type
</h3>

<p>
Production Quality Report
</p>

</div>

<div class="info-card">

<h3>
Generated
</h3>

<p>
${generatedAt}
</p>

</div>

<div class="info-card">

<h3>
Purpose
</h3>

<p>
Manufacturing product quality inspection,
defect monitoring, and production quality
assessment.
</p>

</div>

</div>

</section>

<div class="footer">

VisionInspectAI • Smart Manufacturing Quality
Inspection System

</div>

</div>

</body>

</html>
`;

    const blob = new Blob(
      [reportHtml],
      {
        type:
          "text/html;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `VisionInspectAI_Production_Quality_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.html`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  }

  // ============================================================
  // ESCAPE HTML
  // ============================================================

  function escapeHtml(value) {
    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>

        <SupervisorNavbar
          active="report"
        />

        <main
          style={
            styles.container
          }
        >

          <div
            style={
              styles.loadingBox
            }
          >
            Loading production quality report...
          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (
    error ||
    !report
  ) {
    return (
      <div
        style={
          styles.page
        }
      >

        <SupervisorNavbar
          active="report"
        />

        <main
          style={
            styles.container
          }
        >

          <div
            style={
              styles.header
            }
          >

            <div>

              <div
                style={
                  styles.kicker
                }
              >
                QUALITY CONTROL • REPORTING
              </div>

              <h1
                style={
                  styles.title
                }
              >
                Production Quality Report
              </h1>

            </div>

          </div>

          <div
            style={
              styles.error
            }
          >
            {error ||
              "Unable to load production quality report."}
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadReport();
            }}
            style={
              styles.button
            }
          >
            Retry
          </button>

        </main>

      </div>
    );
  }

  // ============================================================
  // RENDER REPORT
  // ============================================================

  const totalDefectClassifications =
    Object.values(
      report.defect_types || {}
    ).reduce(
      (sum, count) =>
        sum + Number(count),
      0
    );

  return (
    <div
      style={
        styles.page
      }
    >

      <SupervisorNavbar
        active="report"
      />

      <main
        style={
          styles.container
        }
      >

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div
          style={
            styles.header
          }
        >

          <div>

            <div
              style={
                styles.kicker
              }
            >
              QUALITY CONTROL • REPORTING
            </div>

            <h1
              style={
                styles.title
              }
            >
              Production Quality Report
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              AI-based manufacturing inspection summary
            </p>

          </div>

          <button
            type="button"
            onClick={
              downloadReport
            }
            style={
              styles.button
            }
            onMouseEnter={
              (e) => {
                e.currentTarget.style.background =
                  "#38BDF8";
              }
            }
            onMouseLeave={
              (e) => {
                e.currentTarget.style.background =
                  "#2563EB";
              }
            }
          >
            Download Report
          </button>

        </div>

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div
          style={
            styles.grid
          }
        >

          <Card
            title="Total Inspections"
            value={
              report.total_inspections
            }
          />

          <Card
            title="Passed Products"
            value={
              report.passed_products
            }
            valueColor="#22C55E"
          />

          <Card
            title="Defective Products"
            value={
              report.defective_products
            }
            valueColor="#EF4444"
          />

          <Card
            title="Defect Rate"
            value={`${report.defect_rate}%`}
            valueColor="#38BDF8"
          />

          <Card
            title="Average Confidence"
            value={`${report.average_confidence}%`}
            valueColor="#38BDF8"
          />

          <Card
            title="Average Severity"
            value={`${report.average_severity}/100`}
            valueColor="#F59E0B"
          />

        </div>

        {/* ======================================================
            DEFECT SUMMARY
        ====================================================== */}

        <section
          style={
            styles.section
          }
        >

          <div
            style={
              styles.sectionHeader
            }
          >

            <div>

              <div
                style={
                  styles.sectionKicker
                }
              >
                DEFECT ANALYSIS
              </div>

              <h2
                style={
                  styles.sectionTitle
                }
              >
                Defect Summary
              </h2>

            </div>

            <div
              style={
                styles.sectionBadge
              }
            >
              {
                totalDefectClassifications
              }{" "}
              Total Defects
            </div>

          </div>

          <div
            style={
              styles.tableWrapper
            }
          >

            <table
              style={
                styles.table
              }
            >

              <thead>

                <tr>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Defect Type
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Count
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Percentage
                  </th>

                </tr>

              </thead>

              <tbody>

                {Object.entries(
                  report.defect_types ||
                    {}
                )
                  .sort(
                    ([, a], [, b]) =>
                      Number(b) -
                      Number(a)
                  )
                  .map(
                    (
                      [
                        type,
                        count,
                      ]
                    ) => {

                      const percentage =
                        totalDefectClassifications > 0
                          ? (
                              (Number(
                                count
                              ) /
                                totalDefectClassifications) *
                              100
                            ).toFixed(
                              1
                            )
                          : "0.0";

                      return (
                        <tr
                          key={
                            type
                          }
                        >

                          <td
                            style={
                              styles.td
                            }
                          >
                            <strong>
                              {
                                formatDefectName(
                                  type
                                )
                              }
                            </strong>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {count}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {percentage}%
                          </td>

                        </tr>
                      );

                    }
                  )}

                {Object.keys(
                  report.defect_types ||
                    {}
                ).length ===
                  0 && (
                  <tr>

                    <td
                      colSpan="3"
                      style={
                        styles.emptyCell
                      }
                    >
                      No defect data available
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ======================================================
            SEVERITY SUMMARY
        ====================================================== */}

        <section
          style={
            styles.section
          }
        >

          <div
            style={
              styles.sectionKicker
            }
          >
            RISK ASSESSMENT
          </div>

          <h2
            style={
              styles.sectionTitle
            }
          >
            Severity Summary
          </h2>

          <div
            style={
              styles.severityGrid
            }
          >

            <SeverityCard
              title="Low"
              value={
                report.severity?.low ??
                0
              }
              color="#22C55E"
              background="rgba(34, 197, 94, 0.10)"
              border="rgba(34, 197, 94, 0.30)"
            />

            <SeverityCard
              title="Medium"
              value={
                report.severity?.medium ??
                0
              }
              color="#F59E0B"
              background="rgba(245, 158, 11, 0.10)"
              border="rgba(245, 158, 11, 0.30)"
            />

            <SeverityCard
              title="High"
              value={
                report.severity?.high ??
                0
              }
              color="#EF4444"
              background="rgba(239, 68, 68, 0.10)"
              border="rgba(239, 68, 68, 0.30)"
            />

            <SeverityCard
              title="Critical"
              value={
                report.severity?.critical ??
                0
              }
              color="#EF4444"
              background="rgba(239, 68, 68, 0.16)"
              border="rgba(239, 68, 68, 0.45)"
            />

          </div>

        </section>

        {/* ======================================================
            QUALITY DECISION
        ====================================================== */}

        <section
          style={
            styles.section
          }
        >

          <div
            style={
              styles.sectionKicker
            }
          >
            QUALITY DECISION
          </div>

          <h2
            style={
              styles.sectionTitle
            }
          >
            Quality Control Summary
          </h2>

          <div
            style={
              styles.decisionGrid
            }
          >

            <DecisionCard
              title="PASS"
              value={
                report.decisions?.pass ??
                0
              }
              color="#22C55E"
              background="rgba(34, 197, 94, 0.10)"
              border="rgba(34, 197, 94, 0.30)"
            />

            <DecisionCard
              title="REVIEW"
              value={
                report.decisions?.review ??
                0
              }
              color="#F59E0B"
              background="rgba(245, 158, 11, 0.10)"
              border="rgba(245, 158, 11, 0.30)"
            />

            <DecisionCard
              title="REJECT"
              value={
                report.decisions?.reject ??
                0
              }
              color="#EF4444"
              background="rgba(239, 68, 68, 0.10)"
              border="rgba(239, 68, 68, 0.30)"
            />

          </div>

        </section>

        {/* ======================================================
            REPORT INFORMATION
        ====================================================== */}

        <section
          style={
            styles.section
          }
        >

          <div
            style={
              styles.sectionKicker
            }
          >
            SYSTEM INFORMATION
          </div>

          <h2
            style={
              styles.sectionTitle
            }
          >
            Report Information
          </h2>

          <div
            style={
              styles.reportInfoGrid
            }
          >

            <div
              style={
                styles.infoItem
              }
            >

              <span
                style={
                  styles.infoLabel
                }
              >
                Generated
              </span>

              <strong
                style={
                  styles.infoValue
                }
              >
                {
                  new Date().toLocaleString()
                }
              </strong>

            </div>

            <div
              style={
                styles.infoItem
              }
            >

              <span
                style={
                  styles.infoLabel
                }
              >
                System
              </span>

              <strong
                style={
                  styles.infoValue
                }
              >
                VisionInspectAI
              </strong>

            </div>

            <div
              style={
                styles.infoItem
              }
            >

              <span
                style={
                  styles.infoLabel
                }
              >
                Purpose
              </span>

              <strong
                style={
                  styles.infoValue
                }
              >
                Manufacturing product quality
                inspection and defect monitoring.
              </strong>

            </div>

          </div>

        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer
          style={
            styles.footer
          }
        >

          <div>

            <strong>
              VisionInspectAI
            </strong>

            <span
              style={{
                display:
                  "block",
                marginTop:
                  "4px",
              }}
            >
              Smart Manufacturing Quality
              Inspection System
            </span>

          </div>

          <span>
            Production Quality Reporting
          </span>

        </footer>

      </main>

    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function Card({
  title,
  value,
  valueColor = "#F8FAFC",
}) {
  return (
    <div
      style={
        styles.card
      }
    >

      <div
        style={
          styles.cardTitle
        }
      >
        {title}
      </div>

      <div
        style={{
          ...styles.cardValue,
          color:
            valueColor,
        }}
      >
        {value}
      </div>

    </div>
  );
}

// ============================================================
// SEVERITY CARD
// ============================================================

function SeverityCard({
  title,
  value,
  color,
  background,
  border,
}) {
  return (
    <div
      style={{
        ...styles.severityCard,
        background,
        border:
          `1px solid ${border}`,
      }}
    >

      <div
        style={{
          ...styles.severityTitle,
          color,
        }}
      >
        {title}
      </div>

      <div
        style={
          styles.severityValue
        }
      >
        {value}
      </div>

    </div>
  );
}

// ============================================================
// DECISION CARD
// ============================================================

function DecisionCard({
  title,
  value,
  color,
  background,
  border,
}) {
  return (
    <div
      style={{
        ...styles.decisionBox,
        background,
        border:
          `1px solid ${border}`,
      }}
    >

      <strong
        style={{
          color,
        }}
      >
        {title}
      </strong>

      <span
        style={
          styles.decisionValue
        }
      >
        {value}
      </span>

    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {

  page: {
    minHeight:
      "100vh",
    width:
      "100%",
    background:
      "#111827",
    color:
      "#F8FAFC",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    boxSizing:
      "border-box",
  },

  container: {
    width:
      "100%",
    padding:
      "35px 45px",
    margin:
      0,
    fontFamily:
      "Arial, Helvetica, sans-serif",
    background:
      "#111827",
    color:
      "#F8FAFC",
    boxSizing:
      "border-box",
  },

  header: {
    width:
      "100%",
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      "24px",
    marginBottom:
      "30px",
    flexWrap:
      "wrap",
    paddingBottom:
      "24px",
    borderBottom:
      "1px solid #334155",
  },

  kicker: {
    color:
      "#38BDF8",
    fontSize:
      "12px",
    fontWeight:
      "700",
    letterSpacing:
      "1.5px",
    marginBottom:
      "8px",
  },

  title: {
    margin:
      0,
    fontSize:
      "32px",
    lineHeight:
      "1.2",
    color:
      "#F8FAFC",
    fontWeight:
      "700",
  },

  subtitle: {
    color:
      "#94A3B8",
    marginTop:
      "9px",
    marginBottom:
      0,
    fontSize:
      "16px",
  },

  button: {
    padding:
      "12px 20px",
    border:
      "1px solid #334155",
    borderRadius:
      "9px",
    background:
      "#2563EB",
    color:
      "#F8FAFC",
    cursor:
      "pointer",
    fontWeight:
      "700",
    fontSize:
      "14px",
    transition:
      "all 0.2s ease",
  },

  loadingBox: {
    background:
      "#1E293B",
    border:
      "1px solid #334155",
    padding:
      "30px",
    borderRadius:
      "12px",
    color:
      "#94A3B8",
    textAlign:
      "center",
  },

  error: {
    background:
      "rgba(239, 68, 68, 0.10)",
    color:
      "#EF4444",
    padding:
      "18px",
    border:
      "1px solid rgba(239, 68, 68, 0.30)",
    borderRadius:
      "10px",
    marginBottom:
      "15px",
  },

  grid: {
    width:
      "100%",
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(200px, 1fr))",
    gap:
      "18px",
    marginBottom:
      "25px",
  },

  card: {
    background:
      "#1E293B",
    borderRadius:
      "12px",
    padding:
      "22px",
    border:
      "1px solid #334155",
    boxShadow:
      "0 8px 22px rgba(0, 0, 0, 0.18)",
    minWidth:
      0,
  },

  cardTitle: {
    color:
      "#94A3B8",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  cardValue: {
    fontSize:
      "30px",
    fontWeight:
      "700",
    marginTop:
      "10px",
  },

  section: {
    width:
      "100%",
    background:
      "#1E293B",
    padding:
      "26px",
    borderRadius:
      "14px",
    marginBottom:
      "25px",
    border:
      "1px solid #334155",
    boxShadow:
      "0 8px 22px rgba(0, 0, 0, 0.18)",
    boxSizing:
      "border-box",
  },

  sectionHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      "15px",
    marginBottom:
      "20px",
    flexWrap:
      "wrap",
  },

  sectionKicker: {
    color:
      "#38BDF8",
    fontSize:
      "11px",
    fontWeight:
      "700",
    letterSpacing:
      "1.3px",
    marginBottom:
      "6px",
  },

  sectionTitle: {
    margin:
      0,
    color:
      "#F8FAFC",
    fontSize:
      "24px",
  },

  sectionBadge: {
    background:
      "rgba(37, 99, 235, 0.16)",
    color:
      "#38BDF8",
    border:
      "1px solid rgba(56, 189, 248, 0.25)",
    padding:
      "8px 12px",
    borderRadius:
      "8px",
    fontSize:
      "13px",
    fontWeight:
      "700",
  },

  tableWrapper: {
    width:
      "100%",
    overflowX:
      "auto",
  },

  table: {
    width:
      "100%",
    borderCollapse:
      "collapse",
    minWidth:
      "650px",
  },

  th: {
    textAlign:
      "left",
    padding:
      "14px 12px",
    borderBottom:
      "1px solid #334155",
    color:
      "#94A3B8",
    fontSize:
      "13px",
    fontWeight:
      "700",
    background:
      "#0F172A",
  },

  td: {
    padding:
      "15px 12px",
    borderBottom:
      "1px solid #334155",
    color:
      "#CBD5E1",
    fontSize:
      "14px",
  },

  emptyCell: {
    padding:
      "25px",
    textAlign:
      "center",
    color:
      "#94A3B8",
  },

  severityGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(4, minmax(150px, 1fr))",
    gap:
      "15px",
    marginTop:
      "10px",
  },

  severityCard: {
    padding:
      "20px",
    borderRadius:
      "10px",
    textAlign:
      "center",
  },

  severityTitle: {
    fontWeight:
      "700",
    fontSize:
      "15px",
  },

  severityValue: {
    fontSize:
      "30px",
    marginTop:
      "8px",
    fontWeight:
      "700",
    color:
      "#F8FAFC",
  },

  decisionGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(180px, 1fr))",
    gap:
      "18px",
    marginTop:
      "10px",
  },

  decisionBox: {
    minHeight:
      "105px",
    padding:
      "22px",
    borderRadius:
      "10px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "8px",
  },

  decisionValue: {
    fontSize:
      "30px",
    fontWeight:
      "700",
    color:
      "#F8FAFC",
  },

  reportInfoGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(180px, 1fr))",
    gap:
      "15px",
  },

  infoItem: {
    background:
      "#273449",
    border:
      "1px solid #334155",
    borderRadius:
      "10px",
    padding:
      "18px",
    display:
      "flex",
    flexDirection:
      "column",
    gap:
      "7px",
  },

  infoLabel: {
    color:
      "#94A3B8",
    fontSize:
      "12px",
    fontWeight:
      "600",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.7px",
  },

  infoValue: {
    color:
      "#F8FAFC",
    fontSize:
      "14px",
    lineHeight:
      "1.5",
  },

  footer: {
    borderTop:
      "1px solid #334155",
    paddingTop:
      "20px",
    marginTop:
      "8px",
    paddingBottom:
      "20px",
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      "12px",
    flexWrap:
      "wrap",
    color:
      "#94A3B8",
    fontSize:
      "13px",
  },

};