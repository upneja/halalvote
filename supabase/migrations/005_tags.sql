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
