"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: username.toLowerCase().trim(),
      display_name: displayName.trim(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Username already taken");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
    } else {
      router.push("/");
    }
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
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{
              background: "linear-gradient(135deg, #D4A843, #B8922F)",
              boxShadow: "0 0 32px rgba(212, 168, 67, 0.3), 0 8px 16px rgba(0,0,0,0.4)",
            }}
          >
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              H
            </span>
          </div>
          <h1
            className="text-3xl font-bold heading-display"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            Almost there
          </h1>
          <p className="text-neutral-500 text-sm">
            Choose your identity in the community
          </p>
        </div>

        <div className="auth-card rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. ahmad_k"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                }
                className={inputBase}
                style={inputStyle}
                required
                minLength={3}
                maxLength={30}
              />
              <p className="text-xs text-neutral-600 mt-1.5">
                Letters, numbers, and underscores only
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ahmad Khan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputBase}
                style={inputStyle}
                required
                maxLength={50}
              />
            </div>
            {error && <p className="text-red-400 text-xs px-1">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all mt-2"
              style={{
                background: "linear-gradient(135deg, #059669, #047857)",
                boxShadow: "0 0 16px rgba(5, 150, 105, 0.2)",
              }}
            >
              {loading ? "Setting up..." : "Get started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
