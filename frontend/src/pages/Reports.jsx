import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Download,
  Fuel,
  IndianRupee,
  Percent,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";

import { getReportsDashboard } from "../api";


const currentMonth = new Date()
  .toISOString()
  .slice(0, 7);


export default function Reports() {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReportsDashboard(month);

      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Report load झाला नाही"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReport();
  }, [month]);


  const summary = report?.summary || {};

  const monthlyData = report?.monthly_data || [];

  const categories =
    report?.expense_categories || [];

  const vehicleReports =
    report?.vehicle_reports || [];


  const chartMaximum = useMemo(() => {
    const values = monthlyData.flatMap((item) => [
      Number(item.income || 0),
      Number(item.expenses || 0),
    ]);

    return Math.max(...values, 1);
  }, [monthlyData]);


  const downloadReport = () => {
    if (!report) {
      return;
    }

    const rows = [
      [
        "THALE TRANSPORT - FINANCIAL REPORT",
      ],
      ["Period", report.period],
      [],
      ["SUMMARY"],
      ["Total Income", summary.total_income || 0],
      [
        "Total Expenses",
        summary.total_expenses || 0,
      ],
      ["Net Profit", summary.net_profit || 0],
      [
        "Profit Margin",
        `${summary.profit_margin || 0}%`,
      ],
      ["Fuel Cost", summary.fuel_cost || 0],
      [
        "Maintenance Cost",
        summary.maintenance_cost || 0,
      ],
      [
        "Pending Expenses",
        summary.pending_expenses || 0,
      ],
      [],
      [
        "VEHICLE",
        "TYPE",
        "TRIPS",
        "INCOME",
        "EXPENSES",
        "PROFIT",
        "FUEL",
        "MAINTENANCE",
      ],
      ...vehicleReports.map((vehicle) => [
        vehicle.registration_number,
        vehicle.vehicle_type,
        vehicle.total_trips,
        vehicle.income,
        vehicle.expenses,
        vehicle.profit,
        vehicle.fuel_cost,
        vehicle.maintenance_cost,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");

            return `"${text.replaceAll(
              '"',
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `thale-transport-report-${
      month || "all-time"
    }.csv`;

    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="content">
      <div
        className="card"
        style={{
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            <BarChart3
              size={26}
              color="var(--teal-600)"
            />

            Business Reports
          </div>

          <div
            style={{
              color: "var(--text-500)",
              fontSize: 13,
              marginTop: 5,
            }}
          >
            Financial performance, expense analysis
            and vehicle-wise profitability
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <CalendarDays
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-500)",
                pointerEvents: "none",
              }}
            />

            <input
              type="month"
              value={month}
              onChange={(event) =>
                setMonth(event.target.value)
              }
              style={{
                ...controlStyle,
                width: 180,
                paddingLeft: 39,
              }}
            />
          </div>

          <button
            type="button"
            className="btn-sm"
            onClick={() => setMonth("")}
            title="Show all-time report"
          >
            All Time
          </button>

          <button
            type="button"
            className="btn-sm"
            onClick={loadReport}
            title="Refresh report"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            className="btn-sm"
            onClick={() => window.print()}
            title="Print report"
          >
            <Printer size={15} />
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={downloadReport}
          >
            <Download size={15} />
            Download Report
          </button>
        </div>
      </div>


      {error && (
        <div
          className="card"
          style={{
            marginBottom: 18,
            background: "#fff0f0",
            color: "#dc2626",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}


      {loading ? (
        <div
          className="card"
          style={{
            padding: 70,
            textAlign: "center",
            color: "var(--text-500)",
          }}
        >
          Loading professional report...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(190px, 1fr))",
              gap: 15,
              marginBottom: 15,
            }}
          >
            <SummaryCard
              title="Total Income"
              value={`₹${formatMoney(
                summary.total_income
              )}`}
              subtitle={`${
                summary.income_records || 0
              } payment records`}
              icon={<TrendingUp size={25} />}
              color="#2563eb"
              background="#eaf2ff"
            />

            <SummaryCard
              title="Total Expenses"
              value={`₹${formatMoney(
                summary.total_expenses
              )}`}
              subtitle={`${
                summary.expense_records || 0
              } expense records`}
              icon={<TrendingDown size={25} />}
              color="#dc2626"
              background="#fff0f0"
            />

            <SummaryCard
              title="Net Profit"
              value={`₹${formatMoney(
                summary.net_profit
              )}`}
              subtitle={
                Number(summary.net_profit || 0) >= 0
                  ? "Business is profitable"
                  : "Expense exceeds income"
              }
              icon={<Wallet size={25} />}
              color={
                Number(summary.net_profit || 0) >= 0
                  ? "#0f9f7f"
                  : "#dc2626"
              }
              background={
                Number(summary.net_profit || 0) >= 0
                  ? "#e7f8f3"
                  : "#fff0f0"
              }
            />

            <SummaryCard
              title="Profit Margin"
              value={`${Number(
                summary.profit_margin || 0
              ).toFixed(1)}%`}
              subtitle="Income after expenses"
              icon={<Percent size={25} />}
              color="#7c3aed"
              background="#f1eafe"
            />
          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(190px, 1fr))",
              gap: 15,
              marginBottom: 18,
            }}
          >
            <SmallStatCard
              title="Fuel Cost"
              value={`₹${formatMoney(
                summary.fuel_cost
              )}`}
              icon={<Fuel size={21} />}
              color="#2563eb"
            />

            <SmallStatCard
              title="Maintenance Cost"
              value={`₹${formatMoney(
                summary.maintenance_cost
              )}`}
              icon={<Wrench size={21} />}
              color="#d97706"
            />

            <SmallStatCard
              title="Pending Expenses"
              value={`₹${formatMoney(
                summary.pending_expenses
              )}`}
              icon={<CalendarDays size={21} />}
              color="#dc2626"
            />

            <SmallStatCard
              title="Fleet / Trips"
              value={`${
                summary.total_vehicles || 0
              } / ${summary.total_trips || 0}`}
              icon={<Truck size={21} />}
              color="#0f9f7f"
            />
          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(520px, 2fr) minmax(300px, 1fr)",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div className="card">
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  Income vs Expenses
                </div>

                <div
                  style={{
                    color: "var(--text-500)",
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  Last six months financial trend
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 18,
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Legend
                  color="#16a085"
                  label="Income"
                />

                <Legend
                  color="#ef4444"
                  label="Expenses"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 18,
                  height: 260,
                  borderBottom:
                    "1px solid var(--border)",
                  padding: "28px 12px 0",
                  marginTop: 5,
                }}
              >
                {monthlyData.map((item) => (
                  <div
                    key={item.month}
                    style={{
                      flex: 1,
                      minWidth: 58,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        flex: 1,
                      }}
                    >
                      <ChartBar
                        amount={item.income}
                        maximum={chartMaximum}
                        color="#16a085"
                        title={`Income ₹${formatMoney(
                          item.income
                        )}`}
                      />

                      <ChartBar
                        amount={item.expenses}
                        maximum={chartMaximum}
                        color="#ef4444"
                        title={`Expenses ₹${formatMoney(
                          item.expenses
                        )}`}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--text-500)",
                        padding: "10px 0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <div className="card">
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  marginBottom: 4,
                }}
              >
                Expense Breakdown
              </div>

              <div
                style={{
                  color: "var(--text-500)",
                  fontSize: 11,
                  marginBottom: 18,
                }}
              >
                Category-wise expense distribution
              </div>

              {categories.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-500)",
                    padding: 55,
                  }}
                >
                  No expense data
                </div>
              ) : (
                categories.map((category) => {
                  const percentage =
                    Number(
                      summary.total_expenses || 0
                    ) > 0
                      ? (Number(category.amount) /
                          Number(
                            summary.total_expenses
                          )) *
                        100
                      : 0;

                  return (
                    <div
                      key={category.category}
                      style={{
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          marginBottom: 7,
                        }}
                      >
                        <div>
                          <strong>
                            {category.category}
                          </strong>

                          <span
                            style={{
                              color:
                                "var(--text-500)",
                              marginLeft: 6,
                              fontSize: 10,
                            }}
                          >
                            ({category.count})
                          </span>
                        </div>

                        <strong>
                          ₹
                          {formatMoney(
                            category.amount
                          )}
                        </strong>
                      </div>

                      <div
                        style={{
                          height: 8,
                          background: "#edf1f5",
                          borderRadius: 20,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              percentage,
                              100
                            )}%`,
                            height: "100%",
                            borderRadius: 20,
                            background:
                              categoryColor(
                                category.category
                              ),
                          }}
                        />
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 9,
                          color: "var(--text-500)",
                          marginTop: 3,
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                  }}
                >
                  Vehicle Performance Report
                </div>

                <div
                  style={{
                    color: "var(--text-500)",
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  Vehicle-wise income, expense and
                  profitability
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-500)",
                }}
              >
                Period: {formatPeriod(report?.period)}
              </div>
            </div>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Trips</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Fuel</th>
                    <th>Maintenance</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>

                <tbody>
                  {vehicleReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: 35,
                          color: "var(--text-500)",
                        }}
                      >
                        No vehicle data available
                      </td>
                    </tr>
                  ) : (
                    vehicleReports.map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <td>
                          <div
                            style={{
                              fontWeight: 900,
                            }}
                          >
                            {
                              vehicle.registration_number
                            }
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color:
                                "var(--text-500)",
                              marginTop: 3,
                            }}
                          >
                            {vehicle.vehicle_type}
                          </div>
                        </td>

                        <td>
                          <StatusBadge
                            status={vehicle.status}
                          />
                        </td>

                        <td>
                          <strong>
                            {vehicle.total_trips}
                          </strong>
                        </td>

                        <td
                          style={{
                            color: "#0f8b70",
                            fontWeight: 800,
                          }}
                        >
                          ₹
                          {formatMoney(
                            vehicle.income
                          )}
                        </td>

                        <td
                          style={{
                            color: "#dc2626",
                            fontWeight: 800,
                          }}
                        >
                          ₹
                          {formatMoney(
                            vehicle.expenses
                          )}
                        </td>

                        <td>
                          ₹
                          {formatMoney(
                            vehicle.fuel_cost
                          )}
                        </td>

                        <td>
                          ₹
                          {formatMoney(
                            vehicle.maintenance_cost
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              color:
                                Number(
                                  vehicle.profit
                                ) >= 0
                                  ? "#0f8b70"
                                  : "#dc2626",
                              fontWeight: 900,
                            }}
                          >
                            ₹
                            {formatMoney(
                              vehicle.profit
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 15,
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          background,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            marginTop: 3,
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: 9.5,
            color: "var(--text-500)",
            marginTop: 3,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}


function SmallStatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingTop: 16,
        paddingBottom: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: `${color}15`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "var(--text-500)",
            fontSize: 10,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}


