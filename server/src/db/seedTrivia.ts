import { eq } from "drizzle-orm";
import { KKU_TRIVIA } from "./triviaSeedData.js";
import { db } from "./index.js";
import { news } from "./schema.js";

for (const item of KKU_TRIVIA) {
  const [existing] = await db
    .select({ newsId: news.newsId })
    .from(news)
    .where(eq(news.externalLink, item.sourceUrl))
    .limit(1);

  const values = {
    contentType: "trivia" as const,
    title: item.title,
    category: item.category,
    description: item.description,
    icon: item.icon,
    externalLink: item.sourceUrl,
    bg: item.bg,
    accent: item.accent,
  };

  if (existing) {
    await db
      .update(news)
      .set(values)
      .where(eq(news.newsId, existing.newsId));
  } else {
    await db.insert(news).values(values);
  }
}

console.log(`Seeded ${KKU_TRIVIA.length} trivia items.`);
