CREATE OR REPLACE FUNCTION get_comment_counts(topic_ids UUID[])
RETURNS TABLE(topic_id UUID, count BIGINT) AS $$
  SELECT c.topic_id, COUNT(*) as count
  FROM comments c
  WHERE c.topic_id = ANY(topic_ids)
  GROUP BY c.topic_id;
$$ LANGUAGE SQL;
