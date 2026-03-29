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
