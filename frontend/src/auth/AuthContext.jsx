import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api";
import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";


const AuthContext = createContext(null);


function isWorkspaceRequired(error) {
  return (
    error?.response?.status === 403 &&
    error?.response?.data?.detail?.code ===
      "WORKSPACE_REQUIRED"
  );
}


export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [needsWorkspace, setNeedsWorkspace] =
    useState(false);
  const [loading, setLoading] = useState(
    isSupabaseConfigured
  );
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(
    async (activeSession) => {
      if (!activeSession) {
        setWorkspace(null);
        setNeedsWorkspace(false);
        return null;
      }

      try {
        const response = await api.get("/auth/me");
        setWorkspace(response.data);
        setNeedsWorkspace(false);
        setError("");
        return response.data;
      } catch (requestError) {
        if (isWorkspaceRequired(requestError)) {
          setWorkspace(null);
          setNeedsWorkspace(true);
          return null;
        }

        setError(
          requestError?.response?.data?.detail ||
            "Your company workspace could not be loaded."
        );
        throw requestError;
      }
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let mounted = true;

    const initialize = async () => {
      const { data } =
        await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session);

      try {
        await loadWorkspace(data.session);
      } catch {
        // The error message is already stored for the login page.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) return;

          setSession(nextSession);

          window.setTimeout(async () => {
            try {
              await loadWorkspace(nextSession);
            } catch {
              // The error message is already stored.
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadWorkspace]);

  const signIn = useCallback(async (email, password) => {
    setError("");

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) throw signInError;

    setSession(data.session);
    await loadWorkspace(data.session);
    return data;
  }, [loadWorkspace]);

  const createWorkspace = useCallback(async (
    companyName
  ) => {
    const response = await api.post(
      "/auth/bootstrap",
      { company_name: companyName }
    );

    setWorkspace(response.data);
    setNeedsWorkspace(false);
    setError("");
    return response.data;
  }, []);

  const signUp = useCallback(async (
    email,
    password,
    companyName
  ) => {
    setError("");

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
          },
        },
      });

    if (signUpError) throw signUpError;

    setSession(data.session);

    if (data.session) {
      await createWorkspace(companyName);
    }

    return data;
  }, [createWorkspace]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setWorkspace(null);
    setNeedsWorkspace(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      workspace,
      needsWorkspace,
      loading,
      error,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      createWorkspace,
      reloadWorkspace: () =>
        loadWorkspace(session),
    }),
    [
      session,
      workspace,
      needsWorkspace,
      loading,
      error,
      loadWorkspace,
      signIn,
      signUp,
      signOut,
      createWorkspace,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
