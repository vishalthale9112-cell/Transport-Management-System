import {
  BellRing,
  Building2,
  CheckCircle2,
  FileWarning,
  Languages,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  User,
  Volume2,
  Wrench,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getSettings,
  resetSettings,
  updateSettings,
} from "../api";

import "./Settings.css";

const DEFAULT_SETTINGS = {
  company_name: "TRANSPORT",
  owner_name: "",
  phone: "",
  email: "",
  address: "",
  currency: "INR",
  language: "en",
  ai_voice: "Charon",
  email_notifications: true,
  push_notifications: true,
  maintenance_alerts: true,
  document_alerts: true,
  theme: "light",
};

const VOICES = [
  "Charon",
  "Kore",
  "Fenrir",
  "Puck",
  "Aoede",
];

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-info">
        <div className="settings-small-icon">
          <Icon size={18} />
        </div>

        <div>
          <div className="settings-toggle-title">
            {title}
          </div>

          <div className="settings-toggle-description">
            {description}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={
          checked
            ? "settings-switch active"
            : "settings-switch"
        }
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}

export default function Settings() {
  const [form, setForm] =
    useState(DEFAULT_SETTINGS);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getSettings();

      setForm({
        ...DEFAULT_SETTINGS,
        ...data,
      });
    } catch (requestError) {
      console.error(
        "Settings load error:",
        requestError
      );

      setError(
        "Settings load झाल्या नाहीत."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // =====================================================
  // FIELD CHANGE
  // =====================================================

  const changeField = (
    fieldName,
    fieldValue
  ) => {
    setForm((current) => ({
      ...current,
      [fieldName]: fieldValue,
    }));

    setSuccess("");
    setError("");
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateSettings = () => {
    if (
      !form.company_name.trim()
    ) {
      return (
        "Company name आवश्यक आहे."
      );
    }

    if (
      form.email.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return (
        "Valid email address टाका."
      );
    }

    if (
      form.phone.trim()
      && !/^[0-9+\-\s]{7,20}$/.test(
        form.phone.trim()
      )
    ) {
      return (
        "Valid phone number टाका."
      );
    }

    return "";
  };

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const validationError =
      validateSettings();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        company_name:
          form.company_name.trim(),

        owner_name:
          form.owner_name.trim(),

        phone:
          form.phone.trim(),

        email:
          form.email.trim(),

        address:
          form.address.trim(),

        currency:
          form.currency,

        language:
          form.language,

        ai_voice:
          form.ai_voice,

        email_notifications:
          Boolean(
            form.email_notifications
          ),

        push_notifications:
          Boolean(
            form.push_notifications
          ),

        maintenance_alerts:
          Boolean(
            form.maintenance_alerts
          ),

        document_alerts:
          Boolean(
            form.document_alerts
          ),

        theme:
          form.theme || "light",
      };

      const savedSettings =
        await updateSettings(
          payload
        );

      setForm({
        ...DEFAULT_SETTINGS,
        ...savedSettings,
      });

      setSuccess(
        "Settings successfully saved."
      );
    } catch (requestError) {
      console.error(
        "Settings save error:",
        requestError
      );

      const detail =
        requestError?.response
          ?.data?.detail;

      setError(
        detail
          ? String(detail)
          : "Settings save झाल्या नाहीत."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // RESET SETTINGS
  // =====================================================

  const handleReset = async () => {
    const confirmed =
      window.confirm(
        "सर्व settings default करायच्या आहेत का?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setResetting(true);
      setSuccess("");
      setError("");

      const data =
        await resetSettings();

      setForm({
        ...DEFAULT_SETTINGS,
        ...data,
      });

      setSuccess(
        "Default settings restored."
      );
    } catch (requestError) {
      console.error(
        "Settings reset error:",
        requestError
      );

      setError(
        "Settings reset झाल्या नाहीत."
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <LoaderCircle
          size={28}
          className="settings-spinner"
        />

        <span>
          Loading settings...
        </span>
      </div>
    );
  }

  return (
    <div className="content settings-page">
      <div className="settings-header">
        <div>
          <div className="settings-kicker">
            TRANSPORT MANAGEMENT
          </div>

          <h1>Settings</h1>

          <p>
            Manage company details,
            regional preferences, AI voice
            and alerts.
          </p>
        </div>

        <div className="settings-header-actions">
          <button
            type="button"
            className="settings-reset-button"
            onClick={handleReset}
            disabled={
              resetting || saving
            }
          >
            {resetting ? (
              <LoaderCircle
                size={17}
                className="settings-spinner"
              />
            ) : (
              <RefreshCcw size={17} />
            )}

            Reset
          </button>

          <button
            type="submit"
            form="settings-form"
            className="btn-primary settings-save-button"
            disabled={
              saving || resetting
            }
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="settings-spinner"
              />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>
      </div>

      {error && (
        <div className="settings-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-message success">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <form
        id="settings-form"
        onSubmit={handleSave}
      >
        <div className="settings-grid">
          {/* COMPANY PROFILE */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-section-icon">
                <Building2 size={21} />
              </div>

              <div>
                <h2>Company Profile</h2>

                <p>
                  Transport company and owner
                  information.
                </p>
              </div>
            </div>

            <div className="settings-fields-grid">
              <label className="settings-field">
                <span>
                  Company Name
                </span>

                <div className="settings-input-wrap">
                  <Building2 size={17} />

                  <input
                    type="text"
                    value={
                      form.company_name
                    }
                    maxLength={100}
                    onChange={(event) =>
                      changeField(
                        "company_name",
                        event.target.value
                      )
                    }
                    placeholder="TRANSPORT"
                  />
                </div>
              </label>

              <label className="settings-field">
                <span>Owner Name</span>

                <div className="settings-input-wrap">
                  <User size={17} />

                  <input
                    type="text"
                    value={
                      form.owner_name
                    }
                    maxLength={100}
                    onChange={(event) =>
                      changeField(
                        "owner_name",
                        event.target.value
                      )
                    }
                    placeholder="Owner name"
                  />
                </div>
              </label>

              <label className="settings-field">
                <span>Phone Number</span>

                <div className="settings-input-wrap">
                  <Phone size={17} />

                  <input
                    type="tel"
                    value={form.phone}
                    maxLength={20}
                    onChange={(event) =>
                      changeField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </label>

              <label className="settings-field">
                <span>Email Address</span>

                <div className="settings-input-wrap">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={form.email}
                    maxLength={150}
                    onChange={(event) =>
                      changeField(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="transport@example.com"
                  />
                </div>
              </label>

              <label className="settings-field full-width">
                <span>Business Address</span>

                <div className="settings-input-wrap textarea-wrap">
                  <MapPin size={17} />

                  <textarea
                    value={form.address}
                    maxLength={500}
                    rows={4}
                    onChange={(event) =>
                      changeField(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="Enter complete business address"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* REGIONAL */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-section-icon blue">
                <Languages size={21} />
              </div>

              <div>
                <h2>
                  Regional Preferences
                </h2>

                <p>
                  Currency, language and
                  assistant voice.
                </p>
              </div>
            </div>

            <div className="settings-fields-grid">
              <label className="settings-field">
                <span>Currency</span>

                <select
                  value={form.currency}
                  onChange={(event) =>
                    changeField(
                      "currency",
                      event.target.value
                    )
                  }
                >
                  <option value="INR">
                    INR — Indian Rupee (₹)
                  </option>

                  <option value="USD">
                    USD — US Dollar ($)
                  </option>

                  <option value="EUR">
                    EUR — Euro (€)
                  </option>
                </select>
              </label>

              <label className="settings-field">
                <span>Language</span>

                <select
                  value={form.language}
                  onChange={(event) =>
                    changeField(
                      "language",
                      event.target.value
                    )
                  }
                >
                  <option value="en">
                    English
                  </option>

                  <option value="mr">
                    Marathi
                  </option>

                  <option value="hi">
                    Hindi
                  </option>
                </select>
              </label>

              <label className="settings-field full-width">
                <span>AI Assistant Voice</span>

                <div className="settings-input-wrap">
                  <Volume2 size={17} />

                  <select
                    value={form.ai_voice}
                    onChange={(event) =>
                      changeField(
                        "ai_voice",
                        event.target.value
                      )
                    }
                  >
                    {VOICES.map(
                      (voiceName) => (
                        <option
                          key={voiceName}
                          value={voiceName}
                        >
                          {voiceName}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </label>
            </div>
          </section>

          {/* NOTIFICATIONS */}

          <section className="settings-card settings-card-wide">
            <div className="settings-card-header">
              <div className="settings-section-icon amber">
                <BellRing size={21} />
              </div>

              <div>
                <h2>
                  Notifications and Alerts
                </h2>

                <p>
                  Select which operational
                  alerts should remain active.
                </p>
              </div>
            </div>

            <div className="settings-toggles-grid">
              <ToggleRow
                icon={Mail}
                title="Email Notifications"
                description="Receive important updates through email."
                checked={
                  form.email_notifications
                }
                onChange={(value) =>
                  changeField(
                    "email_notifications",
                    value
                  )
                }
              />

              <ToggleRow
                icon={BellRing}
                title="Dashboard Notifications"
                description="Show alerts inside the application."
                checked={
                  form.push_notifications
                }
                onChange={(value) =>
                  changeField(
                    "push_notifications",
                    value
                  )
                }
              />

              <ToggleRow
                icon={Wrench}
                title="Maintenance Alerts"
                description="Notify when vehicle service is due."
                checked={
                  form.maintenance_alerts
                }
                onChange={(value) =>
                  changeField(
                    "maintenance_alerts",
                    value
                  )
                }
              />

              <ToggleRow
                icon={FileWarning}
                title="Document Alerts"
                description="Notify before vehicle documents expire."
                checked={
                  form.document_alerts
                }
                onChange={(value) =>
                  changeField(
                    "document_alerts",
                    value
                  )
                }
              />
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}