# HalalVote Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build HalalVote — a web app where Muslims vote Halal/Haram on topics, then discuss with comments and scholar citations.

**Architecture:** Next.js 15 App Router full-stack app with Supabase (Postgres + Auth). Claude API (Haiku) generates tags on topic submission. Tailwind CSS for styling. Deploy to Vercel.

**Tech Stack:** Next.js 15, Supabase, Claude API (Haiku), Tailwind CSS, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-18-halalvote-design.md`

---

## File Structure

```
halalvote/
├── .env.local                          # Supabase + Claude API keys
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql            # profiles table + RLS
│       ├── 002_topics.sql              # topics table + slug + RLS
│       ├── 003_votes.sql               # votes table + unique constraint + trigger + RLS
│       ├── 004_comments.sql            # comments table + RLS
│       ├── 005_tags.sql                # tags + topic_tags + trending view + RLS
│       └── 006_functions.sql           # get_comment_counts RPC function
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with Supabase provider
│   │   ├── page.tsx                    # Home feed (trending + new)
│   │   ├── topic/
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Topic detail + vote + comments
│   │   ├── submit/
│   │   │   └── page.tsx                # Submit new topic form
│   │   ├── tags/
│   │   │   └── page.tsx                # Browse all tags
│   │   ├── tag/
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Topics filtered by tag
│   │   ├── profile/
│   │   │   └── [username]/
│   │   │       └── page.tsx            # User profile + vote history
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx            # Signup page
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx            # Username/display name setup
│   │   │   └── callback/
│   │   │       └── route.ts            # OAuth callback handler
│   │   └── api/
│   │       ├── topics/
│   │       │   └── route.ts            # POST: create topic + AI tags
│   │       ├── votes/
│   │       │   └── route.ts            # POST: cast vote
│   │       └── comments/
│   │           └── route.ts            # POST: create comment
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client (cookies)
│   │   │   └── middleware.ts            # Auth middleware helper
│   │   ├── claude.ts                   # Claude API client for tag generation
│   │   ├── slugify.ts                  # Slug generation with collision handling
│   │   └── rate-limit.ts              # In-memory rate limiter
│   ├── components/
│   │   ├── nav.tsx                     # Top navigation bar
│   │   ├── topic-card.tsx              # Topic card for feed (vote buttons or results)
│   │   ├── vote-buttons.tsx            # Halal/Haram vote UI
│   │   ├── vote-results.tsx            # Percentage bar display
│   │   ├── comment-list.tsx            # Comments thread with position indicators
│   │   ├── comment-form.tsx            # Comment input + scholar citation
│   │   ├── tag-badge.tsx               # Tag pill/badge component
│   │   └── auth-guard.tsx              # Redirect to login/onboarding if needed
│   ├── middleware.ts                   # Next.js middleware (auth session refresh)
│   └── types/
│       └── database.ts                 # Supabase generated types
```

---

## Chunk 1: Project Scaffold + Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.gitignore`, `.env.local`

- [ ] **Step 1: Create Next.js app with TypeScript + Tailwind**

```bash
cd /Users/upneja/Projects/halalvote
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This scaffolds the full project.

- [ ] **Step 2: Install Supabase + Anthropic dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
```

- [ ] **Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

- [ ] **Step 4: Add `.env.local` to `.gitignore`**

Verify `.env.local` is already in `.gitignore` (create-next-app includes it by default).

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000`, default Next.js page loads.

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: initialize Next.js 15 project with TypeScript + Tailwind"
```

---

### Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create browser Supabase client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server Supabase client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware helper**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  const protectedRoutes = ["/submit", "/auth/onboarding"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users without profile to onboarding
  if (user && !request.nextUrl.pathname.startsWith("/auth/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile && !request.nextUrl.pathname.startsWith("/auth/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create Next.js middleware**

Create `src/middleware.ts`:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client setup with auth middleware"
```

---

### Task 3: Database Migrations

**Files:**
- Create: `supabase/migrations/001_profiles.sql`
- Create: `supabase/migrations/002_topics.sql`
- Create: `supabase/migrations/003_votes.sql`
- Create: `supabase/migrations/004_comments.sql`
- Create: `supabase/migrations/005_tags.sql`

These SQL files are run manually in Supabase SQL Editor (or via CLI if `supabase` CLI is installed). Each migration is idempotent.

- [ ] **Step 1: Create profiles migration**

Create `supabase/migrations/001_profiles.sql`:

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

- [ ] **Step 2: Create topics migration**

Create `supabase/migrations/002_topics.sql`:

```sql
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  halal_count INT DEFAULT 0 NOT NULL,
  haram_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);

-- RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON topics FOR INSERT WITH CHECK (auth.uid() = author_id);
```

- [ ] **Step 3: Create votes migration with trigger**

Create `supabase/migrations/003_votes.sql`:

```sql
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('halal', 'haram')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(topic_id, user_id)
);

