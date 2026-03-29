"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";

export function Nav() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    setProfile(null);
    setMenuOpen(false);
  }

  return (
    <nav className="nav-glass sticky top-0 z-50 px-4 sm:px-6 py-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={() => setMenuOpen(false)}
        >
          {/* Crescent-inspired brand mark */}
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #D4A843, #B8922F)",
              boxShadow: "0 0 12px rgba(212, 168, 67, 0.3)",
            }}
          >
            H
          </span>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            <span className="text-gold-gradient">Halal</span>
            <span className="text-white">Vote</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/tags"
            className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            Tags
          </Link>
          {profile ? (
            <>
              <Link
                href="/submit"
                className="ml-1 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #059669, #047857)",
                  boxShadow: "0 0 0 1px rgba(5, 150, 105, 0.3)",
                }}
              >
                + Submit
              </Link>
              <Link
                href={`/profile/${profile.username}`}
                className="ml-1 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                {profile.display_name}
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="ml-1 px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all text-neutral-200 hover:text-white hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden border-t py-3 space-y-1"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/tags"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            Tags
          </Link>
          {profile ? (
            <>
              <Link
                href="/submit"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 text-sm font-semibold transition-colors"
              >
                + Submit a Topic
              </Link>
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                {profile.display_name}
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
