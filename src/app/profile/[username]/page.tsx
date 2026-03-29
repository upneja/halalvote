import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Fetch vote history (public)
  const { data: votes } = await supabase
    .from("votes")
    .select("*, topics(title, slug)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const halalVotes = votes?.filter((v: any) => v.vote === "halal").length || 0;
  const haramVotes = votes?.filter((v: any) => v.vote === "haram").length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="mb-10">
        {/* Avatar placeholder */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.05))",
            border: "1px solid rgba(212,168,67,0.25)",
            color: "#D4A843",
          }}
        >
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold heading-display">
          {profile.display_name}
        </h1>
        <p className="text-neutral-400 mt-0.5">@{profile.username}</p>
        <p className="text-neutral-600 text-xs mt-2">
          Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        {/* Stats row */}
        {votes && votes.length > 0 && (
          <div className="flex gap-4 mt-5">
            <div
              className="px-4 py-2.5 rounded-xl text-center min-w-[80px]"
              style={{
                background: "rgba(5, 150, 105, 0.08)",
                border: "1px solid rgba(5, 150, 105, 0.15)",
              }}
            >
              <div className="text-lg font-bold text-emerald-400">{halalVotes}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Halal</div>
            </div>
            <div
              className="px-4 py-2.5 rounded-xl text-center min-w-[80px]"
              style={{
                background: "rgba(153, 27, 27, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              <div className="text-lg font-bold text-red-400">{haramVotes}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Haram</div>
            </div>
          </div>
        )}
      </div>

      {/* Vote history */}
      <div>
        <h2 className="text-lg font-semibold heading-section mb-4">
          Vote History
        </h2>
        <div className="space-y-2">
          {votes?.map((vote: any) => (
            <div
              key={vote.id}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Link
                href={`/topic/${vote.topics?.slug}`}
                className="font-medium text-sm text-neutral-200 hover:text-white transition-colors truncate mr-3"
              >
                {vote.topics?.title}
              </Link>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                style={{
                  background: vote.vote === "halal"
                    ? "rgba(5, 150, 105, 0.15)"
                    : "rgba(153, 27, 27, 0.2)",
                  color: vote.vote === "halal" ? "#34d399" : "#f87171",
                }}
              >
                {vote.vote === "halal" ? "Halal" : "Haram"}
              </span>
            </div>
          ))}
          {(!votes || votes.length === 0) && (
            <p className="text-neutral-500 text-sm py-4">No votes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
