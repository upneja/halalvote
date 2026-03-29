"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
  }

  const inputBase =
    "input-field w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-600 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand mark */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{
              background: "linear-gradient(135deg, #D4A843, #B8922F)",
              boxShadow: "0 0 32px rgba(212, 168, 67, 0.3), 0 8px 16px rgba(0,0,0,0.4)",
            }}
          >
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair, serif)" }}>H</span>
          </div>
          <h1
            className="text-3xl font-bold heading-display"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            Welcome back
          </h1>
          <p className="text-neutral-500 text-sm">Log in to vote and join the discussion</p>
        </div>

        {/* Google button — visually distinct from email form */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm text-neutral-200 transition-all hover:-translate-y-px"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* Google G SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          <span className="px-3 text-xs text-neutral-600 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Email form */}
        <div
          className="auth-card rounded-2xl p-6 space-y-4"
        >
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              style={inputStyle}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputBase}
              style={inputStyle}
              required
              autoComplete="current-password"
            />
            {error && (
              <p className="text-red-400 text-xs px-1">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all mt-1"
              style={{
                background: "linear-gradient(135deg, #059669, #047857)",
                boxShadow: "0 0 16px rgba(5, 150, 105, 0.2)",
              }}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gold hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
