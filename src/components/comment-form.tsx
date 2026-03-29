"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommentForm({ topicId }: { topicId: string }) {
  const [body, setBody] = useState("");
  const [citation, setCitation] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic_id: topicId,
        body,
        scholar_citation: citation || null,
      }),
    });

    setBody("");
    setCitation("");
    setLoading(false);
    router.refresh();
  }

  const inputBase =
    "input-field w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-600 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your reasoning..."
        className={`${inputBase} min-h-[100px] resize-y`}
        style={inputStyle}
        required
      />
      <input
        type="text"
        value={citation}
        onChange={(e) => setCitation(e.target.value)}
        placeholder="Scholar citation (optional) — e.g. Imam Al-Nawawi, Riyad al-Salihin"
        className={inputBase}
        style={inputStyle}
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all duration-200"
        style={{
          background: loading || !body.trim()
            ? "rgba(5, 150, 105, 0.3)"
            : "linear-gradient(135deg, #059669, #047857)",
          cursor: loading || !body.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}
