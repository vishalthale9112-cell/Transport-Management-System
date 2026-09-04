import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Archive,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocuments,
  getDocumentsSummary,
  getDocumentViewUrl,
  getDrivers,
  getVehicles,
  uploadDocument,
} from "../api";


const DOCUMENT_TYPES = [
  "RC Book",
  "Insurance",
  "PUC",
  "Permit",
  "Fitness Certificate",
  "Driving License",
  "Other",
];


const EMPTY_FORM = {
  document_type: "RC Book",
  document_number: "",
  vehicle_id: "",
  driver_id: "",
  issuing_authority: "",
  issue_date: "",
  expiry_date: "",
  notes: "",
  file: null,
};


function formatDate(value) {
  if (!value) return "—";

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


function getExpiryText(documentItem) {
  if (
    documentItem.expiry_status ===
    "No Expiry"
  ) {
    return "No expiry date";
  }

  if (
    documentItem.expiry_status ===
    "Expired"
  ) {
    return `${Math.abs(
      documentItem.days_remaining || 0
    )} days overdue`;
  }

  if (documentItem.days_remaining === 0) {
    return "Expires today";
  }

  return `${documentItem.days_remaining} days left`;
}


export default function Documents() {
  const [documents, setDocuments] =
    useState([]);

  const [summary, setSummary] = useState({
    total_documents: 0,
    valid_documents: 0,
    expiring_soon: 0,
    expired_documents: 0,
    no_expiry: 0,
  });

  const [vehicles, setVehicles] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] =
    useState("");
  const [expiryStatus, setExpiryStatus] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");


  const loadDocuments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getDocuments({
          search,
          documentType,
          expiryStatus,
        });

        setDocuments(result);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Documents load झाले नाहीत"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, documentType, expiryStatus]
  );


  const loadSummary = useCallback(
    async () => {
      try {
        const result =
          await getDocumentsSummary();

        setSummary(result);
      } catch (err) {
        console.error(err);
      }
    },
    []
  );


  const loadAssignments = useCallback(
    async () => {
      try {
        const [vehicleData, driverData] =
          await Promise.all([
            getVehicles(),
            getDrivers(),
          ]);

        setVehicles(vehicleData);
        setDrivers(driverData);
      } catch (err) {
        console.error(err);
      }
    },
    []
  );


  useEffect(() => {
    loadAssignments();
    loadSummary();
  }, [loadAssignments, loadSummary]);


  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadDocuments]);


  const refreshAll = async () => {
    await Promise.all([
      loadDocuments(),
      loadSummary(),
      loadAssignments(),
    ]);
  };


  const openUploadForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  };


  const closeUploadForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(EMPTY_FORM);
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0] || null;

    if (
      selectedFile &&
      selectedFile.size >
        10 * 1024 * 1024
    ) {
      setError(
        "File size 10 MB पेक्षा कमी पाहिजे"
      );

      event.target.value = "";
      return;
    }

    setError("");

    setForm((current) => ({
      ...current,
      file: selectedFile,
    }));
  };


  const handleUpload = async (event) => {
    event.preventDefault();

    if (!form.document_type) {
      setError("Document type निवडा");
      return;
    }

    if (!form.file) {
      setError("PDF, JPG किंवा PNG file निवडा");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append(
        "document_type",
        form.document_type
      );

      formData.append(
        "document_number",
        form.document_number
      );

      formData.append(
        "issuing_authority",
        form.issuing_authority
      );

      formData.append("notes", form.notes);

      if (form.vehicle_id) {
        formData.append(
          "vehicle_id",
          form.vehicle_id
        );
      }

      if (form.driver_id) {
        formData.append(
          "driver_id",
          form.driver_id
        );
      }

      if (form.issue_date) {
        formData.append(
          "issue_date",
          form.issue_date
        );
      }

      if (form.expiry_date) {
        formData.append(
          "expiry_date",
          form.expiry_date
        );
      }

      formData.append("file", form.file);

      await uploadDocument(formData);

      setShowForm(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Document successfully upload झाला"
      );

      await Promise.all([
        loadDocuments(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Document upload झाला नाही"
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (
    documentItem
  ) => {
    const confirmed = window.confirm(
      `${documentItem.document_type} delete करायचा आहे का?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(documentItem.id);
      setError("");
      setSuccess("");

      await deleteDocument(documentItem.id);

      setSuccess(
        "Document successfully delete झाला"
      );

      await Promise.all([
        loadDocuments(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Document delete झाला नाही"
      );
    } finally {
      setDeletingId(null);
    }
  };


  const summaryCards = [
    {
      label: "Total Documents",
      value: summary.total_documents,
      icon: Archive,
      color: "#2563eb",
      background: "#eaf2ff",
    },
    {
      label: "Valid Documents",
      value: summary.valid_documents,
      icon: BadgeCheck,
      color: "#079a78",
      background: "#e5f8f2",
    },
    {
      label: "Expiring Soon",
      value: summary.expiring_soon,
      icon: CalendarClock,
      color: "#d97706",
      background: "#fff3df",
    },
    {
      label: "Expired",
      value: summary.expired_documents,
      icon: CircleAlert,
      color: "#dc2626",
      background: "#feecec",
    },
  ];


  return (
    <div className="documents-page">
      <style>{`
        .documents-page {
          padding: 24px;
          min-height: 100%;
          background: #f3f5f8;
          color: #0b1e33;
        }

        .documents-header,
        .documents-filter-card,
        .documents-table-card {
          background: #ffffff;
          border: 1px solid #e3e8ef;
          border-radius: 18px;
          box-shadow: 0 4px 18px rgba(15, 30, 51, 0.05);
        }

        .documents-header {
          padding: 26px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .documents-title-wrap {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .documents-title-icon {
          width: 52px;
          height: 52px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          color: #079a78;
          background: #e5f8f2;
        }

        .documents-header h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
        }

        .documents-header p {
          margin: 6px 0 0;
          color: #6b7a89;
          font-size: 14px;
        }

        .documents-header-actions {
          display: flex;
          gap: 10px;
        }

        .documents-primary-btn,
        .documents-icon-btn,
        .documents-action-btn {
          border: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .documents-primary-btn {
          min-height: 46px;
          padding: 0 19px;
          gap: 9px;
          border-radius: 12px;
          background: #0b1e33;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
        }

        .documents-primary-btn:hover {
          background: #122943;
          transform: translateY(-1px);
        }

        .documents-primary-btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .documents-icon-btn {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          color: #0b1e33;
          background: #ffffff;
          border: 1px solid #dfe5ec;
        }

        .documents-icon-btn:hover {
          background: #f4f7fa;
        }

        .documents-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin: 20px 0;
        }

        .documents-summary-card {
          min-height: 116px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e3e8ef;
          border-radius: 17px;
          box-shadow: 0 4px 16px rgba(15, 30, 51, 0.05);
        }

        .documents-summary-icon {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: grid;
          place-items: center;
          border-radius: 16px;
        }

        .documents-summary-label {
          color: #6b7a89;
          font-size: 13px;
          margin-bottom: 7px;
        }

        .documents-summary-value {
          font-size: 25px;
          font-weight: 800;
          line-height: 1;
        }

        .documents-filter-card {
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 220px 220px;
          gap: 14px;
          margin-bottom: 20px;
        }

        .documents-search {
          position: relative;
        }

        .documents-search svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #7a8998;
        }

        .documents-search input,
        .documents-filter-card select,
        .documents-field input,
        .documents-field select,
        .documents-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe5ec;
          background: #ffffff;
          color: #0b1e33;
          outline: none;
          font: inherit;
        }

        .documents-search input,
        .documents-filter-card select {
          height: 48px;
          border-radius: 12px;
        }

        .documents-search input {
          padding: 0 16px 0 46px;
        }

        .documents-filter-card select {
          padding: 0 14px;
        }

        .documents-search input:focus,
        .documents-filter-card select:focus,
        .documents-field input:focus,
        .documents-field select:focus,
        .documents-field textarea:focus {
          border-color: #1abc9c;
          box-shadow: 0 0 0 3px rgba(26, 188, 156, 0.1);
        }

        .documents-message {
          margin-bottom: 16px;
          padding: 12px 15px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 600;
        }

        .documents-message.error {
          color: #b42318;
          background: #fff0ee;
          border: 1px solid #ffc9c2;
        }

        .documents-message.success {
          color: #08775f;
          background: #e8f8f3;
          border: 1px solid #b8eadc;
        }

        .documents-table-card {
          overflow: hidden;
        }

        .documents-table-heading {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e6eaef;
        }

        .documents-table-heading h2 {
          margin: 0;
          font-size: 17px;
        }

        .documents-table-heading span {
          color: #6b7a89;
          font-size: 13px;
        }

        .documents-table-scroll {
          overflow-x: auto;
        }

        .documents-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .documents-table th {
          padding: 14px 18px;
          color: #68798a;
          background: #f8fafc;
          font-size: 12px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .documents-table td {
          padding: 17px 18px;
          border-top: 1px solid #edf0f4;
          vertical-align: middle;
          font-size: 13px;
        }

        .documents-table tbody tr:hover {
          background: #fafcfd;
        }

        .documents-name {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .documents-file-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: #2563eb;
          background: #eaf2ff;
        }

        .documents-main-text {
          color: #0b1e33;
          font-weight: 750;
        }

        .documents-sub-text {
          margin-top: 4px;
          color: #7a8998;
          font-size: 12px;
        }

        .documents-assignment {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-bottom: 5px;
        }

        .documents-assignment:last-child {
          margin-bottom: 0;
        }

        .documents-assignment svg {
          margin-top: 1px;
          color: #718191;
        }

        .documents-status {
          display: inline-flex;
          align-items: center;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
        }

        .documents-status.valid {
          color: #07866a;
          background: #e3f7f0;
        }

        .documents-status.expiring-soon {
          color: #c96b00;
          background: #fff2dc;
        }

        .documents-status.expired {
          color: #d92d20;
          background: #fee9e7;
        }

        .documents-status.no-expiry {
          color: #526579;
          background: #edf1f5;
        }

        .documents-actions {
          display: flex;
          gap: 7px;
        }

        .documents-action-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          color: #17324d;
          background: #ffffff;
          border: 1px solid #dfe5ec;
        }

        .documents-action-btn:hover {
          color: #079a78;
          border-color: #87d8c4;
          background: #effaf7;
        }

        .documents-action-btn.delete:hover {
          color: #dc2626;
          border-color: #f3aaa5;
          background: #fff1f0;
        }

        .documents-action-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .documents-empty {
          padding: 52px 20px !important;
          text-align: center;
          color: #6b7a89;
        }

        .documents-empty svg {
          display: block;
          margin: 0 auto 12px;
          color: #a3aebb;
        }

        .documents-loading {
          padding: 48px 20px;
          text-align: center;
          color: #6b7a89;
        }

        .documents-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(5, 21, 37, 0.58);
          backdrop-filter: blur(4px);
        }

        .documents-modal {
          width: min(760px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
        }

        .documents-modal-header {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-bottom: 1px solid #e6eaef;
        }

        .documents-modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .documents-modal-title h2 {
          margin: 0;
          font-size: 19px;
        }

        .documents-modal-title p {
          margin: 4px 0 0;
          color: #6b7a89;
          font-size: 12px;
        }

        .documents-form {
          padding: 24px;
        }

        .documents-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .documents-field.full {
          grid-column: 1 / -1;
        }

        .documents-field label {
          display: block;
          margin-bottom: 7px;
          color: #46596c;
          font-size: 12px;
          font-weight: 700;
        }

        .documents-field input,
        .documents-field select {
          height: 44px;
          padding: 0 12px;
          border-radius: 10px;
        }

        .documents-field textarea {
          min-height: 84px;
          padding: 11px 12px;
          border-radius: 10px;
          resize: vertical;
        }

        .documents-file-upload {
          padding: 21px;
          text-align: center;
          border: 1.5px dashed #b8c4cf;
          border-radius: 13px;
          background: #f9fbfc;
        }

        .documents-file-upload svg {
          color: #079a78;
          margin-bottom: 8px;
        }

        .documents-file-upload input {
          height: auto;
          margin-top: 12px;
          padding: 8px;
          background: #ffffff;
        }

        .documents-file-upload p {
          margin: 0;
          color: #526579;
          font-size: 13px;
        }

        .documents-file-upload small {
          display: block;
          margin-top: 5px;
          color: #8896a4;
        }

        .documents-selected-file {
          margin-top: 10px;
          color: #08775f;
          font-size: 12px;
          font-weight: 700;
        }

        .documents-modal-actions {
          margin-top: 22px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .documents-cancel-btn {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 11px;
          border: 1px solid #dfe5ec;
          color: #17324d;
          background: #ffffff;
          cursor: pointer;
          font-weight: 700;
        }

        @media (max-width: 1050px) {
          .documents-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .documents-page {
            padding: 14px;
          }

          .documents-header {
            padding: 20px;
            align-items: flex-start;
            flex-direction: column;
          }

          .documents-header-actions {
            width: 100%;
          }

          .documents-primary-btn {
            flex: 1;
          }

          .documents-filter-card {
            grid-template-columns: 1fr;
          }

          .documents-form-grid {
            grid-template-columns: 1fr;
          }

          .documents-field.full {
            grid-column: auto;
          }
        }

        @media (max-width: 520px) {
          .documents-summary-grid {
            grid-template-columns: 1fr;
          }

          .documents-header h1 {
            font-size: 23px;
          }
        }
      `}</style>

      <section className="documents-header">
        <div className="documents-title-wrap">
          <div className="documents-title-icon">
            <FileText size={26} />
          </div>

          <div>
            <h1>Documents Management</h1>
            <p>
              Vehicle and driver documents,
              expiry tracking and secure files
            </p>
          </div>
        </div>

        <div className="documents-header-actions">
          <button
            className="documents-icon-btn"
            type="button"
            title="Refresh"
            onClick={refreshAll}
          >
            <RefreshCw size={18} />
          </button>

          <button
            className="documents-primary-btn"
            type="button"
            onClick={openUploadForm}
          >
            <Plus size={18} />
            Upload Document
          </button>
        </div>
      </section>

      <section className="documents-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="documents-summary-card"
              key={card.label}
            >
              <div
                className="documents-summary-icon"
                style={{
                  color: card.color,
                  background: card.background,
                }}
              >
                <Icon size={25} />
              </div>

              <div>
                <div className="documents-summary-label">
                  {card.label}
                </div>

                <div className="documents-summary-value">
                  {card.value}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="documents-filter-card">
        <div className="documents-search">
          <Search size={19} />

          <input
            value={search}
            placeholder="Search document, number, vehicle or driver..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={documentType}
          onChange={(event) =>
            setDocumentType(event.target.value)
          }
        >
          <option value="">
            All Document Types
          </option>

          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={expiryStatus}
          onChange={(event) =>
            setExpiryStatus(event.target.value)
          }
        >
          <option value="">
            All Expiry Status
          </option>
          <option value="Valid">Valid</option>
          <option value="Expiring Soon">
            Expiring Soon
          </option>
          <option value="Expired">
            Expired
          </option>
          <option value="No Expiry">
            No Expiry
          </option>
        </select>
      </section>

      {error && (
        <div className="documents-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="documents-message success">
          {success}
        </div>
      )}

      <section className="documents-table-card">
        <div className="documents-table-heading">
          <h2>
            Document Records ({documents.length})
          </h2>

          <span>
            PDF, JPG and PNG • Maximum 10 MB
          </span>
        </div>

        {loading ? (
          <div className="documents-loading">
            Documents loading...
          </div>
        ) : (
          <div className="documents-table-scroll">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Assigned To</th>
                  <th>Authority</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {documents.map(
                  (documentItem) => (
                    <tr key={documentItem.id}>
                      <td>
                        <div className="documents-name">
                          <div className="documents-file-icon">
                            <FileText size={19} />
                          </div>

                          <div>
                            <div className="documents-main-text">
                              {
                                documentItem.document_type
                              }
                            </div>

                            <div className="documents-sub-text">
                              {documentItem.document_number ||
                                "No document number"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {documentItem.vehicle && (
                          <div className="documents-assignment">
                            <Truck size={14} />

                            <span>
                              {
                                documentItem.vehicle
                                  .registration_number
                              }
                            </span>
                          </div>
                        )}

                        {documentItem.driver && (
                          <div className="documents-assignment">
                            <UserRound size={14} />

                            <span>
                              {
                                documentItem.driver
                                  .name
                              }
                            </span>
                          </div>
                        )}

                        {!documentItem.vehicle &&
                          !documentItem.driver && (
                            <span className="documents-sub-text">
                              Not assigned
                            </span>
                          )}
                      </td>

                      <td>
                        {documentItem.issuing_authority ||
                          "—"}
                      </td>

                      <td>
                        {formatDate(
                          documentItem.issue_date
                        )}
                      </td>

                      <td>
                        <div className="documents-main-text">
                          {formatDate(
                            documentItem.expiry_date
                          )}
                        </div>

                        <div className="documents-sub-text">
                          {getExpiryText(
                            documentItem
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`documents-status ${documentItem.expiry_status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {
                            documentItem.expiry_status
                          }
                        </span>
                      </td>

                      <td>
                        <div className="documents-main-text">
                          {documentItem.file_name}
                        </div>

                        <div className="documents-sub-text">
                          {formatFileSize(
                            documentItem.file_size
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="documents-actions">
                          <button
                            className="documents-action-btn"
                            type="button"
                            title="View"
                            onClick={() =>
                              window.open(
                                getDocumentViewUrl(
                                  documentItem.file_url
                                ),
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <a
                            className="documents-action-btn"
                            title="Download"
                            href={getDocumentDownloadUrl(
                              documentItem.id
                            )}
                          >
                            <Download size={16} />
                          </a>

                          <button
                            className="documents-action-btn delete"
                            type="button"
                            title="Delete"
                            disabled={
                              deletingId ===
                              documentItem.id
                            }
                            onClick={() =>
                              handleDelete(
                                documentItem
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {documents.length === 0 && (
                  <tr>
                    <td
                      className="documents-empty"
                      colSpan={8}
                    >
                      <Archive size={34} />
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="documents-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUploadForm();
            }
          }}
        >
          <section className="documents-modal">
            <header className="documents-modal-header">
              <div className="documents-modal-title">
                <div className="documents-title-icon">
                  <Upload size={23} />
                </div>

                <div>
                  <h2>Upload New Document</h2>
                  <p>
                    Add vehicle or driver document
                  </p>
                </div>
              </div>

              <button
                className="documents-icon-btn"
                type="button"
                onClick={closeUploadForm}
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="documents-form"
              onSubmit={handleUpload}
            >
              <div className="documents-form-grid">
                <div className="documents-field">
                  <label>Document Type *</label>

                  <select
                    name="document_type"
                    value={form.document_type}
                    onChange={handleInputChange}
                    required
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="documents-field">
                  <label>Document Number</label>

                  <input
                    name="document_number"
                    value={form.document_number}
                    placeholder="Example: MH20RC1234"
                    onChange={handleInputChange}
                  />
                </div>

                <div className="documents-field">
                  <label>Vehicle</label>

                  <select
                    name="vehicle_id"
                    value={form.vehicle_id}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      Select vehicle
                    </option>

                    {vehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {
                          vehicle.registration_number
                        }{" "}
                        - {vehicle.vehicle_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="documents-field">
                  <label>Driver</label>

                  <select
                    name="driver_id"
                    value={form.driver_id}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      Select driver
                    </option>

                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.name}
                        {driver.phone
                          ? ` - ${driver.phone}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="documents-field full">
                  <label>Issuing Authority</label>

                  <input
                    name="issuing_authority"
                    value={
                      form.issuing_authority
                    }
                    placeholder="Example: RTO Jalna"
                    onChange={handleInputChange}
                  />
                </div>

                <div className="documents-field">
                  <label>Issue Date</label>

                  <input
                    name="issue_date"
                    type="date"
                    value={form.issue_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="documents-field">
                  <label>Expiry Date</label>

                  <input
                    name="expiry_date"
                    type="date"
                    value={form.expiry_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="documents-field full">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    placeholder="Optional document notes..."
                    onChange={handleInputChange}
                  />
                </div>

                <div className="documents-field full">
                  <label>Document File *</label>

                  <div className="documents-file-upload">
                    <Upload size={28} />

                    <p>
                      Select document file
                    </p>

                    <small>
                      PDF, JPG or PNG • Maximum 10 MB
                    </small>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />

                    {form.file && (
                      <div className="documents-selected-file">
                        {form.file.name} •{" "}
                        {formatFileSize(
                          form.file.size
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="documents-modal-actions">
                <button
                  className="documents-cancel-btn"
                  type="button"
                  onClick={closeUploadForm}
                >
                  Cancel
                </button>

                <button
                  className="documents-primary-btn"
                  type="submit"
                  disabled={saving}
                >
                  <Upload size={17} />

                  {saving
                    ? "Uploading..."
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}