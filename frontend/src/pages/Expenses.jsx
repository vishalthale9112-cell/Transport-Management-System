import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  IndianRupee,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";

import {
  createExpense,
  deleteExpense,
  getDrivers,
  getExpenses,
  getExpenseSummary,
  getVehicles,
  updateExpense,
} from "../api";


const categories = [
  "Fuel",
  "Maintenance",
  "Toll",
  "Driver Salary",
  "Office",
  "Insurance",
  "Repair",
  "Other",
];

const paymentModes = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
];

const emptyForm = () => ({
  category: "Fuel",
  vehicle_id: "",
  driver_id: "",
  vendor_name: "",
  amount: "",
  expense_date: new Date()
    .toISOString()
    .slice(0, 10),
  payment_mode: "Cash",
  reference_number: "",
  status: "Paid",
  notes: "",
});


export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    total_expenses: 0,
    this_month: 0,
    vehicle_expenses: 0,
    pending_amount: 0,
    total_records: 0,
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const vehicleMap = useMemo(
    () =>
      Object.fromEntries(
        vehicles.map((vehicle) => [
          Number(vehicle.id),
          vehicle.registration_number,
        ])
      ),
    [vehicles]
  );


  const driverMap = useMemo(
    () =>
      Object.fromEntries(
        drivers.map((driver) => [
          Number(driver.id),
          driver.name,
        ])
      ),
    [drivers]
  );


  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const [records, totals] = await Promise.all([
        getExpenses(
          categoryFilter,
          statusFilter
        ),
        getExpenseSummary(),
      ]);

      setExpenses(records || []);
      setSummary(totals || {});
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Expenses load झाले नाहीत"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    Promise.all([
      getVehicles(),
      getDrivers(),
    ])
      .then(([vehicleData, driverData]) => {
        setVehicles(vehicleData || []);
        setDrivers(driverData || []);
      })
      .catch(() => {
        setError(
          "Vehicle किंवा driver details load झाले नाहीत"
        );
      });
  }, []);


  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, statusFilter]);


  const filteredExpenses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return expenses;
    }

    return expenses.filter((expense) => {
      const vehicle =
        vehicleMap[Number(expense.vehicle_id)] || "";

      const driver =
        driverMap[Number(expense.driver_id)] || "";

      return [
        expense.category,
        expense.vendor_name,
        expense.payment_mode,
        expense.reference_number,
        expense.status,
        vehicle,
        driver,
      ].some((item) =>
        String(item || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [
    expenses,
    search,
    vehicleMap,
    driverMap,
  ]);


  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };


  const openEditForm = (expense) => {
    setEditingId(expense.id);

    setForm({
      category: expense.category || "Other",
      vehicle_id:
        expense.vehicle_id == null
          ? ""
          : String(expense.vehicle_id),
      driver_id:
        expense.driver_id == null
          ? ""
          : String(expense.driver_id),
      vendor_name: expense.vendor_name || "",
      amount: expense.amount || "",
      expense_date:
        expense.expense_date ||
        new Date().toISOString().slice(0, 10),
      payment_mode:
        expense.payment_mode || "Cash",
      reference_number:
        expense.reference_number || "",
      status: expense.status || "Paid",
      notes: expense.notes || "",
    });

    setError("");
    setShowForm(true);
  };


  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  };


  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.category || !form.amount) {
      setError(
        "Category आणि amount आवश्यक आहेत"
      );
      return;
    }

    const payload = {
      category: form.category,
      vehicle_id: form.vehicle_id
        ? Number(form.vehicle_id)
        : null,
      driver_id: form.driver_id
        ? Number(form.driver_id)
        : null,
      vendor_name: form.vendor_name.trim(),
      amount: Number(form.amount),
      expense_date: form.expense_date,
      payment_mode: form.payment_mode,
      reference_number:
        form.reference_number.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      closeForm();
      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Expense save झाला नाही"
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `${expense.category} चा ₹${formatMoney(
        expense.amount
      )} expense delete करायचा आहे का?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteExpense(expense.id);
      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Expense delete झाला नाही"
      );
    }
  };


  return (
    <div className="content">
      <div
        className="card"
        style={{
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            Expenses Management
          </div>

          <div
            style={{
              color: "var(--text-500)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Manage transport, vehicle and business
            expenses
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-sm"
            onClick={loadExpenses}
            title="Refresh expenses"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={openAddForm}
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <SummaryCard
          title="Total Expenses"
          value={`₹${formatMoney(
            summary.total_expenses
          )}`}
          icon={<IndianRupee size={25} />}
          color="#2563eb"
          background="#eaf2ff"
        />

        <SummaryCard
          title="This Month"
          value={`₹${formatMoney(
            summary.this_month
          )}`}
          icon={<CalendarDays size={24} />}
          color="#0f9f7f"
          background="#e7f8f3"
        />

        <SummaryCard
          title="Vehicle Expenses"
          value={`₹${formatMoney(
            summary.vehicle_expenses
          )}`}
          icon={<Truck size={25} />}
          color="#7c3aed"
          background="#f1eafe"
        />

        <SummaryCard
          title="Pending Amount"
          value={`₹${formatMoney(
            summary.pending_amount
          )}`}
          icon={<Clock3 size={25} />}
          color="#d97706"
          background="#fff3df"
        />
      </div>


      {showForm && (
        <div
          className="card"
          style={{
            marginBottom: 18,
          }}
        >
          <div
            className="card-title"
            style={{
              marginBottom: 18,
            }}
          >
            <span>
              {editingId
                ? "Edit Expense"
                : "Add New Expense"}
            </span>

            <button
              type="button"
              className="btn-sm"
              onClick={closeForm}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <FormField label="Expense Category *">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Amount *">
                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  style={inputStyle}
                  required
                />
              </FormField>

              <FormField label="Expense Date *">
                <input
                  type="date"
                  name="expense_date"
                  value={form.expense_date}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </FormField>

              <FormField label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">
                    Pending
                  </option>
                </select>
              </FormField>

              <FormField label="Vehicle">
                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    No vehicle
                  </option>

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.registration_number}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Driver">
                <select
                  name="driver_id"
                  value={form.driver_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    No driver
                  </option>

                  {drivers.map((driver) => (
                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Vendor / Payee">
                <input
                  name="vendor_name"
                  value={form.vendor_name}
                  onChange={handleChange}
                  placeholder="Vendor or payee name"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Payment Mode">
                <select
                  name="payment_mode"
                  value={form.payment_mode}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {paymentModes.map((mode) => (
                    <option
                      key={mode}
                      value={mode}
                    >
                      {mode}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Reference Number">
                <input
                  name="reference_number"
                  value={form.reference_number}
                  onChange={handleChange}
                  placeholder="Receipt / UPI / transaction ID"
                  style={inputStyle}
                />
              </FormField>

              <div
                style={{
                  gridColumn: "span 3",
                }}
              >
                <FormField label="Notes">
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Expense notes"
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                className="btn-sm"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                <Wallet size={15} />

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Expense"
                  : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      )}


      <div
        className="card"
        style={{
          marginBottom: 18,
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 1fr) 220px 220px",
          gap: 12,
        }}
      >
        <div
          style={{
            position: "relative",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-500)",
            }}
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search category, vehicle, driver or vendor..."
            style={{
              ...inputStyle,
              paddingLeft: 43,
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
          style={inputStyle}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          style={inputStyle}
        >
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>


      <div className="card">
        <div
          className="card-title"
          style={{
            marginBottom: 14,
          }}
        >
          Expense Records ({filteredExpenses.length})
        </div>

        {error && !showForm && (
          <div
            style={{
              padding: 12,
              marginBottom: 12,
              borderRadius: 9,
              background: "#fff0f0",
              color: "#dc2626",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vehicle / Driver</th>
                <th>Vendor</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={emptyStyle}
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={emptyStyle}
                  >
                    No expense records found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td
                      style={{
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(
                        expense.expense_date
                      )}
                    </td>

                    <td>
                      <CategoryBadge
                        category={expense.category}
                      />
                    </td>

                    <td>
                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {vehicleMap[
                          Number(expense.vehicle_id)
                        ] || "—"}
                      </div>

                      <div
                        style={{
                          color: "var(--text-500)",
                          fontSize: 11,
                          marginTop: 3,
                        }}
                      >
                        {driverMap[
                          Number(expense.driver_id)
                        ] || "No driver"}
                      </div>
                    </td>

                    <td>
                      {expense.vendor_name || "—"}
                    </td>

                    <td>{expense.payment_mode}</td>

                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "5px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          background:
                            expense.status === "Paid"
                              ? "#e6f8f2"
                              : "#fff3df",
                          color:
                            expense.status === "Paid"
                              ? "#0f8b70"
                              : "#d97706",
                        }}
                      >
                        {expense.status}
                      </span>
                    </td>

                    <td>
                      {expense.reference_number ||
                        "—"}
                    </td>

                    <td
                      style={{
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{formatMoney(expense.amount)}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                        }}
                      >
                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() =>
                            openEditForm(expense)
                          }
                          title="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() =>
                            handleDelete(expense)
                          }
                          title="Delete expense"
                          style={{
                            color: "#dc2626",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function SummaryCard({
  title,
  value,
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
        gap: 16,
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
            color: "var(--text-500)",
            fontSize: 12,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            marginTop: 4,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}


function FormField({ label, children }) {
  return (
    <label
      style={{
        display: "block",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-500)",
          fontWeight: 800,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      {children}
    </label>
  );
}


function CategoryBadge({ category }) {
  const colors = {
    Fuel: ["#020e1b", "#d1eb25"],
    Maintenance: ["#fff0e5", "#d97706"],
    Toll: ["#e7f8f3", "#0f8b70"],
    "Driver Salary": ["#121212dd", "#7fe6a6"],
    Office: ["#eef1f5", "#475569"],
    Insurance: ["#eaf9ff", "#0891b2"],
    Repair: ["#fff0f0", "#dc2626"],
    Other: ["#eef1f5", "#475569"],
  };

  const [background, color] =
    colors[category] || colors.Other;

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "5px 10px",
        borderRadius: 20,
        background,
        color,
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {category}
    </span>
  );
}


function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-IN");
}


const inputStyle = {
  width: "100%",
  minHeight: 44,
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--border)",
  background: "#fff",
  color: "var(--text-900)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};


const emptyStyle = {
  textAlign: "center",
  color: "var(--text-500)",
  padding: 35,
};