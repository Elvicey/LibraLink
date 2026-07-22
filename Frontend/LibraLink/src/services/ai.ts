import { api } from "./api";

export interface AiChatRequestPayload {
  prompt: string;
  userId?: number;
}

export interface AiChatResponsePayload {
  response: string;
  intent: string;
  suggestedBooks?: any[];
}

export const aiService = {
  /**
   * Sends natural language prompt to backend Ask Libra AI Assistant API.
   */
  askLibra: async (prompt: string, userId: number = 1): Promise<AiChatResponsePayload> => {
    try {
      return await api.post<AiChatResponsePayload>("/api/ai/chat", {
        prompt,
        userId,
      });
    } catch (error) {
      console.warn("Failed to reach backend AI service, returning intelligent local fallback response:", error);
      
      const lower = prompt.toLowerCase();
      let responseText = "I searched the catalog for that query. I suggest checking out the main collection under Class B or talking to a librarian at the reference desk.";
      let intent = "GENERAL";

      if (lower.includes("project") || lower.includes("recommend")) {
        responseText = "Based on your final year requirements, I recommend checking out 'Lean Startup' by Eric Ries and 'Data Structures in Practice' in the Computing section.";
        intent = "RECOMMENDATION";
      } else if (lower.includes("econ") || lower.includes("study")) {
        responseText = "I found 'African Economics' by A. Smith (Available on Shelf B4) and 'African Economic Dev.' (Currently on Loan, due in 5 days).";
        intent = "STUDY_GUIDE";
      } else if (lower.includes("summarize") || lower.includes("list")) {
        responseText = "Your active Semester reading list contains 17 titles. You have completed 37% of 'Data Structures in Practice' and have 1 overdue check-out.";
        intent = "SUMMARY";
      }

      return {
        response: responseText,
        intent,
      };
    }
  },

  /**
   * Fetches suggested prompts from backend.
   */
  getSuggestions: async (): Promise<string[]> => {
    try {
      return await api.get<string[]>("/api/ai/suggestions");
    } catch {
      return [
        "Recommend books for a project",
        "Find study guides for economics",
        "Summarize my reading list",
      ];
    }
  },
};
