
export enum TopicId {
  VERBS = 'VERBS',
  TRANSFORMATION = 'TRANSFORMATION',
  COMPLETING = 'COMPLETING',
  NARRATION = 'NARRATION',
  VOICE = 'VOICE',
  PREPOSITION = 'PREPOSITION',
  ARTICLES = 'ARTICLES'
}

export enum PracticeModeType {
  SINGLE = 'SINGLE',
  PASSAGE = 'PASSAGE'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface TopicDef {
  id: TopicId;
  name: string;
  description: string;
  shortName: string;
  allowPassageMode: boolean;
}

export interface Rule {
  id: string;
  topicId: TopicId;
  title: string;
  description: string;
  example: string;
}

export interface PracticeQuestion {
  topicId: TopicId;
  mode: PracticeModeType;
  difficulty: DifficultyLevel;
  questionText: string;
  instruction: string;
  gaps?: number[];
  hint?: string;
  // New: Store correct answers locally for instant checking
  answerKey?: Record<string, string>; 
}

export interface GapEvaluation {
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface EvaluationResult {
  overallScore: number;
  overallFeedback: string;
  details: Record<string, GapEvaluation>;
}

export enum AppView {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  LEARN = 'LEARN'
}
