import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Building2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import "./AuthPage.css";


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
  const [companyName, setCompanyName] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!loading && session && workspace) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (needsWorkspace) {
        await createWorkspace(companyName);
      } else if (mode === "register") {
        const result = await signUp(
          email.trim(),
          password,
          companyName.trim()
        );

        if (!result.session) {
          setMessage(
            "Account created. Check your email, confirm it, then log in."
          );
          setMode("login");
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "Login could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showCompany =
    mode === "register" || needsWorkspace;

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-mark">
          <Truck size={34} />
        </div>
        <p className="auth-kicker">THALE TRANSPORT</p>
        <h1>One platform. Your company data only.</h1>
        <p>
          Vehicles, drivers, trips, finance and documents
          stay securely separated for every transport company.
        </p>

        <div className="auth-security-note">
          <ShieldCheck size={22} />
          <span>
            Every request is verified before company data is loaded.
          </span>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-icon">
            {needsWorkspace ? (
              <Building2 size={24} />
            ) : (
              <LockKeyhole size={24} />
            )}
          </div>

          <h2>
            {needsWorkspace
              ? "Create your company workspace"
              : mode === "register"
                ? "Create account"
                : "Welcome back"}
          </h2>

          <p className="auth-card-copy">
            {needsWorkspace
              ? "This workspace will contain only your company's data."
              : "Sign in to open your transport dashboard."}
          </p>

          {!configured && (
            <div className="auth-alert error">
              Supabase is not configured. Add
              VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
            </div>
          )}

          {!needsWorkspace && (
            <>
              <label className="auth-field">
                <span>Email address</span>
                <div>
                  <Mail size={17} />
                  <input
                    type="email"
                    value={email}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div>
                  <LockKeyhole size={17} />
                  <input
                    type="password"
                    value={password}
                    required
                    minLength={6}
                    autoComplete={
                      mode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    placeholder="Minimum 6 characters"
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                  />
                </div>
              </label>
            </>
          )}

          {showCompany && (
            <label className="auth-field">
              <span>Transport company name</span>
              <div>
                <Building2 size={17} />
                <input
                  type="text"
                  value={companyName}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Example: THALE TRANSPORT"
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                />
              </div>
            </label>
          )}

          {(error || contextError) && (
            <div className="auth-alert error">
              {String(error || contextError)}
            </div>
          )}

          {message && (
            <div className="auth-alert success">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={
              submitting || !configured
            }
          >
            {submitting && (
              <LoaderCircle
                className="auth-spin"
                size={18}
              />
            )}
            {needsWorkspace
              ? "Create workspace"
              : mode === "register"
                ? "Register"
                : "Sign in"}
          </button>

          {!needsWorkspace && (
            <button
              className="auth-mode-button"
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );
                setError("");
                setMessage("");
              }}
            >
              {mode === "login"
                ? "New company? Create an account"
                : "Already registered? Sign in"}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
