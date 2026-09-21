import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";


export default function ProtectedRoute({ children }) {
  const {
    configured,
    loading,
    session,
    workspace,
  } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Loading your transport workspace...</p>
      </div>
    );
  }

  if (!configured || !session || !workspace) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
