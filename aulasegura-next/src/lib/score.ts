import { Submission, Question } from '@/types'

export interface ScoreResult {
  correct: number
  total:   number
  pct:     number
}

export function calcScore(sub: Submission): ScoreResult | null {
  if (!sub.answers || !sub.examQuestions) return null
  const scoreable = sub.examQuestions.filter(q => q.type === 'mc' || q.type === 'multi')
  if (!scoreable.length) return null

  const correct = scoreable.filter(q => {
    const given = sub.answers[q.id]
    if (q.type === 'mc') {
      return given !== undefined && Number(given) === q.correctIndex
    }
    const givenArr = Array.isArray(given) ? given : []
    const expected = q.correctIndexes ?? []
    return expected.length > 0 &&
      givenArr.length === expected.length &&
      expected.every((i: number) => givenArr.includes(i))
  }).length

  return { correct, total: scoreable.length, pct: Math.round((correct / scoreable.length) * 100) }
}
