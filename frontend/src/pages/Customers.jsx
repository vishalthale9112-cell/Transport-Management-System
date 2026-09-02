import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CircleDollarSign,
  IndianRupee,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../api";


const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company_name: "",
  gst_number: "",
  address: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  status: "Active",
  total_orders: 0,
  total_trips: 0,
  total_revenue: 0,
  paid_amount: 0,
};


const STATUS_COLORS = {
  Active: {
    background: "#e9f9f4",
    color: "#118268",
  },
  Inactive: {
    background: "#f1f3f5",
    color: "#667482",
  },
  Blocked: {
    background: "#fff0ee",
    color: "#c43c32",
  },
};


export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] =
    useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);


  const loadCustomers = async () => {
    try {
      setLoading(true);

      const data = await getCustomers(
        search,
        statusFilter
      );

      setCustomers(data || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Customers load झाले नाहीत"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const timer = window.setTimeout(
      loadCustomers,
      300
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, statusFilter]);


  const summary = useMemo(() => {
    return customers.reduce(
      (totals, customer) => ({
        total: totals.total + 1,
        active:
          totals.active +
          (customer.status === "Active" ? 1 : 0),
        revenue:
          totals.revenue +
          Number(customer.total_revenue || 0),
        pending:
          totals.pending +
          Number(customer.pending_amount || 0),
      }),
      {
        total: 0,
        active: 0,
        revenue: 0,
        pending: 0,
      }
    );
  }, [customers]);


  const openCreateForm = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  };


  const openEditForm = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      company_name:
        customer.company_name || "",
      gst_number: customer.gst_number || "",
      address: customer.address || "",
      city: customer.city || "",
      state:
        customer.state || "Maharashtra",
      pincode: customer.pincode || "",
      status: customer.status || "Active",
      total_orders: Number(
        customer.total_orders || 0
      ),
      total_trips: Number(
        customer.total_trips || 0
      ),
      total_revenue: Number(
        customer.total_revenue || 0
      ),
      paid_amount: Number(
        customer.paid_amount || 0
      ),
    });

    setShowForm(true);
    setError("");
  };


  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
  };


  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Customer name आवश्यक आहे");
      return;
    }

    const payload = {
      ...form,
      total_orders: Number(
        form.total_orders || 0
      ),
      total_trips: Number(
        form.total_trips || 0
      ),
      total_revenue: Number(
        form.total_revenue || 0
      ),
      paid_amount: Number(
        form.paid_amount || 0
      ),
      pending_amount: Math.max(
        Number(form.total_revenue || 0) -
          Number(form.paid_amount || 0),
        0
      ),
    };

    if (
      payload.paid_amount >
      payload.total_revenue
    ) {
      setError(
        "Paid amount हा total revenue पेक्षा जास्त असू शकत नाही"
      );
      return;
    }

    try {
      setSaving(true);

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          payload
        );
      } else {
        await createCustomer(payload);
      }

      closeFormAfterSave();
      await loadCustomers();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Customer save झाला नाही"
      );
    } finally {
      setSaving(false);
    }
  };


  const closeFormAfterSave = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setError("");
  };


  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `${customer.name} हा customer delete करायचा आहे का?`
    );

    if (!confirmed) return;

    try {
      await deleteCustomer(customer.id);
      await loadCustomers();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Customer delete झाला नाही"
      );
    }
  };


  return (
    <div className="content">
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "var(--text-900)",
            }}
          >
            Customers Management
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "var(--text-500)",
            }}
          >
            Manage customer details, business and payments
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openCreateForm}
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <SummaryCard
          icon={<Users size={20} />}
          label="Total Customers"
          value={summary.total}
          color="#1769aa"
          background="#eaf4ff"
        />

        <SummaryCard
          icon={<UserRound size={20} />}
          label="Active Customers"
          value={summary.active}
          color="#118268"
          background="#e9f9f4"
        />

        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Total Revenue"
          value={formatCurrency(summary.revenue)}
          color="#6d49b8"
          background="#f2edff"
        />

        <SummaryCard
          icon={<Wallet size={20} />}
          label="Pending Amount"
          value={formatCurrency(summary.pending)}
          color="#c46b00"
          background="#fff5e5"
        />
      </div>


      <div
        className="card"
        style={{ marginBottom: 16 }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            className="search-box"
            style={{ flex: 1 }}
          >
            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, phone, company or city..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            style={selectStyle}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>


      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}


      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1020,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f7f9fb",
                }}
              >
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders / Trips</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    style={emptyStyle}
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={emptyStyle}
                  >
                    No customers found. Add your first customer.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onEdit={openEditForm}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {showForm && (
        <CustomerFormModal
          form={form}
          editing={Boolean(editingCustomer)}
          saving={saving}
          error={error}
          onChange={updateField}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}


function SummaryCard({
  icon,
  label,
  value,
  color,
  background,
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
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
          {label}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 19,
            fontWeight: 900,
            color: "var(--text-900)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}


function CustomerRow({
  customer,
  onEdit,
  onDelete,
}) {
  const badge =
    STATUS_COLORS[customer.status] ||
    STATUS_COLORS.Inactive;

  return (
    <tr
      style={{
        borderTop: "1px solid var(--border)",
      }}
    >
      <TableCell>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#e9f9f4",
              color: "var(--teal-600)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {customer.company_name ? (
              <Building2 size={18} />
            ) : (
              <UserRound size={18} />
            )}
          </div>

          <div>
            <div style={primaryText}>
              {customer.name}
            </div>

            <div style={secondaryText}>
              {customer.company_name ||
                "Individual Customer"}
            </div>

            {customer.gst_number && (
              <div style={smallText}>
                GST: {customer.gst_number}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <ContactLine
          icon={<Phone size={12} />}
          value={customer.phone || "—"}
        />

        <ContactLine
          icon={<Mail size={12} />}
          value={customer.email || "—"}
        />
      </TableCell>

      <TableCell>
        <ContactLine
          icon={<MapPin size={12} />}
          value={
            [customer.city, customer.state]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />

        <div style={smallText}>
          {customer.pincode || ""}
        </div>
      </TableCell>

      <TableCell>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 9px",
            borderRadius: 20,
            fontSize: 10.5,
            fontWeight: 800,
            ...badge,
          }}
        >
          ● {customer.status}
        </span>
      </TableCell>

      <TableCell>
        <div style={primaryText}>
          {customer.total_orders} Orders
        </div>
        <div style={secondaryText}>
          {customer.total_trips} Trips
        </div>
      </TableCell>

      <TableCell>
        <div style={moneyText}>
          {formatCurrency(
            customer.total_revenue
          )}
        </div>

        <div style={smallText}>
          Paid: {formatCurrency(
            customer.paid_amount
          )}
        </div>
      </TableCell>

      <TableCell>
        <div
          style={{
            ...moneyText,
            color:
              Number(customer.pending_amount) > 0
                ? "#c46b00"
                : "#118268",
          }}
        >
          {formatCurrency(
            customer.pending_amount
          )}
        </div>
      </TableCell>

      <TableCell align="right">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 7,
          }}
        >
          <IconButton
            title="Edit customer"
            onClick={() => onEdit(customer)}
          >
            <Pencil size={14} />
          </IconButton>

          <IconButton
            title="Delete customer"
            danger
            onClick={() => onDelete(customer)}
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </TableCell>
    </tr>
  );
}


