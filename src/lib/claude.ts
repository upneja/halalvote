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
