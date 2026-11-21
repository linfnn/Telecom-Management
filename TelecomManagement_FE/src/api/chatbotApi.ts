import { apiPost } from "./http";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatbotResponse = {
  success: boolean;
  type?: "text" | "export";
  message: string;
  file_name?: string;
  file_content?: string;
};

export function askChatbot(
  message: string,
  history: ChatMessage[],
): Promise<ChatbotResponse> {
  return apiPost<ChatbotResponse>("/qlmvt/api_chatbot_ask/", {
    message,
    history,
  });
}
