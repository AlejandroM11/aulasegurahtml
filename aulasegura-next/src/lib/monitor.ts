import { db } from './firebase'
import { ref, set, update, remove, onValue, off, onDisconnect } from 'firebase/database'
import { ActiveStudent, Message } from '@/types'

const studentRef = (examCode: string, uid: string) =>
  ref(db, `active_exams/${examCode}/students/${uid}`)

const messagesRef = (examCode: string) =>
  ref(db, `active_exams/${examCode}/messages`)

export async function registerActiveStudent(examCode: string, data: {
  uid: string; displayUid: string; email: string; name: string; timeLeft: number
}) {
  const r = studentRef(examCode, data.uid)
  await onDisconnect(r).remove()
  return set(r, {
    uid: data.uid, displayUid: data.displayUid,
    email: data.email, name: data.name,
    joinedAt: Date.now(), status: 'active',
    timeLeft: data.timeLeft, answeredCount: 0,
    violations: 0, isBlocked: false, lastActivity: Date.now(),
  })
}

export function updateStudentStatus(examCode: string, uid: string, updates: Partial<ActiveStudent>) {
  return update(studentRef(examCode, uid), { ...updates, lastActivity: Date.now() })
}

export function blockStudent(examCode: string, uid: string, reason: string) {
  return update(studentRef(examCode, uid), {
    isBlocked: true, blockReason: reason,
    blockedAt: Date.now(), status: 'blocked',
  })
}

export function unblockStudent(examCode: string, uid: string) {
  return update(studentRef(examCode, uid), {
    isBlocked: false, blockReason: null,
    unblockedAt: Date.now(), status: 'active',
  })
}

export function removeActiveStudent(examCode: string, uid: string) {
  onDisconnect(studentRef(examCode, uid)).cancel().catch(() => {})
  return remove(studentRef(examCode, uid))
}

export function listenToActiveStudents(
  examCode: string,
  callback: (students: ActiveStudent[]) => void
): () => void {
  const r = ref(db, `active_exams/${examCode}/students`)
  onValue(r, snap => {
    const raw = snap.val()
    const students: ActiveStudent[] = raw
      ? Object.entries(raw).map(([id, v]) => ({ id, ...(v as object) } as ActiveStudent))
      : []
    callback(students)
  })
  return () => off(r, 'value')
}

export function listenToMessages(
  examCode: string,
  callback: (msgs: Message[]) => void
): () => void {
  const r = messagesRef(examCode)
  onValue(r, snap => {
    const raw = snap.val()
    const msgs: Message[] = raw
      ? Object.entries(raw).map(([id, v]) => ({ id, ...(v as object) } as Message))
      : []
    callback(msgs.sort((a, b) => b.timestamp - a.timestamp))
  })
  return () => off(r, 'value')
}

export function listenToBlockStatus(
  examCode: string, uid: string,
  callback: (isBlocked: boolean, reason?: string) => void
): () => void {
  const r = studentRef(examCode, uid)
  onValue(r, snap => {
    const data = snap.val()
    if (data) callback(data.isBlocked, data.blockReason)
  })
  return () => off(r, 'value')
}

export function sendMessageToTeacher(
  examCode: string, uid: string, message: string,
  studentName: string, studentEmail: string
) {
  const { push } = require('firebase/database')
  return push(messagesRef(examCode), {
    studentUid: uid, studentName, studentEmail,
    message, timestamp: Date.now(), read: false,
  })
}

export function respondToStudent(examCode: string, messageId: string, response: string) {
  const r = ref(db, `active_exams/${examCode}/messages/${messageId}`)
  return update(r, { response, respondedAt: Date.now(), read: true })
}

export function deleteMessage(examCode: string, messageId: string) {
  return remove(ref(db, `active_exams/${examCode}/messages/${messageId}`))
}

const STALE_MS = 5 * 60 * 1000
export async function purgeGhosts(examCode: string, students: ActiveStudent[]) {
  const now = Date.now()
  const ghosts = students.filter(s => (now - (s.lastActivity || s.joinedAt || 0)) > STALE_MS)
  await Promise.allSettled(ghosts.map(s => removeActiveStudent(examCode, s.id)))
}
