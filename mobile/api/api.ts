const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://172.20.10.2:3000";

export type ApiPlace = {
  placeId: number;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  priceMin: number | null;
  priceMax: number | null;
};

export type ApiEvent = {
  eventId: number;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  eventDate: string;
  capacity: number | null;
  externalLink: string | null;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const getPlaces = () => request<ApiPlace[]>("/places");

export const getPlace = (placeId: string | string[]) =>
  request<ApiPlace>(`/places/${encodeURIComponent(String(placeId))}`);

export const getEvents = () => request<ApiEvent[]>("/events");

export const getEventById = async (
  id: string | number
) => {
  const response = await fetch(
    `${API_URL}/events/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch event");
  }

  return response.json();
};