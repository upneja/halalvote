"use client";

import { useRouter } from "next/navigation";

export function VoteButtons({
  topicId,
  topicSlug,
}: {
  topicId: string;
  topicSlug: string;
}) {
  const router = useRouter();

  async function handleVote(vote: "halal" | "haram") {
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic_id: topicId, vote }),
    });

    if (res.status === 401) {
      router.push(`/auth/login?redirect=/topic/${topicSlug}`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleVote("halal")}
        className="btn-halal flex-1 py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 cursor-pointer"
      >
        Halal
      </button>
      <button
        onClick={() => handleVote("haram")}
        className="btn-haram flex-1 py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 cursor-pointer"
      >
        Haram
      </button>
    </div>
  );
}
