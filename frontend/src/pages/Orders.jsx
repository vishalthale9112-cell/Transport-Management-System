import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getOrders, createOrder } from "../api";

const statusColors = {
  New: "status-active",
  Pending: "status-idle",
  "In Transit": "status-idle",
  Delivered: "status-active",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_code: "", customer_name: "", amount: 0 });

  const load = () => getOrders().then(setOrders).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.order_code || !form.customer_name) return;
    await createOrder({ ...form, amount: Number(form.amount) });
    setForm({ order_code: "", customer_name: "", amount: 0 });
    setShowForm(false);
    load();
  };

  return (
    <div className="content">
      <div className="card">
        <div className="card-title">
          Orders
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> New Order
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Order Code"
              value={form.order_code}
              onChange={(e) => setForm({ ...form, order_code: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              placeholder="Customer Name"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 700 }}>{o.order_code}</td>
                <td>{o.customer_name}</td>
                <td><span className={`status-pill ${statusColors[o.status] || ""}`}>{o.status}</span></td>
                <td>₹{o.amount.toLocaleString("en-IN")}</td>
                <td>{o.created_at || "—"}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}