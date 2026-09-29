const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.108:8000";

export type ChatResponse = {
  answer: string;
  sources: string[];
};

export async function sendChatMessage(
  question: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Failed to connect to P'Din-Dang"
    );
  }

  return response.json();
}