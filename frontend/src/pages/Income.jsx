import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  IndianRupee,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  User,
  WalletCards,
  X,
} from "lucide-react";

import {
  createIncome,
  deleteIncome,
  getCustomers,
  getIncome,
  getIncomeSummary,
  getOrders,
  getVehicles,
  updateIncome,
} from "../api";


function createInitialForm() {
  return {
    customer_id: "",
    order_id: "",
    vehicle_id: "",
    amount: "",
    payment_mode: "Cash",
    payment_status: "Received",
    transaction_reference: "",
    notes: "",
    payment_date: new Date().toISOString().slice(0, 10),
  };
}


const PAYMENT_STATUS_STYLE = {
  Received: {
    background: "#e7f8f2",
    color: "#0f8a69",
  },
  Partial: {
    background: "#fff5df",
    color: "#d97706",
  },
  Pending: {
    background: "#fff0ef",
    color: "#dc3c30",
  },
};


function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}


function errorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}


export default function Income() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    this_month_income: 0,
    pending_amount: 0,
    payment_count: 0,
  });

  const [form, setForm] = useState(createInitialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [incomeRows, summaryData, customerRows, orderRows, vehicleRows] =
        await Promise.all([
          getIncome(),
          getIncomeSummary(),
          getCustomers(),
          getOrders(),
          getVehicles(),
        ]);

      setRecords(Array.isArray(incomeRows) ? incomeRows : []);
      setSummary(summaryData || {});
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setVehicles(Array.isArray(vehicleRows) ? vehicleRows : []);
    } catch (loadError) {
      setError(errorMessage(loadError, "Income data load failed."));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const customerOrders = useMemo(() => {
    if (!form.customer_id) return [];

    return orders.filter(
      (order) =>
        Number(order.customer_id) === Number(form.customer_id)
    );
  }, [orders, form.customer_id]);


  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          Number(customer.id) === Number(form.customer_id)
      ) || null,
    [customers, form.customer_id]
  );


  const selectedVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) =>
          Number(vehicle.id) === Number(form.vehicle_id)
      ) || null,
    [vehicles, form.vehicle_id]
  );


  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      if (
        statusFilter &&
        record.payment_status !== statusFilter
      ) {
        return false;
      }

      if (!keyword) return true;

      const values = [
        record.customer?.name,
        record.order?.order_code,
        record.vehicle?.registration_number,
        record.transaction_reference,
        record.payment_mode,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );
    });
  }, [records, search, statusFilter]);


  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "customer_id") {
      setForm((current) => ({
        ...current,
        customer_id: value,
        order_id: "",
        vehicle_id: "",
      }));
      return;
    }

    if (name === "order_id") {
      const selectedOrder = orders.find(
        (order) => Number(order.id) === Number(value)
      );

      setForm((current) => ({
        ...current,
        order_id: value,
        vehicle_id: selectedOrder?.vehicle_id
          ? String(selectedOrder.vehicle_id)
          : current.vehicle_id,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const openCreateForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setError("");
    setShowForm(true);
  };


  const openEditForm = (record) => {
    setEditingId(record.id);
    setForm({
      customer_id: String(record.customer_id || ""),
      order_id: String(record.order_id || ""),
      vehicle_id: String(record.vehicle_id || ""),
      amount: String(record.amount || ""),
      payment_mode: record.payment_mode || "Cash",
      payment_status: record.payment_status || "Received",
      transaction_reference: record.transaction_reference || "",
      notes: record.notes || "",
      payment_date:
        record.payment_date ||
        new Date().toISOString().slice(0, 10),
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(createInitialForm());
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    if (Number(form.amount || 0) <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      order_id: form.order_id ? Number(form.order_id) : null,
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
      amount: Number(form.amount),
      payment_mode: form.payment_mode,
      payment_status: form.payment_status,
      transaction_reference: form.transaction_reference.trim(),
      notes: form.notes.trim(),
      payment_date: form.payment_date,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateIncome(editingId, payload);
      } else {
        await createIncome(payload);
      }

      closeForm();
      await loadData();
    } catch (saveError) {
      setError(errorMessage(saveError, "Payment could not be saved."));
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (record) => {
    if (!window.confirm("Delete this payment record?")) return;

    try {
      await deleteIncome(record.id);
      await loadData();
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Payment could not be deleted."));
    }
  };


  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              Income Management
            </div>
            <div style={subtitleStyle}>
              Manage customer payments and transport income
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-sm"
              onClick={loadData}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={openCreateForm}
            >
              <Plus size={14} /> Add Income
            </button>
          </div>
        </div>
      </div>


      <div style={summaryGridStyle}>
        <SummaryCard
          icon={<IndianRupee size={23} />}
          label="Total Income"
          value={money(summary.total_income)}
          color="#2563eb"
          background="#eaf2ff"
        />
        <SummaryCard
          icon={<Banknote size={23} />}
          label="This Month"
          value={money(summary.this_month_income)}
          color="#0f9272"
          background="#e7f8f2"
        />
        <SummaryCard
          icon={<Clock3 size={23} />}
          label="Customer Pending"
          value={money(summary.pending_amount)}
          color="#d97706"
          background="#fff4df"
        />
        <SummaryCard
          icon={<WalletCards size={23} />}
          label="Payment Records"
          value={summary.payment_count || 0}
          color="#7c3aed"
          background="#f2eaff"
        />
      </div>


      {error && <div style={errorStyle}>{error}</div>}


      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <span>{editingId ? "Edit Payment" : "Add Customer Payment"}</span>
            <button type="button" className="btn-sm" onClick={closeForm}>
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={formGridStyle}>
              <Field label="Customer *">
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} • Pending {money(customer.pending_amount)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Customer Order">
                <select
                  name="order_id"
                  value={form.order_id}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!form.customer_id}
                >
                  <option value="">Select order</option>
                  {customerOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_code} • {money(order.amount)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vehicle">
                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment Amount *">
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter received amount"
                  style={inputStyle}
                />
              </Field>

              <Field label="Payment Mode">
                <select
                  name="payment_mode"
                  value={form.payment_mode}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Card</option>
                </select>
              </Field>

              <Field label="Payment Status">
                <select
                  name="payment_status"
                  value={form.payment_status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option>Received</option>
                  <option>Partial</option>
                  <option>Pending</option>
                </select>
              </Field>

              <Field label="Payment Date">
                <input
                  name="payment_date"
                  type="date"
                  value={form.payment_date}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Transaction / Reference No.">
                <input
                  name="transaction_reference"
                  value={form.transaction_reference}
                  onChange={handleChange}
                  placeholder="UPI ID, UTR, cheque number..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Notes">
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional payment note"
                  style={inputStyle}
                />
              </Field>
            </div>

            {(selectedCustomer || selectedVehicle) && (
              <div style={selectionInfoStyle}>
                <div>
                  <User size={15} />
                  <span>
                    Customer pending: {money(selectedCustomer?.pending_amount)}
                  </span>
                </div>
                <div>
                  <Truck size={15} />
                  <span>
                    Vehicle: {selectedVehicle?.registration_number || "Not selected"}
                  </span>
                </div>
              </div>
            )}

            <div style={formActionStyle}>
              <button type="button" className="btn-sm" onClick={closeForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                <CheckCircle2 size={14} />
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Payment"
                  : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="card" style={{ marginBottom: 16 }}>
        <div style={filterGridStyle}>
          <div className="search-box" style={{ width: "100%" }}>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, order, vehicle or reference..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option>Received</option>
            <option>Partial</option>
            <option>Pending</option>
          </select>
        </div>
      </div>


      <div className="card">
        <div className="card-title">
          <span>Income Records ({filteredRecords.length})</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Vehicle</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={emptyStyle}>Loading income...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={emptyStyle}>No income records yet</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={tablePrimaryStyle}>
                        {record.payment_date}
                      </div>
                    </td>
                    <td>
                      <div style={tablePrimaryStyle}>
                        {record.customer?.name || "—"}
                      </div>
                      <div style={tableSecondaryStyle}>
                        {record.customer?.phone || ""}
                      </div>
                    </td>
                    <td>{record.order?.order_code || "—"}</td>
                    <td>
                      {record.vehicle?.registration_number || "—"}
                    </td>
                    <td>
                      <span style={modeStyle}>
                        <CreditCard size={12} /> {record.payment_mode}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          ...statusStyle,
                          ...(PAYMENT_STATUS_STYLE[record.payment_status] || {}),
                        }}
                      >
                        {record.payment_status}
                      </span>
                    </td>
                    <td>
                      <div style={tablePrimaryStyle}>
                        {record.transaction_reference || "—"}
                      </div>
                      {record.notes && (
                        <div style={tableSecondaryStyle}>{record.notes}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 850 }}>
                      {money(record.amount)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() => openEditForm(record)}
                          title="Edit payment"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() => handleDelete(record)}
                          title="Delete payment"
                        >
                          <Trash2 size={13} />
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


function SummaryCard({ icon, label, value, color, background }) {
  return (
    <div className="card" style={summaryCardStyle}>
      <div
        style={{
          ...summaryIconStyle,
          color,
          background,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={summaryLabelStyle}>{label}</div>
        <div style={summaryValueStyle}>{value}</div>
      </div>
    </div>
  );
}


function Field({ label, children }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      {children}
    </label>
  );
}


const subtitleStyle = {
  marginTop: 4,
  color: "var(--text-500)",
  fontSize: 12,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const summaryCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  padding: 18,
};

const summaryIconStyle = {
  width: 50,
  height: 50,
  borderRadius: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const summaryLabelStyle = {
  color: "var(--text-500)",
  fontSize: 11,
};

const summaryValueStyle = {
  marginTop: 3,
  color: "var(--text-900)",
  fontSize: 19,
  fontWeight: 900,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: "var(--text-500)",
  fontSize: 11,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "10px 11px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "#fff",
  color: "var(--text-900)",
  fontSize: 13,
  outline: "none",
};

const selectionInfoStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
  marginTop: 14,
  padding: 12,
  borderRadius: 9,
  background: "#edf8f5",
  color: "#0f766e",
  fontSize: 12,
  fontWeight: 700,
};

const formActionStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 16,
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 210px",
  gap: 12,
};

const statusStyle = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 800,
};

const modeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "var(--text-500)",
  fontSize: 11,
  fontWeight: 700,
};

const tablePrimaryStyle = {
  fontSize: 12,
  fontWeight: 750,
};

const tableSecondaryStyle = {
  marginTop: 2,
  color: "var(--text-500)",
  fontSize: 10,
};

const emptyStyle = {
  padding: 30,
  textAlign: "center",
  color: "var(--text-500)",
};

const errorStyle = {
  padding: "11px 13px",
  marginBottom: 16,
  border: "1px solid #fecaca",
  borderRadius: 9,
  background: "#fff1f2",
  color: "#be123c",
  fontSize: 12,
  fontWeight: 650,
};
