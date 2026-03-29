# HalalVote

A community voting platform where Muslims debate whether topics are **Halal** or **Haram**. Users submit questions, cast votes, and argue their position in a structured discussion — all powered by real-time trending algorithms and AI-generated tagging.

## Features

- **Binary voting** — Cast Halal or Haram on any topic. One vote per user, enforced at the database level with a `UNIQUE(topic_id, user_id)` constraint and a PostgreSQL trigger that keeps denormalized vote counts in sync.
- **Trending feed** — A Postgres `VIEW` scores topics by recent activity: +2 per vote and +3 per comment in the last 24 hours, keeping the feed responsive to momentum rather than raw totals.
- **AI auto-tagging** — On topic submission, the Anthropic SDK (Claude Haiku) inspects the title and description and returns 2–4 relevant tags as JSON, preferring reuse of existing tags to keep the taxonomy clean.
- **Discussion gating** — Comments and discussion are unlocked only after a user has voted, preventing uninformed pile-ons.
- **Auth** — Supabase Auth (email/password) with SSR session management via `@supabase/ssr` and a Next.js Edge middleware refresh.
- **Row-Level Security** — Every table has RLS policies. Public reads are open; writes require `auth.uid()` to match the actor. Tag management is restricted to the service role.
- **Rate limiting** — In-memory sliding-window limiter caps topic submissions at 5 per user per hour.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | Anthropic SDK — Claude Haiku |
| Deploy | Vercel |

## Architecture Highlights

```
src/
  app/
    page.tsx          # Homepage — trending or newest feed, SSR
    topic/[slug]/     # Topic detail — vote gate, discussion
    submit/           # Topic submission form
    tags/             # Browse by tag
    profile/          # User profile
    api/
      topics/         # POST: create topic, call Claude for tags
      votes/          # POST: cast vote (auth-gated)
      comments/       # POST: add argument (vote-gated)
    auth/             # Login / signup flows
  components/
    topic-card.tsx    # Feed card with conditional vote/result display
    vote-buttons.tsx  # Client component — Halal / Haram CTA
    vote-results.tsx  # Donut chart breakdown, shown post-vote
    comment-form.tsx  # Argument submission
    comment-list.tsx  # Halal vs Haram column layout
    nav.tsx           # Glassmorphic navigation
  lib/
    claude.ts         # Anthropic SDK wrapper — generateTags()
    rate-limit.ts     # In-memory sliding-window limiter
    slugify.ts        # URL-safe slug generation + collision avoidance
    supabase/         # Client, server, and middleware helpers
supabase/
  migrations/         # 6 ordered SQL migrations (schema + RLS + triggers)
```

## Database Schema

```
profiles      — extended user data (username, display_name)
topics        — halal_count / haram_count denormalized for fast reads
votes         — UNIQUE(topic_id, user_id); trigger updates topic counts
comments      — linked to topic + profile; ordered by created_at
tags          — unique name + slug; managed by service role
topic_tags    — many-to-many join table
trending_topics — Postgres VIEW scoring by 24h vote + comment velocity
```

## Design System

Dark-first UI on `neutral-950`. Palette: **Emerald** (`#059669`) for Halal, **Red** for Haram, **Gold** (`#D4A843`) as accent. Background uses a faint Islamic 8-point star SVG pattern at 3% opacity. Typography: Playfair Display for headings (serif weight and authority), Inter for body. All interactive states — loading, error, empty, success — are explicitly handled.

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/upneja/halalvote.git
cd halalvote
npm install

# 2. Create a Supabase project at supabase.com
#    Run each file in supabase/migrations/ in order via the SQL editor

# 3. Configure environment
cp .env.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY

# 4. Run dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, never exposed to client) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude tag generation |
