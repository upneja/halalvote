"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
    } else {
      router.push(`/topic/${data.topic.slug}`);
    }
  }

  const inputBase =
    "input-field w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-600 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold heading-display"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
        >
          Submit a Topic
        </h1>
        <p className="text-neutral-500 text-sm mt-2">
          Propose a question for the community to debate. Tags are generated automatically.
        </p>
      </div>

      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Is _____ Halal?"
              className={inputBase}
              style={inputStyle}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context to help others understand the topic and nuances..."
              className={`${inputBase} min-h-[140px] resize-y`}
              style={inputStyle}
              required
              maxLength={2000}
            />
            <p className="text-xs text-neutral-600 mt-1.5 text-right">
              {description.length}/2000
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-sm px-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
            style={{
              background: loading
                ? "rgba(5, 150, 105, 0.3)"
                : "linear-gradient(135deg, #059669, #047857)",
              boxShadow: loading ? "none" : "0 0 16px rgba(5, 150, 105, 0.2)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting... (generating tags)" : "Submit Topic"}
          </button>
        </form>
      </div>
    </div>
  );
}
