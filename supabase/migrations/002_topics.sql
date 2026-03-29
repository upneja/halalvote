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
