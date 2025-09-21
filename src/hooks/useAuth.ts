import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // prevent state updates on unmounted component

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error getting auth session:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Cleanup
    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const redirectUrl =
    process.env.NODE_ENV === "production"
      ? "https://quiet-hours-scheduler-omega.vercel.app"
      : "http://localhost:5173";

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Sign-up error:", error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Sign-in error:", error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Clear user immediately
      return { error: null };
    } catch (error) {
      console.error("Sign-out error:", error);
      return { error };
    }
  };

  return { user, setUser, loading, signUp, signIn, signOut };
}
