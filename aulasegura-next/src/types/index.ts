// ── User ──────────────────────────────────────────────────
export interface User {
  uid:        string
  email:      string
  name:       string
  role:       'docente' | 'estudiante'
  photo?:     string
  isGuest?:   boolean
  examCode?:  string
  fromGoogle?: boolean
  hasPassword?: boolean
  createdAt?: string
}

// ── Question ──────────────────────────────────────────────
export type QuestionType = 'mc' | 'multi' | 'open' | 'eq'

export interface Question {
  id:             string
  text:           string
  type:           QuestionType
  isMath?:        boolean
  latex?:         string
  referenceLatex?: string
  correctLatex?:  string
  options?:       string[]
  correctIndex?:  number
  correctIndexes?: number[]
}

// ── Exam ──────────────────────────────────────────────────
export interface Exam {
  id:                 string
  title:              string
  code:               string
  durationMinutes:    number
  questions:          Question[]
  showCorrectAnswers: boolean
  teacherId:          string
  createdAt:          string
}

// ── Active Student (Firebase Realtime DB) ─────────────────
export interface ActiveStudent {
  id:            string
  uid:           string
  displayUid:    string
  email:         string
  name:          string
  joinedAt:      number
  status:        'active' | 'blocked' | 'finished'
  timeLeft:      number
  answeredCount: number
  violations:    number
  isBlocked:     boolean
  blockReason?:  string
  lastActivity:  number
}

// ── Message ───────────────────────────────────────────────
export interface Message {
  id:           string
  studentUid:   string
  studentName:  string
  studentEmail: string
  message:      string
  timestamp:    number
  read:         boolean
  response?:    string
  respondedAt?: number
}

// ── Submission ────────────────────────────────────────────
export interface Violation {
  reason:    string
  timestamp: string
}

export interface Submission {
  id?:           string
  examId:        string
  code:          string
  title:         string
  studentEmail:  string
  studentName:   string
  submittedAt:   string
  answers:       Record<string, unknown>
  violations:    Violation[]
  wasBlocked:    boolean
  blockReason?:  string | null
  forced:        boolean
  examQuestions?: Question[]
  showCorrectAnswers?: boolean
}