function CustomerFormModal({
  form,
  editing,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  const pendingAmount = Math.max(
    Number(form.total_revenue || 0) -
      Number(form.paid_amount || 0),
    0
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {editing
                ? "Edit Customer"
                : "Add New Customer"}
            </div>

            <div style={secondaryText}>
              Customer and payment information
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={formBodyStyle}>
            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <FormSection title="Basic Information">
              <FormGrid>
                <FormField
                  label="Customer Name *"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter customer name"
                  required
                />

                <FormField
                  label="Mobile Number"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="9876543210"
                />

                <FormField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="customer@email.com"
                  type="email"
                />

                <SelectField
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  options={[
                    "Active",
                    "Inactive",
                    "Blocked",
                  ]}
                />
              </FormGrid>
            </FormSection>

            <FormSection title="Company Details">
              <FormGrid>
                <FormField
                  label="Company Name"
                  name="company_name"
                  value={form.company_name}
                  onChange={onChange}
                  placeholder="Business or company name"
                />

                <FormField
                  label="GST Number"
                  name="gst_number"
                  value={form.gst_number}
                  onChange={onChange}
                  placeholder="27ABCDE1234F1Z5"
                />
              </FormGrid>
            </FormSection>

            <FormSection title="Address">
              <FormField
                label="Full Address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="Street, area, landmark"
              />

              <FormGrid>
                <FormField
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  placeholder="City"
                />

                <FormField
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={onChange}
                  placeholder="State"
                />

                <FormField
                  label="Pincode"
                  name="pincode"
                  value={form.pincode}
                  onChange={onChange}
                  placeholder="431114"
                />
              </FormGrid>
            </FormSection>

            <FormSection title="Business & Payment">
              <FormGrid>
                <FormField
                  label="Total Orders"
                  name="total_orders"
                  value={form.total_orders}
                  onChange={onChange}
                  type="number"
                  min="0"
                />

                <FormField
                  label="Total Trips"
                  name="total_trips"
                  value={form.total_trips}
                  onChange={onChange}
                  type="number"
                  min="0"
                />

                <FormField
                  label="Total Revenue"
                  name="total_revenue"
                  value={form.total_revenue}
                  onChange={onChange}
                  type="number"
                  min="0"
                  step="0.01"
                />

                <FormField
                  label="Paid Amount"
                  name="paid_amount"
                  value={form.paid_amount}
                  onChange={onChange}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </FormGrid>

              <div
                style={{
                  marginTop: 10,
                  padding: 11,
                  borderRadius: 9,
                  background: "#fff5e5",
                  color: "#9a5500",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <CircleDollarSign size={16} />
                Pending Amount: {formatCurrency(
                  pendingAmount
                )}
              </div>
            </FormSection>
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={cancelButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              <Save size={15} />
              {saving
                ? "Saving..."
                : editing
                ? "Update Customer"
                : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 19 }}>
      <div
        style={{
          marginBottom: 10,
          fontSize: 11,
          fontWeight: 900,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: ".45px",
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}


function FormGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2, minmax(0, 1fr))",
        gap: 11,
      }}
    >
      {children}
    </div>
  );
}


function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...inputProps
}) {
  return (
    <label style={fieldLabelStyle}>
      <span>{label}</span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        style={inputStyle}
        {...inputProps}
      />
    </label>
  );
}


