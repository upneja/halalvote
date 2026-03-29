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
