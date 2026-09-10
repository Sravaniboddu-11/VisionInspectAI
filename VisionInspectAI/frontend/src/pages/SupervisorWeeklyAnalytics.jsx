import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import "./SupervisorWeeklyAnalytics.css";
import {
  getInspections,
} from "../utils/inspectionStorage";
import SupervisorNavbar from "../components/SupervisorNavbar";

function SupervisorWeeklyAnalytics() {
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

  const getInspectionDate = (
    item
  ) => {
    return (
      item?.createdAt ||
      item?.created_at ||
      item?.date ||
      item?.timestamp ||
      null
    );
  };

  // ============================================================
  // NON-OVERLAPPING STATUS
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

    return (
      prediction.includes(
        "defect"
      ) ||
      prediction.includes(
        "broken"
      ) ||
      prediction.includes(
        "crack"
      ) ||
      prediction.includes(
        "scratch"
      ) ||
      prediction.includes(
        "missing"
      ) ||
      prediction.includes(
        "contamination"
      )
    );
  };

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getMonday = (
    dateValue
  ) => {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    date.setHours(
      0,
      0,
      0,
      0
    );

    const day =
      date.getDay();

    const difference =
      day === 0
        ? 6
        : day - 1;

    date.setDate(
      date.getDate() -
        difference
    );

    return date;
  };

  const getWeekNumber = (
    dateValue
  ) => {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 0;
    }

    const firstDay =
      new Date(
        date.getFullYear(),
        0,
        1
      );

    const dayOfYear =
      Math.floor(
        (date -
          firstDay) /
          (1000 *
            60 *
            60 *
            24)
      ) + 1;

    return Math.ceil(
      dayOfYear / 7
    );
  };

  const formatWeekRange = (
    weekStart
  ) => {
    const start =
      new Date(weekStart);

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 6
    );

    return `${start.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
      }
    )} - ${end.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
      }
    )}`;
  };

  // ============================================================
  // WEEKLY DATA
  // ============================================================

  const weeklyData =
    useMemo(() => {
      const groups = {};

      inspections.forEach(
        (item) => {
          const dateValue =
            getInspectionDate(
              item
            );

          if (!dateValue) {
            return;
          }

          const monday =
            getMonday(
              dateValue
            );

          if (!monday) {
            return;
          }

          const weekStart =
            monday
              .toISOString()
              .split("T")[0];

          if (
            !groups[
              weekStart
            ]
          ) {
            groups[
              weekStart
            ] = {
              weekStart,
              inspections: 0,
              passed: 0,
              defective: 0,
              review: 0,
            };
          }

          groups[
            weekStart
          ].inspections++;

          if (
            isPassed(item)
          ) {
            groups[
              weekStart
            ].passed++;
          } else if (
            isReview(item)
          ) {
            groups[
              weekStart
            ].review++;
          } else {
            groups[
              weekStart
            ].defective++;
          }
        }
      );

      return Object.values(
        groups
      )
        .sort(
          (a, b) =>
            new Date(
              a.weekStart
            ) -
            new Date(
              b.weekStart
            )
        )
        .map(
          (week) => ({
            ...week,

            passRate:
              week.inspections >
              0
                ? (
                    (week.passed /
                      week.inspections) *
                    100
                  ).toFixed(1)
                : "0.0",

            defectRate:
              week.inspections >
              0
                ? (
                    (week.defective /
                      week.inspections) *
                    100
                  ).toFixed(1)
                : "0.0",

            reviewRate:
              week.inspections >
              0
                ? (
                    (week.review /
                      week.inspections) *
                    100
                  ).toFixed(1)
                : "0.0",
          })
        );
    }, [
      inspections,
    ]);

  // ============================================================
  // TOTAL SUMMARY
  // ============================================================

  const totalInspections =
    inspections.length;

  const totalPassed =
    inspections.filter(
      isPassed
    ).length;

  const totalReview =
    inspections.filter(
      isReview
    ).length;

  const totalDefective =
    Math.max(
      0,
      totalInspections -
        totalPassed -
        totalReview
    );

  const overallPassRate =
    totalInspections > 0
      ? (
          (totalPassed /
            totalInspections) *
          100
        ).toFixed(1)
      : "0.0";

  const overallDefectRate =
    totalInspections > 0
      ? (
          (totalDefective /
            totalInspections) *
          100
        ).toFixed(1)
      : "0.0";

  // ============================================================
  // MAX VALUES
  // ============================================================

  const maxWeeklyInspections =
    weeklyData.length > 0
      ? Math.max(
          ...weeklyData.map(
            (week) =>
              week.inspections
          ),
          1
        )
      : 1;

  const maxWeeklyDefects =
    weeklyData.length > 0
      ? Math.max(
          ...weeklyData.map(
            (week) =>
              week.defective
          ),
          1
        )
      : 1;

  // ============================================================
  // LATEST WEEK
  // ============================================================

  const latestWeek =
    weeklyData.length > 0
      ? weeklyData[
          weeklyData.length - 1
        ]
      : null;

  // ============================================================
  // BEST WEEK
  // ============================================================

  const bestWeek =
    weeklyData.length > 0
      ? weeklyData.reduce(
          (
            best,
            current
          ) =>
            Number(
              current.passRate
            ) >
            Number(
              best.passRate
            )
              ? current
              : best,
          weeklyData[0]
        )
      : null;

  // ============================================================
  // DEFECT TYPE DATA
  //
  // These are the four reporting categories used by the
  // project dashboard:
  // Broken Small
  // Broken Large
  // Contamination
  // Manufacturing Defect
  //
  // Untrained categories such as Crack, Scratch and
  // Missing Component are not displayed.
  // ============================================================

  const defectTypeData =
    useMemo(() => {
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
            counts[
              "Broken Small"
            ]++;
          } else if (
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
            counts[
              "Broken Large"
            ]++;
          } else if (
            raw.includes(
              "contamin"
            )
          ) {
            counts[
              "Contamination"
            ]++;
          } else if (
            raw.includes(
              "manufactur"
            )
          ) {
            counts[
              "Manufacturing Defect"
            ]++;
          }
        }
      );

      return [
        {
          label:
            "Broken Small",
          count:
            counts[
              "Broken Small"
            ],
        },
        {
          label:
            "Broken Large",
          count:
            counts[
              "Broken Large"
            ],
        },
        {
          label:
            "Contamination",
          count:
            counts[
              "Contamination"
            ],
        },
        {
          label:
            "Manufacturing Defect",
          count:
            counts[
              "Manufacturing Defect"
            ],
        },
      ].sort(
        (a, b) =>
          b.count - a.count
      );
    }, [inspections]);

  const maxDefectType =
    Math.max(
      ...defectTypeData.map(
        (item) =>
          item.count
      ),
      1
    );

  // ============================================================
  // SEVERITY DATA
  // ============================================================

  const severityData =
    useMemo(() => {
      const counts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      };

      inspections.forEach(
        (item) => {
          const severity =
            String(
              item?.severityLevel ||
                item?.severity_level ||
                item?.severity ||
                ""
            )
              .trim()
              .toLowerCase();

          if (
            severity ===
            "critical"
          ) {
            counts.Critical++;
          } else if (
            severity === "high"
          ) {
            counts.High++;
          } else if (
            severity ===
            "medium"
          ) {
            counts.Medium++;
          } else if (
            severity === "low"
          ) {
            counts.Low++;
          }
        }
      );

      return [
        {
          label:
            "Critical",
          count:
            counts.Critical,
          className:
            "critical",
        },
        {
          label: "High",
          count:
            counts.High,
          className:
            "high",
        },
        {
          label:
            "Medium",
          count:
            counts.Medium,
          className:
            "medium",
        },
        {
          label: "Low",
          count:
            counts.Low,
          className:
            "low",
        },
      ];
    }, [inspections]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="weekly-analytics-page">

      {/* ======================================================
          SHARED SUPERVISOR NAVBAR
      ====================================================== */}

      <SupervisorNavbar
        active="weekly"
      />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="weekly-main">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="weekly-header">

          <div>

            <span className="weekly-kicker">
              PRODUCTION ANALYTICS
            </span>

            <h1>
              Weekly Production Analytics
            </h1>

            <p>
              Monitor weekly inspection volume,
              product quality, defect levels and
              review activity across production.
            </p>

          </div>

          <div className="weekly-user-card">

            <div className="weekly-user-avatar">
              👤
            </div>

            <div>

              <strong>
                {user?.name ||
                  user?.full_name ||
                  "Factory Supervisor"}
              </strong>

              <span>
                Factory Supervisor
              </span>

            </div>

            <span className="weekly-online">
              ●
            </span>

          </div>

        </section>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="weekly-summary-grid">

          <SummaryCard
            label="TOTAL INSPECTIONS"
            value={
              totalInspections
            }
            note="All recorded inspections"
            type="blue"
          />

          <SummaryCard
            label="PASSED PRODUCTS"
            value={
              totalPassed
            }
            note={`${overallPassRate}% overall pass rate`}
            type="green"
          />

          <SummaryCard
            label="DEFECTIVE PRODUCTS"
            value={
              totalDefective
            }
            note={`${overallDefectRate}% overall defect rate`}
            type="red"
          />

          <SummaryCard
            label="REQUIRES REVIEW"
            value={
              totalReview
            }
            note="Quality verification cases"
            type="amber"
          />

        </section>

        {/* ====================================================
            WEEKLY PERFORMANCE
        ==================================================== */}

        <section className="weekly-panel">

          <div className="weekly-panel-header">

            <div>

              <span>
                WEEKLY PERFORMANCE
              </span>

              <h2>
                Inspections & Defects by Week
              </h2>

              <p>
                Compare total production activity
                with weekly defective products.
              </p>

            </div>

            {latestWeek && (
              <div className="latest-week-card">

                <span>
                  LATEST WEEK
                </span>

                <strong>
                  Week{" "}
                  {getWeekNumber(
                    latestWeek.weekStart
                  )}
                </strong>

                <small>
                  {latestWeek.inspections}
                  {" "}
                  inspections
                </small>

              </div>
            )}

          </div>

          {weeklyData.length ===
          0 ? (

            <EmptyState />

          ) : (

            <div className="weekly-bar-chart">

              <div className="chart-y-label">
                Number of Products
              </div>

              <div className="chart-content">

                <div className="chart-grid">

                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>

                </div>

                <div className="chart-bars">

                  {weeklyData.map(
                    (
                      week,
                      index
                    ) => {

                      const inspectionHeight =
                        Math.max(
                          5,
                          (
                            week.inspections /
                              maxWeeklyInspections
                          ) * 100
                        );

                      const defectHeight =
                        Math.max(
                          4,
                          (
                            week.defective /
                              maxWeeklyDefects
                          ) * 70
                        );

                      return (
                        <div
                          className="week-chart-column"
                          key={
                            `${week.weekStart}-${index}`
                          }
                        >

                          <div className="chart-values">

                            <span className="inspection-value">
                              {week.inspections}
                            </span>

                            <span className="defect-value">
                              {week.defective}
                            </span>

                          </div>

                          <div className="dual-bars">

                            <div
                              className="inspection-bar"
                              style={{
                                height:
                                  `${inspectionHeight}%`,
                              }}
                            />

                            <div
                              className="defect-bar"
                              style={{
                                height:
                                  `${defectHeight}%`,
                              }}
                            />

                          </div>

                          <div className="chart-week-label">

                            <strong>
                              Week{" "}
                              {getWeekNumber(
                                week.weekStart
                              )}
                            </strong>

                            <span>
                              {formatWeekRange(
                                week.weekStart
                              )}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

          )}

          {weeklyData.length >
            0 && (
            <div className="chart-legend">

              <span>
                <i className="legend-inspection"></i>
                Total Inspections
              </span>

              <span>
                <i className="legend-defect"></i>
                Defective Products
              </span>

            </div>
          )}

        </section>

        {/* ====================================================
            PASSED / DEFECTIVE / REVIEW
        ==================================================== */}

        <section className="weekly-panel">

          <div className="weekly-panel-header">

            <div>

              <span>
                QUALITY OUTCOMES
              </span>

              <h2>
                Passed, Defective & Review
              </h2>

              <p>
                Weekly quality outcomes using the
                same three non-overlapping categories.
              </p>

            </div>

          </div>

          {weeklyData.length ===
          0 ? (

            <EmptyState />

          ) : (

            <div className="outcome-list">

              {weeklyData.map(
                (
                  week,
                  index
                ) => {

                  const total =
                    week.inspections ||
                    1;

                  const passedWidth =
                    (
                      week.passed /
                      total
                    ) * 100;

                  const defectiveWidth =
                    (
                      week.defective /
                      total
                    ) * 100;

                  const reviewWidth =
                    (
                      week.review /
                      total
                    ) * 100;

                  return (
                    <div
                      className="outcome-row"
                      key={
                        `${week.weekStart}-outcome-${index}`
                      }
                    >

                      <div className="outcome-label">

                        <strong>
                          Week{" "}
                          {getWeekNumber(
                            week.weekStart
                          )}
                        </strong>

                        <span>
                          {formatWeekRange(
                            week.weekStart
                          )}
                        </span>

                      </div>

                      <div className="outcome-track">

                        <div
                          className="outcome-passed"
                          style={{
                            width:
                              `${passedWidth}%`,
                          }}
                          title={`Passed: ${week.passed}`}
                        />

                        <div
                          className="outcome-defective"
                          style={{
                            width:
                              `${defectiveWidth}%`,
                          }}
                          title={`Defective: ${week.defective}`}
                        />

                        <div
                          className="outcome-review"
                          style={{
                            width:
                              `${reviewWidth}%`,
                          }}
                          title={`Review: ${week.review}`}
                        />

                      </div>

                      <div className="outcome-values">

                        <span className="passed-text">
                          {week.passed}
                        </span>

                        <span className="defective-text">
                          {week.defective}
                        </span>

                        <span className="review-text">
                          {week.review}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

          {weeklyData.length >
            0 && (
            <div className="outcome-legend">

              <span>
                <i className="passed-dot"></i>
                Passed
              </span>

              <span>
                <i className="defective-dot"></i>
                Defective
              </span>

              <span>
                <i className="review-dot"></i>
                Review
              </span>

            </div>
          )}

        </section>

        {/* ====================================================
            PASS / DEFECT RATE
        ==================================================== */}

        <section className="rate-grid">

          <div className="weekly-panel">

            <div className="weekly-panel-header">

              <div>

                <span>
                  PASS RATE
                </span>

                <h2>
                  Weekly Quality Rate
                </h2>

              </div>

            </div>

            {weeklyData.length ===
            0 ? (

              <EmptyState />

            ) : (

              <div className="rate-chart">

                {weeklyData.map(
                  (
                    week,
                    index
                  ) => {

                    const height =
                      Math.max(
                        5,
                        Number(
                          week.passRate
                        )
                      );

                    return (
                      <div
                        className="rate-column"
                        key={
                          `${week.weekStart}-pass-${index}`
                        }
                      >

                        <div className="rate-value">
                          {week.passRate}%
                        </div>

                        <div className="rate-bar-area">

                          <div
                            className="rate-bar"
                            style={{
                              height:
                                `${height}%`,
                            }}
                          />

                        </div>

                        <strong>
                          W
                          {getWeekNumber(
                            week.weekStart
                          )}
                        </strong>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

          <div className="weekly-panel">

            <div className="weekly-panel-header">

              <div>

                <span>
                  DEFECT RATE
                </span>

                <h2>
                  Weekly Defect Rate
                </h2>

              </div>

            </div>

            {weeklyData.length ===
            0 ? (

              <EmptyState />

            ) : (

              <div className="rate-chart defect-rate-chart">

                {weeklyData.map(
                  (
                    week,
                    index
                  ) => {

                    const height =
                      Math.max(
                        5,
                        Number(
                          week.defectRate
                        )
                      );

                    return (
                      <div
                        className="rate-column"
                        key={
                          `${week.weekStart}-defect-${index}`
                        }
                      >

                        <div className="rate-value defect-rate-value">
                          {week.defectRate}%
                        </div>

                        <div className="rate-bar-area">

                          <div
                            className="rate-bar defect-rate-bar"
                            style={{
                              height:
                                `${height}%`,
                            }}
                          />

                        </div>

                        <strong>
                          W
                          {getWeekNumber(
                            week.weekStart
                          )}
                        </strong>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </section>

        {/* ====================================================
            DEFECT TYPES + SEVERITY
        ==================================================== */}

        <section className="analysis-grid">

          {/* DEFECT TYPES */}

          <div className="weekly-panel">

            <div className="weekly-panel-header">

              <div>

                <span>
                  DEFECT DISTRIBUTION
                </span>

                <h2>
                  Defect Types
                </h2>

                <p>
                  Confirmed defective inspection
                  categories.
                </p>

              </div>

            </div>

            {defectTypeData.length ===
            0 ? (

              <EmptyState />

            ) : (

              <div className="defect-type-list">

                {defectTypeData.map(
                  (
                    item,
                    index
                  ) => {

                    const width =
                      (
                        item.count /
                        maxDefectType
                      ) * 100;

                    return (
                      <div
                        className="defect-type-row"
                        key={
                          `${item.label}-${index}`
                        }
                      >

                        <div className="defect-type-header">

                          <span>
                            {item.label}
                          </span>

                          <strong>
                            {item.count}
                          </strong>

                        </div>

                        <div className="defect-type-track">

                          <div
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

          {/* SEVERITY */}

          <div className="weekly-panel">

            <div className="weekly-panel-header">

              <div>

                <span>
                  RISK PROFILE
                </span>

                <h2>
                  Severity Distribution
                </h2>

                <p>
                  Current severity distribution
                  across inspection records.
                </p>

              </div>

            </div>

            <div className="severity-analysis">

              {severityData.map(
                (item) => {

                  const percentage =
                    totalInspections >
                    0
                      ? (
                          (item.count /
                            totalInspections) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (
                    <div
                      className={`severity-analysis-row ${item.className}`}
                      key={
                        item.label
                      }
                    >

                      <div className="severity-name">

                        <span></span>

                        <strong>
                          {item.label}
                        </strong>

                      </div>

                      <div className="severity-track">

                        <div
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>

                      <div className="severity-number">

                        <strong>
                          {item.count}
                        </strong>

                        <span>
                          {percentage}%
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* ====================================================
            WEEKLY TABLE
        ==================================================== */}

        <section className="weekly-panel">

          <div className="weekly-panel-header">

            <div>

              <span>
                WEEKLY SUMMARY
              </span>

              <h2>
                Detailed Weekly Performance
              </h2>

              <p>
                Every row uses the same Passed +
                Defective + Review classification.
              </p>

            </div>

          </div>

          {weeklyData.length ===
          0 ? (

            <EmptyState />

          ) : (

            <div className="weekly-table-wrapper">

              <table className="weekly-table">

                <thead>

                  <tr>

                    <th>
                      Week
                    </th>

                    <th>
                      Date Range
                    </th>

                    <th>
                      Inspections
                    </th>

                    <th>
                      Passed
                    </th>

                    <th>
                      Defective
                    </th>

                    <th>
                      Review
                    </th>

                    <th>
                      Pass Rate
                    </th>

                    <th>
                      Defect Rate
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {weeklyData.map(
                    (
                      week,
                      index
                    ) => (

                      <tr
                        key={
                          `${week.weekStart}-table-${index}`
                        }
                      >

                        <td>

                          <strong>
                            Week{" "}
                            {getWeekNumber(
                              week.weekStart
                            )}
                          </strong>

                        </td>

                        <td>
                          {formatWeekRange(
                            week.weekStart
                          )}
                        </td>

                        <td>

                          <span className="table-number blue">
                            {week.inspections}
                          </span>

                        </td>

                        <td>

                          <span className="table-number green">
                            {week.passed}
                          </span>

                        </td>

                        <td>

                          <span className="table-number red">
                            {week.defective}
                          </span>

                        </td>

                        <td>

                          <span className="table-number amber">
                            {week.review}
                          </span>

                        </td>

                        <td>

                          <span className="rate-pill pass">
                            {week.passRate}%
                          </span>

                        </td>

                        <td>

                          <span className="rate-pill defect">
                            {week.defectRate}%
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            INSIGHT
        ==================================================== */}

        <section className="insight-banner">

          <div className="insight-banner-icon">
            📊
          </div>

          <div>

            <span>
              PRODUCTION INSIGHT
            </span>

            <h3>
              Weekly analytics provide a
              production-level quality view.
            </h3>

            <p>
              {bestWeek
                ? `The strongest observed week is Week ${getWeekNumber(
                    bestWeek.weekStart
                  )} with a ${bestWeek.passRate}% pass rate.`
                : "Weekly performance insights will appear after inspection data is recorded."}
            </p>

          </div>

        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="weekly-footer">

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
            Factory Supervisor • Weekly Production Analytics
          </span>

        </footer>

      </main>

    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  note,
  type,
}) {
  return (
    <div className="weekly-summary-card">

      <div
        className={`summary-icon ${type}`}
      >
        {type === "blue" && "◉"}
        {type === "green" && "✓"}
        {type === "red" && "!"}
        {type === "amber" && "?"}
      </div>

      <span className="summary-label">
        {label}
      </span>

      <strong className="summary-value">
        {value}
      </strong>

      <small>
        {note}
      </small>

    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState() {
  return (
    <div className="weekly-empty-state">

      <div>
        —
      </div>

      <strong>
        No weekly data available
      </strong>

      <span>
        Inspection records with valid dates
        are required to calculate weekly analytics.
      </span>

    </div>
  );
}

export default SupervisorWeeklyAnalytics;