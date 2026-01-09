
import type { User } from 'https://esm.sh/firebase/auth';

export type FirebaseUser = User;

export enum Subject {
  Math = "Math",
  Physics = "Physics",
  Chemistry = "Chemistry",
  Biology = "Biology",
  Science = "Science (General)",
  History = "History",
  Geography = "Geography",
  SST = "Social Studies (SST)",
  English = "English",
  ComputerScience = "Computer Science"
}

export type ClassLevel = 
  | "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10" 
  | "Class 11" | "Class 12" | "Any";

export type QuestionType = 'mcq' | 'written';
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

// --- User History & Memory Types ---

export interface KnowledgeProfile {
  strengths: string[];
  weaknesses: string[];
  recentTopics: string[];
  lastSessionSummary: string;
}

export interface UserActivity {
  id?: string;
  userId: string;
  type: 'chat' | 'quiz' | 'summary' | 'flashcards' | 'mindmap' | 'exam_prediction' | 'debate' | 'visual_explanation' | 'other';
  topic: string;
  subject: string;
  timestamp: any; // Firestore Timestamp or Date
  data: any; // The full quiz result, chat transcript, etc.
  analysis?: {
    score?: string; // Changed to string to handle "5/10" formats
    strengthsIdentified?: string[];
    weaknessesIdentified?: string[];
    aiFeedback?: string;
  };
}

export interface WrittenFeedback {
  whatIsCorrect: string;
  whatIsMissing: string;
  whatIsIncorrect: string;
  marksAwarded: number;
  totalMarks: number;
}

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string; // For MCQs
  explanation: string;
  userAnswer?: string; // For storing user's typed answer
  userAnswerImages?: string[]; // For storing base64 image data of uploaded answers
  userSpokenAnswerBlob?: Blob; // For storing spoken answer
  isCorrect?: boolean;   // For storing if MCQ answer was correct
  feedback?: WrittenFeedback; // For storing feedback for written questions
  transcription?: string; // For spoken answer
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export interface PaperQuestion {
  question: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer';
  options?: string[];
  answer: string;
  marks: number;
}

export interface QuestionPaper {
  title: string;
  totalMarks: number;
  instructions: string;
  questions: PaperQuestion[];
}

export interface GradedQuestionFeedback {
    whatWasCorrect: string;
    whatWasIncorrect: string;
    suggestionForImprovement: string;
}

export interface GradedQuestion {
    questionNumber: number;
    marksAwarded: number;
    feedback: GradedQuestionFeedback;
    studentAnswerTranscription?: string;
}

export interface GradedPaper {
    totalMarksAwarded: number;
    overallFeedback: string;
    gradedQuestions: GradedQuestion[];
}

export interface QuizHistoryItem {
  date: string;
  subject: Subject;
  score: string;
  level: string;
}

export interface Flashcard {
  term: string;
  definition: string;
  tip?: string;
}

export interface SmartSummary {
  title: string;
  coreConcepts: {
    term: string;
    definition: string;
  }[];
  visualAnalogy: {
    analogy: string;
    explanation: string;
  };
  examSpotlight: string[];
  stuBroTip: string;
}

export interface MindMapNode {
  term: string;
  explanation: string;
  children?: MindMapNode[];
}

export interface StudyDay {
  day: number;
  topic: string;
  goal: string;
  timeSlot?: string;
}

export interface StudyPlan {
  title: string;
  plan: StudyDay[];
}

export interface LineByLineExplanation {
  original: string;
  english: string;
  hinglish: string;
}

export interface CareerStep {
  stage: string; // e.g., "Class 9-10", "Class 11-12", "After Class 12"
  focus: string;
  examsToPrepare?: string[];
}

export interface CareerPath {
  careerName: string;
  description: string;
  subjectsToFocus: string[];
  roadmap: CareerStep[];
  topColleges?: string[];
  potentialGrowth: string;
}

export interface CareerInfo {
  introduction: string;
  careerPaths: CareerPath[];
}

export interface VivaQuestion {
    questionText: string;
    answerText?: string;
    answerAudioBlob?: Blob;
    answerPlaybackUrl?: string; 
    isAnswered: boolean;
    transcription?: string;
    feedback?: string;
    marksAwarded?: number;
}

// FIX: Harmonized VisualExplanationScene to include both imageBytes and optional imageUrl
export interface VisualExplanationScene {
  imageBytes?: string;
  imageUrl?: string;
  narration: string;
}

export interface DebateTurn {
  speaker: 'user' | 'critico';
  text: string;
}

export interface DebateScorecard {
  overallScore: number;
  argumentStrength: number;
  rebuttalEffectiveness: number;
  clarity: number;
  strongestArgument: string;
  improvementSuggestion: string;
  concludingRemarks: string;
}

// --- CHAPTER CONQUEST: ODYSSEY (REAL-TIME 2D GAME) ---
export type TileType = 'floor' | 'wall' | 'interaction' | 'exit';

export interface Tile {
    type: TileType;
}

export interface Interaction {
    id: number;
    position: { x: number; y: number };
    prompt: string;
    correct_answer: string;
    success_message: string;
    failure_message: string;
}

export interface GameLevel {
    title: string;
    theme: string;
    goal: string;
    player_start: { x: number; y: number };
    grid: Tile[][]; // A 2D array representing the map, e.g., 15 rows x 20 cols
    interactions: Interaction[];
}

export interface PlayerPosition {
    x: number;
    y: number;
}

// --- NEW TOOL TYPES ---

export interface LabExperiment {
    experimentTitle: string;
    objective: string;
    hypothesis: string;
    materials: string[];
    procedure: string[];
    safetyPrecautions: string[];
}

export interface LiteraryAnalysis {
    title: string;
    author?: string;
    themes: string[];
    literaryDevices: {
        device: string;
        example: string;
    }[];
    characterAnalysis: {
        character: string;
        analysis: string;
    }[];
    overallSummary: string;
}

export interface Analogy {
    analogy: string;
    explanation: string;
}

export interface RealWorldApplication {
    industry: string;
    description: string;
}

export interface LearningStep {
    step: number;
    topic: string;
    goal: string;
    resources: string[];
}

export interface LearningPath {
    mainTopic: string;
    weakAreas: string[];
    learningSteps: LearningStep[];
}

// --- History ---
export interface WorkHistoryItem {
  id: string;
  type: string; // e.g., 'Question Paper', 'Mind Map'
  date: string;
  title: string;
  data: any; // The full generated object
  subject?: Subject;
}

// FIX: Added JSX IntrinsicElements shim to resolve 'div', 'main', etc. does not exist on type 'JSX.IntrinsicElements'.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