function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label style={fieldLabelStyle}>
      <span>{label}</span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}


function TableHead({
  children,
  align = "left",
}) {
  return (
    <th
      style={{
        padding: "13px 14px",
        textAlign: align,
        fontSize: 10.5,
        color: "var(--text-500)",
        textTransform: "uppercase",
        letterSpacing: ".35px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
  align = "left",
}) {
  return (
    <td
      style={{
        padding: "13px 14px",
        textAlign: align,
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}


function ContactLine({ icon, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginBottom: 4,
        fontSize: 11,
        color: "var(--text-500)",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {value}
    </div>
  );
}


function IconButton({
  children,
  title,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 31,
        height: 31,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: danger ? "#fff3f1" : "#ffffff",
        color: danger ? "#d64439" : "#475767",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}


function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}


const primaryText = {
  fontSize: 12,
  fontWeight: 800,
  color: "var(--text-900)",
};

const secondaryText = {
  marginTop: 2,
  fontSize: 10.5,
  color: "var(--text-500)",
};

const smallText = {
  marginTop: 3,
  fontSize: 9.5,
  color: "var(--text-300)",
};

const moneyText = {
  fontSize: 12,
  fontWeight: 850,
  color: "var(--text-900)",
  whiteSpace: "nowrap",
};

const selectStyle = {
  minWidth: 150,
  height: 39,
  padding: "0 12px",
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "#ffffff",
  color: "var(--text-900)",
  outline: "none",
};

const emptyStyle = {
  padding: 40,
  textAlign: "center",
  color: "var(--text-500)",
  fontSize: 12,
};

const errorStyle = {
  marginBottom: 14,
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid #ffd1cb",
  background: "#fff3f1",
  color: "#b42318",
  fontSize: 11.5,
  fontWeight: 650,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  padding: 20,
  background: "rgba(7, 26, 44, .62)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  width: "min(760px, 96vw)",
  maxHeight: "92vh",
  background: "#ffffff",
  borderRadius: 16,
  boxShadow: "0 28px 80px rgba(0,0,0,.3)",
  overflow: "hidden",
};

const modalHeaderStyle = {
  padding: "17px 20px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const formBodyStyle = {
  padding: 20,
  maxHeight: "calc(92vh - 142px)",
  overflowY: "auto",
};

const modalFooterStyle = {
  padding: "13px 20px",
  borderTop: "1px solid var(--border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 9,
  background: "#fafbfc",
};

const fieldLabelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 11,
  fontSize: 10.5,
  fontWeight: 750,
  color: "var(--text-500)",
};

const inputStyle = {
  width: "100%",
  height: 39,
  boxSizing: "border-box",
  padding: "0 11px",
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "#ffffff",
  color: "var(--text-900)",
  outline: "none",
  fontSize: 12,
};

const closeButtonStyle = {
  width: 34,
  height: 34,
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "#ffffff",
  color: "var(--text-500)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cancelButtonStyle = {
  height: 38,
  padding: "0 16px",
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "#ffffff",
  color: "var(--text-900)",
  cursor: "pointer",
  fontWeight: 750,
};
