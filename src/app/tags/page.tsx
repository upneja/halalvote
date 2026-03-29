import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TagsPage() {
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from("tags")
    .select("*, topic_tags(count)")
    .order("name");

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold heading-display"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
        >
          All Tags
        </h1>
        <p className="text-neutral-500 text-sm mt-2">
          Browse topics by category
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags?.map((tag: any) => {
          const count = tag.topic_tags?.[0]?.count || 0;
          return (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-px"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="font-semibold text-sm text-neutral-200">{tag.name}</span>
              {count > 0 && (
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(212, 168, 67, 0.12)",
                    color: "#D4A843",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
        {(!tags || tags.length === 0) && (
          <p className="text-neutral-500 text-sm">No tags yet.</p>
        )}
      </div>
    </div>
  );
}
