import { API_URL } from "./api"; // adjust the path to where your API file lives

export type ChatResponse = {
  answer: string;
  sources: string[];
};

export async function sendChatMessage(
  question: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to connect to P'Din-Dang");
  }

  return response.json();
}