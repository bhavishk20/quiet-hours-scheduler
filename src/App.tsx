import React, { createContext, useContext } from "react";
import { useAuth } from "./hooks/useAuth";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

// Optional: Create a context to provide user globally
const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};

function App() {
  const auth = useAuth();
  const { user, loading } = auth;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {user ? <Dashboard /> : <Auth />}
    </AuthContext.Provider>
  );
}

export default App;
