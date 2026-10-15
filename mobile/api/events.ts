
import { API_URL } from "./api";

export const KKU_EVENTS_PAGE_URL =
  "https://www.kku.ac.th/th/events/";

export type KkuEvent = {
  id: string;
  title: string;
  excerpt: string;
  dateLabel: string;
  venue?: string;
  imageUrl?: string;
  url: string;
  startTs: number;
};

export async function fetchKkuEvents(
  limit = 6
): Promise<KkuEvent[]> {
  const url =
    `${API_URL.replace(/\/+$/, "")}/kku-events?limit=${Math.min(
      12,
      Math.max(1, Math.floor(limit))
    )}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ?? "ไม่สามารถโหลดข่าวและกิจกรรม KKU ได้"
    );
  }

  const seen = new Set<string>();

  return (Array.isArray(data?.events) ? data.events : [])
    .filter((event: KkuEvent) => {
      const key = event.title
        .normalize("NFKC")
        .toLocaleLowerCase("th-TH")
        .replace(/\s+/g, " ")
        .trim();

      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .sort(
      (a: KkuEvent, b: KkuEvent) => a.startTs - b.startTs
    )
    .slice(0, limit);
}