function ChartBar({
  amount,
  maximum,
  color,
  title,
}) {
  const height =
    Number(amount || 0) > 0
      ? Math.max(
          (Number(amount) / maximum) * 170,
          7
        )
      : 3;

  return (
    <div
      title={title}
      style={{
        height,
        width: "34%",
        maxWidth: 28,
        background: color,
        borderRadius: "6px 6px 0 0",
        opacity:
          Number(amount || 0) > 0 ? 1 : 0.2,
        transition: "height .3s ease",
        cursor: "pointer",
      }}
    />
  );
}


function Legend({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 3,
          background: color,
        }}
      />

      {label}
    </div>
  );
}


function StatusBadge({ status }) {
  const active = ["active", "running"].includes(
    String(status || "").toLowerCase()
  );

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "5px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 800,
        background: active
          ? "#e6f8f2"
          : "#fff3df",
        color: active ? "#0f8b70" : "#d97706",
      }}
    >
      {status || "Unknown"}
    </span>
  );
}


function categoryColor(category) {
  const colors = {
    Fuel: "#2563eb",
    Maintenance: "#d97706",
    Toll: "#0f9f7f",
    "Driver Salary": "#7c3aed",
    Office: "#64748b",
    Insurance: "#0891b2",
    Repair: "#dc2626",
    Other: "#475569",
  };

  return colors[category] || "#475569";
}


function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}


function formatPeriod(period) {
  if (!period || period === "All Time") {
    return "All Time";
  }

  const [year, month] = period.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}


const controlStyle = {
  height: 42,
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "#fff",
  color: "var(--text-900)",
  padding: "0 12px",
  outline: "none",
  fontSize: 12,
};