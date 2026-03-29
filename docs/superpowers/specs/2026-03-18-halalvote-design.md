# HalalVote — Design Spec

## Overview

HalalVote is a web app where Muslims vote on whether topics are Halal or Haram, then discuss their reasoning. Users submit topics, vote (binary Halal/Haram), and comment after voting. Results are shown as community percentage splits.

## Core User Stories

1. **As a user**, I can browse a feed of topics sorted by trending or newest
2. **As a user**, I can vote Halal or Haram on a topic (results hidden until I vote)
3. **As a user**, I can comment on topics I've voted on, with optional scholar citations
4. **As a user**, I can submit new topics for the community to vote on
5. **As a user**, I can filter topics by AI-generated tags
6. **As a user**, I can sign up / log in to participate

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Full-stack, SSR for SEO, fast to ship |
| Database | Supabase (Postgres) | Free tier, built-in auth, relational queries |
| Auth | Supabase Auth | Email + OAuth (Google), session management |
| AI | Claude API (Haiku) | Tag generation on topic submission — cheap, fast |
| Styling | Tailwind CSS | Rapid iteration, design system flexibility |
| Deployment | Vercel | Zero-config Next.js hosting, free tier |

## Data Model

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References Supabase auth.users |
| username | text (unique) | User-chosen handle |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### `topics`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| author_id | uuid (FK → profiles) | |
| title | text | |
| slug | text (unique) | Auto-generated from title via `slugify()`, with numeric suffix for collisions |
| description | text | |
| halal_count | int (default 0) | Denormalized for fast queries |
| haram_count | int (default 0) | Denormalized for fast queries |
| created_at | timestamptz | |

### `votes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| topic_id | uuid (FK → topics) | |
| user_id | uuid (FK → profiles) | |
| vote | text CHECK ('halal' or 'haram') | Enforced via CHECK constraint |
| created_at | timestamptz | |
| | UNIQUE(topic_id, user_id) | One vote per user per topic |

### `comments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| topic_id | uuid (FK → topics) | |
| user_id | uuid (FK → profiles) | |
| body | text | |
| position | text CHECK ('halal' or 'haram') | Inherited from user's vote, enforced via CHECK |
| scholar_citation | text (nullable) | Optional scholarly reference |
| created_at | timestamptz | |

### `tags`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text (unique) | Display name |
| slug | text (unique) | URL-friendly |

### `topic_tags`
| Column | Type | Notes |
|--------|------|-------|
| topic_id | uuid (FK → topics) | |
| tag_id | uuid (FK → tags) | |
| | PRIMARY KEY(topic_id, tag_id) | |

## Pages & Routes

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Home feed (trending + new topics) | No (browse), Yes (vote/comment) |
| `/topic/[slug]` | Topic detail + vote + comments | No (view), Yes (interact) |
| `/submit` | Submit new topic form | Yes |
| `/tags` | Browse all tags | No |
| `/tag/[slug]` | Topics filtered by tag | No |
| `/profile/[username]` | User profile + public vote history (paginated, 20 per page) | No |
| `/auth/login` | Login page | No |
| `/auth/signup` | Signup page | No |
| `/auth/onboarding` | Choose username + display name (one-time after signup) | Yes |

## Key UX Flows

### Voting Flow
1. User sees topic card in feed — **no results shown** (just Halal/Haram buttons)
2. User taps Halal or Haram
3. If not logged in → redirect to auth, return after login
4. Vote is recorded, `halal_count`/`haram_count` incremented via Postgres trigger (safer for consistency than application-level updates)
5. Results revealed as percentage bar + comment section unlocks

### Topic Submission Flow
1. User clicks "Submit" → form with title + description
2. On submit → API route calls Claude API (Haiku) to generate 2-4 tags
3. Tags matched to existing or created new
4. Topic + tags saved to DB
5. Redirected to new topic page

### Comment Flow
1. User must have voted to comment (enforced in UI + API)
2. Comment form includes body text + optional scholar citation field
3. Comments display with color-coded position indicator (green=Halal, red=Haram)
4. Scholar citations rendered distinctly below comment text

## Trending Algorithm (MVP)

Simple score based on recent activity, implemented as a Postgres view:

```sql
CREATE VIEW trending_topics AS
SELECT t.*,
  (COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '24 hours') * 2) +
  (COUNT(c.id) FILTER (WHERE c.created_at > NOW() - INTERVAL '24 hours') * 3) AS trend_score
FROM topics t
LEFT JOIN votes v ON v.topic_id = t.id
LEFT JOIN comments c ON c.topic_id = t.id
GROUP BY t.id
ORDER BY trend_score DESC;
```

Known limitation: No time decay — a topic with all activity 23h ago scores the same as one active right now. Acceptable for MVP; refine with exponential decay later.

**Pagination**: Cursor-based using `(trend_score, created_at, id)` for trending feed, `(created_at, id)` for newest feed. Avoids offset pagination issues at scale.

## AI Tag Generation

- **Model**: Claude Haiku (cheapest, fast enough for tag extraction)
- **Prompt**: Given topic title + description, return 2-4 relevant tags as JSON array
- **Tag matching**: Case-insensitive exact match against existing tag slugs (e.g., "Finance" → slug "finance" matches existing). Claude is instructed to prefer existing tags from the DB when possible. No fuzzy/Levenshtein needed for MVP.
- **Fallback**: If API fails, topic is saved without tags (can be tagged later)

## Auth Strategy

- **Supabase Auth** with email/password + Google OAuth
- **Onboarding flow**: After first sign-up, user is redirected to `/auth/onboarding` to choose a username and display name. Profile row is created at this step (not via DB trigger). Users without a profile are redirected to onboarding on any authenticated page.
- **Route**: Add `/auth/onboarding` to routes table (auth required, one-time)
- **Session**: Supabase handles JWT + refresh tokens

## Security Considerations

- Row Level Security (RLS) on all Supabase tables
- Users can only create/edit their own content
- Vote uniqueness enforced at DB level (unique constraint)
- Rate limiting via Next.js middleware: 5 topic submissions per hour, 20 comments per hour per user (simple in-memory counter for MVP, Redis later)
- Input sanitization on all user content

## Design Direction

Clean, modern aesthetic with distinctive personality — NOT generic. Specific UX patterns and visual direction to be determined via creative research (Dribbble/Behance references). Will use the frontend-design skill for implementation to ensure high design quality.

Key principles:
- Results hidden until vote cast (no bandwagon effect)
- Comments tagged with voter's position for context
- Mobile-responsive from day one
- Dark mode default with light mode option

## MVP Scope (What's IN)

- User auth (email + Google)
- Topic feed (trending + new)
- Binary voting with percentage results
- Comments with position indicators
- Scholar citations on comments
- AI-generated tags
- Tag browsing/filtering
- User profiles

## Post-MVP (What's OUT for now)

- Mobile app
- Social sharing
- Notifications
- Moderation tools (admin panel)
- Reporting/flagging
- Vote changing
- Nested comment replies
- Rich text in comments

## Verification Plan

1. **Database**: Run Supabase migrations, verify tables + RLS policies via SQL editor
2. **Auth**: Test signup, login, logout, OAuth flow in browser
3. **Voting**: Submit vote, verify count updates, confirm unique constraint works
4. **Comments**: Vote first, then comment — verify position is inherited correctly
5. **Tags**: Submit topic, verify Claude API generates tags, check tag deduplication
6. **Feed**: Verify trending sort shows recently active topics first
7. **Responsive**: Test on mobile viewport sizes
