import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
  Truck,
  UsersRound,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import "./AuthPage.css";


function friendlyAuthError(error) {
  const detail = error?.response?.data?.detail;
  const rawMessage =
    (typeof detail === "string" ? detail : detail?.message) ||
    error?.message ||
    (typeof error === "string" ? error : "") ||
    "Sign in could not be completed. Please try again.";

  const message = rawMessage.toLowerCase();

  if (message.includes("email rate limit")) {
    return "Too many confirmation emails were requested. Please wait about one hour, then try once.";
  }

  if (message.includes("email not confirmed")) {
    return "Your email is not confirmed yet. Open the confirmation link in your inbox, then sign in.";
  }

  if (message.includes("invalid login credentials")) {
    return "The email or password is incorrect. Please check both and try again.";
  }

  return rawMessage;
}


function BrandPanel() {
  const features = [
    {
      icon: Truck,
      title: "Fleet control",
      text: "Vehicles, drivers and trips in one view",
    },
    {
      icon: BarChart3,
      title: "Business clarity",
      text: "Income, expenses and reports that stay current",
    },
    {
      icon: FileCheck2,
      title: "Document ready",
      text: "Important records organised and easy to find",
    },
  ];

  return (
    <section className="auth-showcase">
      <div className="auth-grid-pattern" aria-hidden="true" />
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <div className="auth-showcase-content">
        <div className="auth-brand">
          <span className="auth-brand-logo">
            <Truck size={27} strokeWidth={2.25} />
          </span>
          <span>
            <strong>TRANSPORT</strong>
            <small>Transport Operations Suite</small>
          </span>
        </div>

        <div className="auth-hero">
          <span className="auth-eyebrow">
            <ShieldCheck size={16} />
            Secure multi-company platform
          </span>
          <h1>
            Run every mile with
            <span> complete control.</span>
          </h1>
          <p>
            Manage your fleet, people, trips and finances from one
            intelligent workspace built for modern transport companies.
          </p>
        </div>

        <div className="auth-feature-list">
          {features.map(({ icon: Icon, title, text }) => (
            <div className="auth-feature" key={title}>
              <span><Icon size={20} /></span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-trust-row">
          <div className="auth-trust-icon">
            <Check size={17} />
          </div>
          <p>
            <strong>Your company. Your private data.</strong>
            <span>Every workspace is securely separated.</span>
          </p>
        </div>
      </div>
    </section>
  );
}


export default function AuthPage() {
  const {
    configured,
    session,
    workspace,
    needsWorkspace,
    loading,
    error: contextError,
    signIn,
    signUp,
    createWorkspace,
  } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <main className="auth-loading">
        <span className="auth-loading-logo"><Truck size={28} /></span>
        <LoaderCircle className="auth-spin" size={26} />
        <p>Opening your secure workspace...</p>
      </main>
    );
  }

  if (session && workspace) {
    return <Navigate to="/" replace />;
  }

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setPassword("");
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (needsWorkspace) {
        await createWorkspace(companyName.trim());
      } else if (mode === "register") {
        const result = await signUp(
          email.trim(),
          password,
          companyName.trim()
        );

        if (!result.session) {
          setConfirmationEmail(email.trim());
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const showCompany = mode === "register" || needsWorkspace;
  const currentError = error || contextError;

  return (
    <main className="auth-page">
      <BrandPanel />

      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <span><Truck size={22} /></span>
          <strong>THALE TRANSPORT</strong>
        </div>

        {confirmationEmail ? (
          <div className="auth-card auth-confirmation-card">
            <div className="auth-confirmation-icon">
              <MailCheck size={34} />
            </div>
            <span className="auth-card-kicker">Registration complete</span>
            <h2>Check your inbox</h2>
            <p className="auth-card-copy">
              We sent a secure confirmation link to
              <strong className="auth-confirmation-email">
                {confirmationEmail}
              </strong>
            </p>
            <div className="auth-confirmation-steps">
              <p><span>1</span>Open the email from Supabase</p>
              <p><span>2</span>Click the confirmation link</p>
              <p><span>3</span>Return here and sign in</p>
            </div>
            <p className="auth-email-hint">
              Also check Spam or Promotions. Avoid requesting the email
              repeatedly, as the mail service has a rate limit.
            </p>
            <button
              className="auth-secondary-button"
              type="button"
              onClick={() => {
                setConfirmationEmail("");
                changeMode("login");
              }}
            >
              Back to sign in
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <form className="auth-card" onSubmit={handleSubmit}>
            {!needsWorkspace && (
              <div className="auth-tabs" role="tablist" aria-label="Account access">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  className={mode === "login" ? "active" : ""}
                  onClick={() => changeMode("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  className={mode === "register" ? "active" : ""}
                  onClick={() => changeMode("register")}
                >
                  Create account
                </button>
              </div>
            )}

            <div className="auth-card-heading">
              <div className="auth-card-icon">
                {needsWorkspace ? (
                  <Building2 size={23} />
                ) : mode === "register" ? (
                  <UsersRound size={23} />
                ) : (
                  <LockKeyhole size={23} />
                )}
              </div>
              <span className="auth-card-kicker">
                {needsWorkspace
                  ? "One final step"
                  : mode === "register"
                    ? "Start your workspace"
                    : "Secure account access"}
              </span>
              <h2>
                {needsWorkspace
                  ? "Create your company workspace"
                  : mode === "register"
                    ? "Create your account"
                    : "Welcome back"}
              </h2>
              <p className="auth-card-copy">
                {needsWorkspace
                  ? "Name your workspace. Only approved members of your company will access its data."
                  : mode === "register"
                    ? "Set up a private transport workspace for your team."
                    : "Enter your details to open the transport dashboard."}
              </p>
            </div>

            {!configured && (
              <div className="auth-alert error" role="alert">
                Supabase is not configured. Add VITE_SUPABASE_URL and
                VITE_SUPABASE_ANON_KEY.
              </div>
            )}

            {!needsWorkspace && (
              <>
                <label className="auth-field" htmlFor="auth-email">
                  <span>Email address</span>
                  <div className="auth-input-wrap">
                    <Mail size={18} />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="name@company.com"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </label>

                <label className="auth-field" htmlFor="auth-password">
                  <span>Password</span>
                  <div className="auth-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      required
                      minLength={6}
                      autoComplete={
                        mode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder={
                        mode === "register"
                          ? "Minimum 6 characters"
                          : "Enter your password"
                      }
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </>
            )}

            {showCompany && (
              <label className="auth-field" htmlFor="auth-company">
                <span>Transport company name</span>
                <div className="auth-input-wrap">
                  <Building2 size={18} />
                  <input
                    id="auth-company"
                    type="text"
                    value={companyName}
                    required
                    minLength={2}
                    maxLength={120}
                    autoFocus={needsWorkspace}
                    autoComplete="organization"
                    placeholder="Example: THALE TRANSPORT"
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </div>
              </label>
            )}

            {currentError && (
              <div className="auth-alert error" role="alert">
                {friendlyAuthError(currentError)}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting || !configured}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="auth-spin" size={19} />
                  Please wait...
                </>
              ) : (
                <>
                  {needsWorkspace
                    ? "Create secure workspace"
                    : mode === "register"
                      ? "Create my account"
                      : "Sign in to dashboard"}
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            <div className="auth-card-footer">
              <ShieldCheck size={16} />
              <span>Encrypted sign-in · Company-isolated data</span>
            </div>
          </form>
        )}

        <p className="auth-copyright">
          © {new Date().getFullYear()} THALE TRANSPORT. All rights reserved.
        </p>
      </section>
    </main>
  );
}
