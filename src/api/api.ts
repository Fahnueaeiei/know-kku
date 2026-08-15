const API_URL = "http://172.20.10.2:3000";

export async function getPlaces() {
  const response = await fetch(`${API_URL}/places`);

  if (!response.ok) {
    throw new Error("Failed to fetch places");
  }

  return response.json();
}