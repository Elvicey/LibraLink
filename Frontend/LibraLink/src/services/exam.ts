import { api } from "./api";

export interface ExamQuestion {
  id: number;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string; // "A" | "B" | "C" | "D"
  questionType?: string;
  difficulty?: string;
  explanation?: string;
  sessionId?: number;
}

export interface GenerateQuestionsResult {
  message: string;
  count: number;
  questions: ExamQuestion[];
}

export interface AnswerResult {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export const examService = {
  /** Generate a multiple-choice quiz from a pasted topic/text (no source book needed). */
  generateFromTopic: (
    topic: string,
    count = 5,
    difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
  ): Promise<GenerateQuestionsResult> =>
    api.post<GenerateQuestionsResult>("/api/exam/questions/generate", {
      content: topic,
      count,
      difficulty,
    }),

  /** Submit the chosen answer letter; backend records it and returns correctness + explanation. */
  submitAnswer: (questionId: number, answer: string): Promise<AnswerResult> =>
    api.post<AnswerResult>(`/api/exam/questions/${questionId}/answer`, { answer }),
};
