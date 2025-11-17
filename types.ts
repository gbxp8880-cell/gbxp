export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GeminiQuizResponse {
    questions: QuizQuestion[];
}

export enum QuizState {
  NOT_STARTED = 'NOT_STARTED',
  LOADING = 'LOADING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}