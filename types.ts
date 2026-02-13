
export type StudyStyle = 'Cornell' | 'Table' | 'Compact' | 'Summary';

export interface ConceptDefinition {
  term: string;
  definition: string;
  example: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: 'qa' | 'cloze' | 'mcq';
  options?: string[];
  citation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  citation?: string;
}

export interface MindmapNode {
  label: string;
  description?: string;
  children?: MindmapNode[];
}

export interface CornellNotes {
  cues: string[];
  notes: string[];
  summary: string;
}

export interface StudySession {
  id: string;
  title: string;
  originalText: string;
  concepts: ConceptDefinition[];
  notes: string; // Markdown for Summary/Compact/Table
  cornell?: CornellNotes; // Structured for Cornell
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  mindmap: MindmapNode;
  language: string;
}

export type ViewState = 'upload' | 'dashboard' | 'flashcards' | 'notes' | 'mindmap' | 'quiz' | 'tutor';
