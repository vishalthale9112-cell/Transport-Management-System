import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

import {
  getOrders,
  createOrder,
  deleteOrder,
  getCustomers,
} from "../api";


const statusColors = {
  New: "status-active",
  Pending: "status-idle",
  "In Transit": "status-idle",
  Delivered: "status-active",
  Cancelled: "status-maintenance",
};


const initialForm = {
  order_code: "",
  customer_id: "",
  status: "Pending",
  amount: "",
  created_at: new Date()
    .toISOString()
    .slice(0, 10),
};


export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        ordersData,
        customersData,
      ] = await Promise.all([
        getOrders(),
        getCustomers(),
      ]);

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : []
      );

      setCustomers(
        Array.isArray(customersData)
          ? customersData
          : []
      );
    } catch (err) {
      setError(
        err.message ||
        "Orders data load failed."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleAdd = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.order_code.trim()) {
      setError("Order code is required.");
      return;
    }

    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    const selectedCustomer =
      customers.find(
        (customer) =>
          Number(customer.id)
          === Number(form.customer_id)
      );

    if (!selectedCustomer) {
      setError("Selected customer not found.");
      return;
    }

    setSaving(true);

    try {
      await createOrder({
        order_code:
          form.order_code.trim(),

        customer_id:
          Number(form.customer_id),

        customer_name:
          selectedCustomer.name,

        status:
          form.status || "Pending",

        amount:
          Number(form.amount ||  0),

        created_at:
          form.created_at || null,
      });

      setForm(initialForm);
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Order could not be created."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (orderId) => {
    const confirmed = window.confirm(
      "Delete this order?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteOrder(orderId);
      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Order could not be deleted."
      );
    }
  };


  return (
    <div className="content">
      <div className="card">
        <div className="card-title">
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Orders
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-500)",
                marginTop: 4,
              }}
            >
              Create and manage customer orders
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
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
              onClick={() =>
                setShowForm((value) => !value)
              }
            >
              <Plus size={14} />

              {showForm
                ? "Close"
                : "New Order"}
            </button>
          </div>
        </div>


        {error && (
          <div
            style={{
              padding: "10px 12px",
              background: "#fff0ef",
              color: "#c0392b",
              border: "1px solid #ffd2ce",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 15,
            }}
          >
            {error}
          </div>
        )}


        {showForm && (
          <form
            onSubmit={handleAdd}
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(180px, 1fr))",
              gap: 12,
              padding: 15,
              marginBottom: 18,
              background: "var(--bg)",
              borderRadius: 12,
            }}
          >
            <FormField label="Order Code">
              <input
                name="order_code"
                placeholder="Example: ORD-1001"
                value={form.order_code}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </FormField>


            <FormField label="Select Customer">
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">
                  Choose customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                    {customer.company_name
                      ? ` - ${customer.company_name}`
                      : ""}
                  </option>
                ))}
              </select>
            </FormField>


            <FormField label="Status">
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="New">
                  New
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="In Transit">
                  In Transit
                </option>

                <option value="Delivered">
                  Delivered
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>
            </FormField>


            <FormField label="Amount">
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Order amount"
                value={form.amount}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </FormField>


            <FormField label="Order Date">
              <input
                name="created_at"
                type="date"
                value={form.created_at}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>


            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : "Save Order"}
              </button>
            </div>


            {customers.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  color: "#c0392b",
                  fontSize: 12,
                }}
              >
                Customer उपलब्ध नाही. आधी
                Customers page वर customer add करा.
              </div>
            )}
          </form>
        )}


        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStyle}
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStyle}
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {order.order_code}
                    </td>

                    <td>
                      {order.customer_name || "—"}
                    </td>

                    <td>
                      <span
                        className={
                          `status-pill ${
                            statusColors[
                              order.status
                            ] || ""
                          }`
                        }
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      ₹
                      {Number(
                        order.amount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      {order.created_at || "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() =>
                          handleDelete(order.id)
                        }
                        title="Delete order"
                      >
                        <Trash2 size={13} />
                      </button>
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


function FormField({
  label,
  children,
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-500)",
      }}
    >
      {label}
      {children}
    </label>
  );
}


const inputStyle = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "#fff",
  fontSize: 13,
  color: "var(--text-900)",
  outline: "none",
};


const emptyStyle = {
  textAlign: "center",
  color: "var(--text-500)",
  padding: 28,
};