CREATE INDEX idx_votes_topic_id ON votes(topic_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- Trigger to update denormalized counts on topics
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'halal' THEN
      UPDATE topics SET halal_count = halal_count + 1 WHERE id = NEW.topic_id;
    ELSE
      UPDATE topics SET haram_count = haram_count + 1 WHERE id = NEW.topic_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 4: Create comments migration**

Create `supabase/migrations/004_comments.sql`:

```sql
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('halal', 'haram')),
  scholar_citation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_comments_topic_id ON comments(topic_id, created_at);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 5: Create tags + trending view migration**

Create `supabase/migrations/005_tags.sql`:

```sql
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_tags (
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(topic_id, tag_id)
);

CREATE INDEX idx_topic_tags_tag_id ON topic_tags(tag_id);

-- Trending view
CREATE OR REPLACE VIEW trending_topics AS
SELECT t.*,
  COALESCE(
    (SELECT COUNT(*) FROM votes v WHERE v.topic_id = t.id AND v.created_at > NOW() - INTERVAL '24 hours') * 2, 0
  ) +
  COALESCE(
    (SELECT COUNT(*) FROM comments c WHERE c.topic_id = t.id AND c.created_at > NOW() - INTERVAL '24 hours') * 3, 0
  ) AS trend_score
FROM topics t
ORDER BY trend_score DESC, t.created_at DESC;

-- RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT USING (true);

CREATE POLICY "Service role can manage tags"
  ON tags FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Topic tags are viewable by everyone"
  ON topic_tags FOR SELECT USING (true);

CREATE POLICY "Service role can manage topic_tags"
  ON topic_tags FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 6: Create comment counts function migration**

Create `supabase/migrations/006_functions.sql`:

```sql
CREATE OR REPLACE FUNCTION get_comment_counts(topic_ids UUID[])
RETURNS TABLE(topic_id UUID, count BIGINT) AS $$
  SELECT c.topic_id, COUNT(*) as count
  FROM comments c
  WHERE c.topic_id = ANY(topic_ids)
  GROUP BY c.topic_id;
$$ LANGUAGE SQL;
```

- [ ] **Step 7: Run migrations in Supabase SQL Editor**

Go to your Supabase project → SQL Editor → run each file in order (001 through 006). Verify each completes without errors.

- [ ] **Step 8: Commit**

```bash
git add supabase/
git commit -m "feat: add database migrations for profiles, topics, votes, comments, tags"
```

---

## Chunk 2: Auth + Utility Libraries

### Task 4: Utility Libraries

**Files:**
- Create: `src/lib/slugify.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/claude.ts`
- Create: `src/types/database.ts`

- [ ] **Step 1: Create slugify utility**

Create `src/lib/slugify.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uniqueSlug(title: string): Promise<string> {
  const supabase = await createClient();
  const base = slugify(title);
  let slug = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix++;
  }
}
```

- [ ] **Step 2: Create rate limiter**

Create `src/lib/rate-limit.ts`:

```typescript
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 3600000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
```

- [ ] **Step 3: Create Claude API client**

Create `src/lib/claude.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateTags(
  title: string,
  description: string,
  existingTags: string[]
): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Given this topic, return 2-4 relevant tags as a JSON array of lowercase strings.

Prefer these existing tags when they fit: ${JSON.stringify(existingTags)}

Topic: ${title}
Description: ${description}

Return ONLY a JSON array of strings, nothing else. Example: ["finance", "crypto"]`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const tags = JSON.parse(text.trim());

    if (Array.isArray(tags) && tags.every((t) => typeof t === "string")) {
      return tags.slice(0, 4).map((t: string) => t.toLowerCase().trim());
    }
    return [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Create database types**

Create `src/types/database.ts`:

```typescript
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string;
  halal_count: number;
  haram_count: number;
  created_at: string;
}

export interface TopicWithTags extends Topic {
  tags: Tag[];
  author: Profile;
}

export interface Vote {
  id: string;
  topic_id: string;
  user_id: string;
  vote: "halal" | "haram";
  created_at: string;
}

export interface Comment {
  id: string;
  topic_id: string;
  user_id: string;
  body: string;
  position: "halal" | "haram";
  scholar_citation: string | null;
  created_at: string;
  author?: Profile;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface TrendingTopic extends Topic {
  trend_score: number;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/ src/types/
git commit -m "feat: add utility libraries (slugify, rate-limit, claude, types)"
```

---

### Task 5: Auth Pages

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/signup/page.tsx`
- Create: `src/app/auth/onboarding/page.tsx`
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create OAuth callback route**

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
```

- [ ] **Step 2: Create login page**

Create `src/app/auth/login/page.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Log in to HalalVote</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-neutral-950 text-neutral-400">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full p-3 rounded-lg border border-neutral-700 hover:bg-neutral-900 font-semibold"
        >
          Continue with Google
        </button>

        <p className="text-center text-neutral-400">
          Don&apos;t have an account?{" "}
          <a href="/auth/signup" className="text-emerald-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create signup page**

Create `src/app/auth/signup/page.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/auth/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/auth/onboarding");
    }
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/onboarding`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Join HalalVote</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
            required
            minLength={6}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-neutral-950 text-neutral-400">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full p-3 rounded-lg border border-neutral-700 hover:bg-neutral-900 font-semibold"
        >
          Continue with Google
        </button>

        <p className="text-center text-neutral-400">
          Already have an account?{" "}
          <a href="/auth/login" className="text-emerald-400 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create onboarding page**

Create `src/app/auth/onboarding/page.tsx`:

```tsx
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Welcome to HalalVote</h1>
        <p className="text-center text-neutral-400">Choose your username to get started</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Username</label>
            <input
              type="text"
              placeholder="e.g. ahmad_k"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Display Name</label>
            <input
              type="text"
              placeholder="e.g. Ahmad Khan"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
              required
              maxLength={50}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Let's go"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test auth flow manually**

1. Start dev server: `npm run dev`
2. Navigate to `/auth/signup` — create account
3. Should redirect to `/auth/onboarding`
4. Choose username — should redirect to `/`
5. Navigate to `/auth/login` — login with credentials

- [ ] **Step 6: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add auth pages (login, signup, onboarding, OAuth callback)"
```

---

## Chunk 3: API Routes + Core Components

### Task 6: API Routes

**Files:**
- Create: `src/app/api/topics/route.ts`
- Create: `src/app/api/votes/route.ts`
- Create: `src/app/api/comments/route.ts`

- [ ] **Step 1: Create topics API route**

Create `src/app/api/topics/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { generateTags } from "@/lib/claude";
import { uniqueSlug, slugify } from "@/lib/slugify";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`topics:${user.id}`, 5);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { title, description } = await request.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const slug = await uniqueSlug(title);

  // Create topic
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      author_id: user.id,
      title: title.trim(),
      slug,
      description: description.trim(),
    })
    .select()
    .single();

  if (topicError) {
    return NextResponse.json({ error: topicError.message }, { status: 500 });
  }

  // Generate and save tags (non-blocking for user — errors are swallowed)
  const { data: existingTags } = await supabase.from("tags").select("name");
  const tagNames = await generateTags(
    title,
    description,
    existingTags?.map((t) => t.name) || []
  );

  // Use service role client for tag insertion (RLS restricts to service_role)
  const serviceSupabase = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const tagName of tagNames) {
    const tagSlug = slugify(tagName);

    // Upsert tag
    let { data: tag } = await serviceSupabase
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .single();

    if (!tag) {
      const { data: newTag } = await serviceSupabase
        .from("tags")
        .insert({ name: tagName, slug: tagSlug })
        .select("id")
        .single();
      tag = newTag;
    }

    if (tag) {
      await serviceSupabase
        .from("topic_tags")
        .insert({ topic_id: topic.id, tag_id: tag.id })
        .select();
    }
  }

  return NextResponse.json({ topic });
}
```

- [ ] **Step 2: Create votes API route**

Create `src/app/api/votes/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic_id, vote } = await request.json();

  if (!topic_id || !["halal", "haram"].includes(vote)) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("votes")
    .insert({
      topic_id,
      user_id: user.id,
      vote,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vote: data });
}
```

- [ ] **Step 3: Create comments API route**

Create `src/app/api/comments/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`comments:${user.id}`, 20);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { topic_id, body, scholar_citation } = await request.json();

  if (!topic_id || !body?.trim()) {
    return NextResponse.json({ error: "Topic and body required" }, { status: 400 });
  }

  // Verify user has voted on this topic
  const { data: vote } = await supabase
    .from("votes")
    .select("vote")
    .eq("topic_id", topic_id)
    .eq("user_id", user.id)
    .single();

  if (!vote) {
    return NextResponse.json(
      { error: "Must vote before commenting" },
      { status: 403 }
    );
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      topic_id,
      user_id: user.id,
      body: body.trim(),
      position: vote.vote,
      scholar_citation: scholar_citation?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for topics, votes, and comments"
```

---

### Task 7: Core UI Components

**Files:**
- Create: `src/components/nav.tsx`
- Create: `src/components/tag-badge.tsx`
- Create: `src/components/vote-buttons.tsx`
- Create: `src/components/vote-results.tsx`
- Create: `src/components/topic-card.tsx`
- Create: `src/components/comment-form.tsx`
- Create: `src/components/comment-list.tsx`
- Create: `src/components/auth-guard.tsx`

Note: These are functional scaffolds. Visual polish will happen via the `@frontend-design` skill after core functionality works.

- [ ] **Step 1: Create nav component**

Create `src/components/nav.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";

export function Nav() {
  const [profile, setProfile] = useState<Profile | null>(null);
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
  }

  return (
    <nav className="border-b border-neutral-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          HalalVote
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/tags" className="text-neutral-400 hover:text-white text-sm">
            Tags
          </Link>
          {profile ? (
            <>
              <Link
                href="/submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
              >
                + Submit
              </Link>
              <Link
                href={`/profile/${profile.username}`}
                className="text-neutral-400 hover:text-white text-sm"
              >
                {profile.display_name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-neutral-500 hover:text-white text-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-900 text-sm"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create tag badge**

Create `src/components/tag-badge.tsx`:

```tsx
import Link from "next/link";
import type { Tag } from "@/types/database";

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700 transition-colors"
    >
      {tag.name}
    </Link>
  );
}
```

- [ ] **Step 3: Create vote buttons**

Create `src/components/vote-buttons.tsx`:

```tsx
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
        className="flex-1 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 font-bold text-white transition-colors"
      >
        Halal
      </button>
      <button
        onClick={() => handleVote("haram")}
        className="flex-1 py-3 rounded-lg bg-red-800 hover:bg-red-700 font-bold text-white transition-colors"
      >
        Haram
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create vote results**

Create `src/components/vote-results.tsx`:

```tsx
export function VoteResults({
  halalCount,
  haramCount,
  userVote,
}: {
  halalCount: number;
  haramCount: number;
  userVote?: "halal" | "haram";
}) {
  const total = halalCount + haramCount;
  const halalPercent = total > 0 ? Math.round((halalCount / total) * 100) : 50;
  const haramPercent = 100 - halalPercent;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-emerald-400">{halalPercent}% Halal</span>
        <span className="text-red-400">{haramPercent}% Haram</span>
      </div>
      <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${halalPercent}%` }}
        />
      </div>
      <p className="text-center text-xs text-neutral-500">
        {total} votes
        {userVote && ` · You voted ${userVote === "halal" ? "Halal" : "Haram"}`}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Create topic card**

Create `src/components/topic-card.tsx`:

```tsx
import Link from "next/link";
import { TagBadge } from "./tag-badge";
import { VoteButtons } from "./vote-buttons";
import { VoteResults } from "./vote-results";
import type { Tag } from "@/types/database";

interface TopicCardProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  halalCount: number;
  haramCount: number;
  tags: Tag[];
  userVote?: "halal" | "haram" | null;
  commentCount: number;
}

export function TopicCard({
  id,
  title,
  slug,
  description,
  halalCount,
  haramCount,
  tags,
  userVote,
  commentCount,
}: TopicCardProps) {
  return (
    <div className="border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link href={`/topic/${slug}`} className="hover:underline">
            <h3 className="text-lg font-semibold">{title}</h3>
          </Link>
          <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{description}</p>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-shrink-0">
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {userVote ? (
        <VoteResults
          halalCount={halalCount}
          haramCount={haramCount}
          userVote={userVote}
        />
      ) : (
        <VoteButtons topicId={id} topicSlug={slug} />
      )}

      <Link
        href={`/topic/${slug}`}
        className="block text-xs text-neutral-500 hover:text-neutral-300"
      >
        {commentCount} comment{commentCount !== 1 ? "s" : ""}
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Create comment form**

Create `src/components/comment-form.tsx`:

```tsx
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your reasoning..."
        className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none min-h-[100px] resize-y"
        required
      />
      <input
        type="text"
        value={citation}
        onChange={(e) => setCitation(e.target.value)}
        placeholder="Scholar citation (optional)"
        className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none text-sm"
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Create comment list**

Create `src/components/comment-list.tsx`:

```tsx
import type { Comment } from "@/types/database";

interface CommentWithAuthor extends Comment {
  profiles: { username: string; display_name: string };
}

export function CommentList({ comments }: { comments: CommentWithAuthor[] }) {
  if (comments.length === 0) {
    return <p className="text-neutral-500 text-sm">No comments yet. Be the first to share your reasoning.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={`border-l-2 ${
            comment.position === "halal"
              ? "border-emerald-500"
              : "border-red-500"
          } pl-4 py-2`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">
              @{comment.profiles.username}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                comment.position === "halal"
                  ? "bg-emerald-900 text-emerald-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              Voted {comment.position === "halal" ? "Halal" : "Haram"}
            </span>
          </div>
          <p className="text-sm text-neutral-200">{comment.body}</p>
          {comment.scholar_citation && (
            <p className="text-xs text-neutral-500 italic mt-1">
              📖 {comment.scholar_citation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Create auth guard**

Create `src/components/auth-guard.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      } else {
        setReady(true);
      }
    }
    check();
  }, [supabase, router]);

  if (!ready) return null;
  return <>{children}</>;
}
```

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add core UI components (nav, topic card, voting, comments)"
```

---

## Chunk 4: Pages + Root Layout

### Task 8: Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HalalVote — Is it Halal or Haram?",
  description: "Vote and discuss whether topics are Halal or Haram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-white min-h-screen`}>
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update root layout with nav and dark theme"
```

---

### Task 9: Home Feed Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build home feed**

Replace `src/app/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { TopicCard } from "@/components/topic-card";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch topics
  let topics;
  if (sort === "new") {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    topics = data;
  } else {
    const { data } = await supabase
      .from("trending_topics")
      .select("*")
      .limit(20);
    topics = data;
  }

  // Fetch user votes if logged in
  let userVotes: Record<string, "halal" | "haram"> = {};
  if (user && topics?.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("topic_id, vote")
      .eq("user_id", user.id)
      .in(
        "topic_id",
        topics.map((t) => t.id)
      );
    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.topic_id, v.vote as "halal" | "haram"])
      );
    }
  }

  // Fetch tags and comment counts for topics
  const topicIds = topics?.map((t) => t.id) || [];

  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("topic_id, tags(id, name, slug)")
    .in("topic_id", topicIds);

  const { data: commentCounts } = await supabase
    .rpc("get_comment_counts", { topic_ids: topicIds });

  // Build tag map
  const tagMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  topicTags?.forEach((tt: any) => {
    if (!tagMap[tt.topic_id]) tagMap[tt.topic_id] = [];
    if (tt.tags) tagMap[tt.topic_id].push(tt.tags);
  });

  // Build comment count map
  const commentMap: Record<string, number> = {};
  commentCounts?.forEach((cc: any) => {
    commentMap[cc.topic_id] = cc.count;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Topics</h1>
        <div className="flex gap-2">
          <Link
            href="/?sort=trending"
            className={`px-3 py-1.5 rounded-lg text-sm ${
              sort !== "new"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Trending
          </Link>
          <Link
            href="/?sort=new"
            className={`px-3 py-1.5 rounded-lg text-sm ${
              sort === "new"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            New
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {topics?.map((topic) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            slug={topic.slug}
            description={topic.description}
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            tags={tagMap[topic.id] || []}
            userVote={userVotes[topic.id] || null}
            commentCount={commentMap[topic.id] || 0}
          />
        ))}
        {(!topics || topics.length === 0) && (
          <p className="text-neutral-500 text-center py-12">
            No topics yet. Be the first to{" "}
            <Link href="/submit" className="text-emerald-400 hover:underline">
              submit one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
```

Note: The `get_comment_counts` RPC function needs to be created. Add this SQL to a new migration or run directly:

```sql
CREATE OR REPLACE FUNCTION get_comment_counts(topic_ids UUID[])
RETURNS TABLE(topic_id UUID, count BIGINT) AS $$
  SELECT c.topic_id, COUNT(*) as count
  FROM comments c
  WHERE c.topic_id = ANY(topic_ids)
  GROUP BY c.topic_id;
$$ LANGUAGE SQL;
```

- [ ] **Step 2: Run the comment counts function in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home feed page with trending/new sort"
```

---

### Task 10: Topic Detail Page

**Files:**
- Create: `src/app/topic/[slug]/page.tsx`

- [ ] **Step 1: Build topic detail page**

Create `src/app/topic/[slug]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { VoteButtons } from "@/components/vote-buttons";
import { VoteResults } from "@/components/vote-results";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { TagBadge } from "@/components/tag-badge";
import { notFound } from "next/navigation";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch topic
  const { data: topic } = await supabase
    .from("topics")
    .select("*, profiles(username, display_name)")
    .eq("slug", slug)
    .single();

  if (!topic) notFound();

  // Fetch tags
  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("tags(id, name, slug)")
    .eq("topic_id", topic.id);

  const tags = topicTags?.map((tt: any) => tt.tags).filter(Boolean) || [];

  // Check user vote
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVote: "halal" | "haram" | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("vote")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .single();
    if (vote) userVote = vote.vote as "halal" | "haram";
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username, display_name)")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{topic.title}</h1>
        <p className="text-neutral-400 mt-2">{topic.description}</p>
        <div className="flex items-center gap-3 mt-4">
          {tags.map((tag: any) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          <span className="text-xs text-neutral-500">
            by @{(topic as any).profiles?.username}
          </span>
        </div>
      </div>

      <div className="border border-neutral-800 rounded-xl p-6">
        {userVote ? (
          <VoteResults
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            userVote={userVote}
          />
        ) : (
          <VoteButtons topicId={topic.id} topicSlug={topic.slug} />
        )}
      </div>

      {userVote && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Discussion ({comments?.length || 0})
          </h2>
          <CommentForm topicId={topic.id} />
          <CommentList comments={comments || []} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/topic/
git commit -m "feat: add topic detail page with voting and comments"
```

---

### Task 11: Submit Topic Page

**Files:**
- Create: `src/app/submit/page.tsx`

- [ ] **Step 1: Build submit page**

Create `src/app/submit/page.tsx`:

```tsx
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit a Topic</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">
            Question
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Is _____ Halal?"
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
            required
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1">
            Context / Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context to help others understand the topic..."
            className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none min-h-[120px] resize-y"
            required
            maxLength={2000}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
        >
          {loading ? "Submitting... (generating tags)" : "Submit Topic"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/submit/
git commit -m "feat: add topic submission page"
```

---

### Task 12: Tags Pages

**Files:**
- Create: `src/app/tags/page.tsx`
- Create: `src/app/tag/[slug]/page.tsx`

- [ ] **Step 1: Build tags index page**

Create `src/app/tags/page.tsx`:

```tsx
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
      <h1 className="text-2xl font-bold mb-6">All Tags</h1>
      <div className="flex flex-wrap gap-3">
        {tags?.map((tag: any) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500 transition-colors"
          >
            <span className="font-semibold">{tag.name}</span>
            <span className="text-neutral-500 text-sm ml-2">
              {tag.topic_tags?.[0]?.count || 0}
            </span>
          </Link>
        ))}
        {(!tags || tags.length === 0) && (
          <p className="text-neutral-500">No tags yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build tag filter page**

Create `src/app/tag/[slug]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { TopicCard } from "@/components/topic-card";
import { notFound } from "next/navigation";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch tag
  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tag) notFound();

  // Fetch topics with this tag
  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("topics(*)")
    .eq("tag_id", tag.id);

  const topics = topicTags?.map((tt: any) => tt.topics).filter(Boolean) || [];

  // Fetch user votes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVotes: Record<string, "halal" | "haram"> = {};
  if (user && topics.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("topic_id, vote")
      .eq("user_id", user.id)
      .in(
        "topic_id",
        topics.map((t: any) => t.id)
      );
    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.topic_id, v.vote as "halal" | "haram"])
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">#{tag.name}</h1>
      <div className="space-y-4">
        {topics.map((topic: any) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            slug={topic.slug}
            description={topic.description}
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            tags={[tag]}
            userVote={userVotes[topic.id] || null}
            commentCount={0}
          />
        ))}
        {topics.length === 0 && (
          <p className="text-neutral-500 text-center py-12">
            No topics with this tag yet.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/tags/ src/app/tag/
git commit -m "feat: add tags index and tag filter pages"
```

---

### Task 13: Profile Page

**Files:**
- Create: `src/app/profile/[username]/page.tsx`

- [ ] **Step 1: Build profile page**

Create `src/app/profile/[username]/page.tsx`:

```tsx
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{profile.display_name}</h1>
        <p className="text-neutral-400">@{profile.username}</p>
        <p className="text-neutral-500 text-sm mt-1">
          Joined {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-4">Vote History</h2>
      <div className="space-y-3">
        {votes?.map((vote: any) => (
          <div
            key={vote.id}
            className="flex items-center justify-between border border-neutral-800 rounded-lg p-4"
          >
            <Link
              href={`/topic/${vote.topics?.slug}`}
              className="hover:underline font-medium"
            >
              {vote.topics?.title}
            </Link>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                vote.vote === "halal"
                  ? "bg-emerald-900 text-emerald-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              {vote.vote === "halal" ? "Halal" : "Haram"}
            </span>
          </div>
        ))}
        {(!votes || votes.length === 0) && (
          <p className="text-neutral-500">No votes yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/profile/
git commit -m "feat: add user profile page with vote history"
```

---

## Chunk 5: Final Verification + Design Polish

### Task 14: End-to-End Verification

- [ ] **Step 1: Start dev server and verify all routes**

```bash
npm run dev
```

Manually test each flow:
1. Visit `/` — should show empty feed with "submit one" link
2. Visit `/auth/signup` — create account
3. Complete `/auth/onboarding` — set username
4. Visit `/submit` — create a topic (verify AI tags generate)
5. Visit home feed — topic appears
6. Click the topic — vote Halal or Haram
7. Results bar appears, comment form unlocks
8. Post a comment with scholar citation
9. Visit `/tags` — verify AI-generated tags appear
10. Visit `/profile/[username]` — verify vote history
11. Log out, browse as anonymous — can see topics/results but not vote

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: fix issues found during end-to-end testing"
```

### Task 15: Design Polish (frontend-design skill)

- [ ] **Step 1: Invoke `@frontend-design` skill**

After all functionality works, run the frontend-design skill to upgrade the visual design. Reference the UX research inspiration gathered during brainstorming. Focus on:

- **Swipe-to-vote (Tinder-style)**: Primary interaction pattern. Swipe through topic cards. After swipe, reveal results + top comments from each side. Use `react-tinder-card` or similar.
- **Radial/donut vote visualization** instead of flat progress bars
- **Versus layout for comments** — two-column debate format
- **Glassmorphism cards** with gradient borders
- **Scholar citations as styled callout cards** with quotation marks
- **Emerald + gold accent palette** — cultural resonance
- **Subtle geometric Islamic patterns** at low opacity on backgrounds
- Mobile responsiveness
- Typography and spacing

This is a separate pass — get functionality working first, then polish.

- [ ] **Step 2: Commit design improvements**

```bash
git add -A
git commit -m "style: apply design polish via frontend-design skill"
```

---

## Known MVP Shortcuts (Fast-Follow Items)

These are spec requirements deferred to keep MVP scope tight:

- **Pagination**: Feed and profile pages `.limit(20)` without cursor-based pagination. Add "Load more" button + cursor logic as immediate follow-up.
- **Light mode**: Only dark mode implemented. Add theme toggle + light mode Tailwind classes as fast-follow.
- **Input sanitization**: Only `.trim()` applied. Add DOMPurify or similar for HTML stripping before first public launch.
- **Tag page comment counts**: Tag filter page shows `commentCount={0}`. Wire up `get_comment_counts` RPC on that page too.

---

## Verification Checklist

- [ ] All database tables created with RLS policies
- [ ] Auth flow works: signup → onboarding → login → logout
- [ ] Topics can be submitted with AI-generated tags
- [ ] Voting works: binary vote, unique constraint, results reveal after vote
- [ ] Comments work: must vote first, position inherited, scholar citations display
- [ ] Home feed shows trending and new topics
- [ ] Tag filtering works
- [ ] Profile shows public vote history
- [ ] Anonymous users can browse but not interact
- [ ] Mobile responsive
