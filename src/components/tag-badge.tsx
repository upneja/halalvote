import Link from "next/link";
import type { Tag } from "@/types/database";

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors"
      style={{
        background: "rgba(212, 168, 67, 0.1)",
        color: "#D4A843",
        border: "1px solid rgba(212, 168, 67, 0.2)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(212, 168, 67, 0.18)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212, 168, 67, 0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(212, 168, 67, 0.1)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212, 168, 67, 0.2)";
      }}
    >
      {tag.name}
    </Link>
  );
}
