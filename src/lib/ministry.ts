// Data layer for the Children's Ministry platform: teacher applications,
// classes/roster, student profiles, leaderboard, messaging, and Ears for You.
// Thin wrappers over Supabase so the pages stay focused on UI.
import {
  supabase,
  JOIN_CLASS_FUNCTION_URL,
  STUDENT_REGISTER_FUNCTION_URL,
  AI_COMPANION_FUNCTION_URL,
  RESET_PASSCODE_FUNCTION_URL,
} from './supabase'
import { setRememberMe } from './rememberMe'
import type { AnswerRecord } from '../db/types'

// ---------- shared types ----------

export interface ClassRow {
  id: string
  teacher_id: string
  name: string
  season_id: string | null
  join_code: string
  allow_open_join: boolean
  archived: boolean
  created_at: string
}

export interface RosterEntry {
  id: string
  class_id: string
  full_name: string
  claimed: boolean
  student_id: string | null
  created_at: string
}

export type AvatarStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface StudentRow {
  id: string
  class_id: string | null
  username: string
  student_code: string | null
  date_of_birth: string | null
  favorite_verse: string | null
  favorite_quote: string | null
  bio: string | null
  total_points: number
  created_at: string
  full_name: string
  avatar_url: string | null
  /** Only populated for a child looking at their own profile - see
   * getMyStudentProfile. A picture waiting on a teacher is never returned to
   * anybody else. */
  pending_avatar_url?: string | null
  avatar_status?: AvatarStatus
}

export interface TeacherApplication {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface LeaderboardRow {
  student_id: string
  full_name: string
  avatar_url: string | null
  total_points: number
  class_name: string | null
  class_id: string | null
}

export type EarsStatus = 'new' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved'

export interface EarsMessageRow {
  id: string
  class_id: string
  assigned_to: string | null
  student_id: string | null
  student_name?: string | null
  is_anonymous: boolean
  body: string
  status: EarsStatus
  created_at: string
  updated_at: string
}

export interface EarsReplyRow {
  id: string
  message_id: string
  author_id: string
  body: string
  created_at: string
}

export interface EarsNoteRow {
  id: string
  message_id: string
  author_id: string
  body: string
  created_at: string
}

export interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export interface SeasonRow {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

// ---------- teacher applications ----------

export async function submitTeacherApplication(params: { full_name: string; email: string; phone?: string; message?: string }) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { error } = await supabase.from('teacher_applications').insert({
    user_id: auth.user.id,
    full_name: params.full_name.trim(),
    email: params.email.trim(),
    phone: params.phone?.trim() || null,
    message: params.message?.trim() || null,
  })
  if (error) throw error
  await supabase.from('profiles').update({ full_name: params.full_name.trim() }).eq('id', auth.user.id)
}

export async function getMyTeacherApplication(): Promise<TeacherApplication | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase.from('teacher_applications').select('*').eq('user_id', auth.user.id).maybeSingle()
  if (error) throw error
  return data as TeacherApplication | null
}

// ---------- classes (teacher side) ----------

function randomJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function createClass(name: string, seasonId?: string | null): Promise<ClassRow> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  for (let attempt = 0; attempt < 5; attempt++) {
    const join_code = randomJoinCode()
    const { data, error } = await supabase
      .from('classes')
      .insert({ teacher_id: auth.user.id, name: name.trim(), join_code, season_id: seasonId ?? null })
      .select('*')
      .single()
    if (!error) return data as ClassRow
    if (!error.message.includes('duplicate')) throw error
  }
  throw new Error('Could not generate a unique class code, please try again.')
}

export async function listMyClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ClassRow[]
}

export async function archiveClass(classId: string, archived: boolean) {
  const { error } = await supabase.from('classes').update({ archived }).eq('id', classId)
  if (error) throw error
}

export async function listRoster(classId: string): Promise<RosterEntry[]> {
  const { data, error } = await supabase.from('class_roster').select('*').eq('class_id', classId).order('full_name')
  if (error) throw error
  return (data ?? []) as RosterEntry[]
}

export async function addRosterName(classId: string, fullName: string) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('class_roster').insert({ class_id: classId, full_name: fullName.trim(), added_by: auth.user?.id })
  if (error) throw error
}

export async function removeRosterEntry(id: string) {
  const { error } = await supabase.from('class_roster').delete().eq('id', id)
  if (error) throw error
}

export async function listStudentsInClass(classId: string): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, class_id, username, student_code, date_of_birth, favorite_verse, favorite_quote, bio, total_points, created_at, profiles!students_id_fkey(full_name, avatar_url)')
    .eq('class_id', classId)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    full_name: row.profiles?.full_name ?? '',
    avatar_url: row.profiles?.avatar_url ?? null,
  })) as StudentRow[]
}

// ---------- attendance ----------

export interface AttendanceRow {
  student_id: string
  date: string
  present: boolean
}

export async function listAttendanceForDate(classId: string, date: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase.from('attendance').select('student_id, date, present').eq('class_id', classId).eq('date', date)
  if (error) throw error
  return (data ?? []) as AttendanceRow[]
}

export interface AttendanceHistory {
  /** Every date this class has a register for, most recent first. */
  dates: string[]
  /** student_id -> date -> present. Absent from the map means never marked. */
  byStudent: Record<string, Record<string, boolean>>
}

/**
 * Every register this class has taken inside the window, in one query.
 *
 * Attendance was only ever readable one date at a time, which answers "who is
 * here today" and nothing else. The question a teacher actually has is the one
 * that needs weeks side by side: who has stopped coming. The shaping into runs
 * and totals happens on the client - it is a handful of rows per class and no
 * teacher needs it to be a database's problem.
 */
export async function listAttendanceHistory(classId: string, weeks = 16): Promise<AttendanceHistory> {
  const since = new Date()
  since.setDate(since.getDate() - weeks * 7)
  const sinceKey = since.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, date, present')
    .eq('class_id', classId)
    .gte('date', sinceKey)
    .order('date', { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as AttendanceRow[]
  const dates: string[] = []
  const seen = new Set<string>()
  const byStudent: Record<string, Record<string, boolean>> = {}

  for (const r of rows) {
    if (!seen.has(r.date)) {
      seen.add(r.date)
      dates.push(r.date)
    }
    byStudent[r.student_id] ??= {}
    byStudent[r.student_id][r.date] = r.present
  }

  return { dates, byStudent }
}

export async function saveAttendance(classId: string, date: string, records: { student_id: string; present: boolean }[]) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('attendance').upsert(
    records.map((r) => ({ class_id: classId, date, student_id: r.student_id, present: r.present, marked_by: auth.user?.id ?? null })),
    { onConflict: 'class_id,student_id,date' },
  )
  if (error) throw error
}

export async function moveStudent(studentId: string, newClassId: string | null) {
  const { error } = await supabase.rpc('move_student', { p_student_id: studentId, p_new_class_id: newClassId })
  if (error) throw error
}

export async function enrollStudentByCode(classId: string, studentCode: string): Promise<{ student_id: string; full_name: string; class_name: string }> {
  const { data, error } = await supabase.rpc('enroll_student_by_code', { p_class_id: classId, p_student_code: studentCode.trim() })
  if (error) throw new Error(error.message)
  return data as { student_id: string; full_name: string; class_name: string }
}

// ---------- join / login (public, pre-auth) ----------

export interface ClassJoinInfo {
  class_id: string
  class_name: string
  teacher_name: string
  allow_open_join: boolean
  unclaimed_roster: { id: string; full_name: string }[]
  claimed_roster: { id: string; full_name: string }[]
}

export async function getClassByJoinCode(code: string): Promise<ClassJoinInfo | null> {
  const { data, error } = await supabase.rpc('get_class_by_join_code', { p_code: code.trim() })
  if (error) throw error
  return data as ClassJoinInfo | null
}

export async function joinClass(params: { join_code: string; roster_id: string; pin: string }) {
  const res = await fetch(JOIN_CLASS_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not join the class.')
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: body.email, password: params.pin })
  if (signInError) throw signInError
  return body as { email: string; student_id: string; class_name: string }
}

export async function studentSignIn(params: { join_code: string; roster_id: string; pin: string }) {
  const { data: email, error } = await supabase.rpc('get_student_login_email', { p_code: params.join_code.trim(), p_roster_id: params.roster_id })
  if (error) throw error
  if (!email) throw new Error('Could not find that account. Ask your teacher to check the class code.')
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: params.pin })
  if (signInError) throw new Error('Wrong PIN. Try again, or ask your teacher to help.')
}

// ---------- student code identity (current signup model) ----------

export async function registerStudent(params: { full_name: string; guardian_phone?: string; passcode: string }) {
  const res = await fetch(STUDENT_REGISTER_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not create your account.')
  // Every other sign-in path sets this; this one did not, so it inherited
  // whatever the last person on this browser chose. If an adult had ever
  // signed in here with "Remember me" unticked, the flag was still 0, and
  // App.tsx signs a stored session straight back out on the next load - a
  // child would make an account, get in, and be thrown out again. Somebody
  // making a brand new account has not asked to be forgotten.
  setRememberMe(true)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: body.email, password: params.passcode })
  if (signInError) throw signInError
  return body as { email: string; student_id: string; student_code: string }
}

// Returning students sign in with name + passcode, not a Student Code (that's
// for teachers enrolling them into a class - see enrollStudentByCode above).
// The passcode itself is the actual lookup key server-side (it's built from
// the student's name, so it's already unique); full_name is sent along too
// so a handful of pre-existing accounts without a login_key can still be
// found by name as a fallback. See get_student_login_email_by_login_key.
export async function studentSignInByName(params: { full_name: string; passcode: string }) {
  const { data: email, error } = await supabase.rpc('get_student_login_email_by_login_key', {
    p_login_key: params.passcode.trim(),
    p_full_name: params.full_name.trim(),
  })
  if (error) throw error
  if (!email) throw new Error("We couldn't find that account. Double check your name and passcode.")
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: params.passcode })
  if (signInError) throw new Error('Wrong passcode. Try again, or ask your teacher to help.')
}

/**
 * Gives a child a new passcode when they have forgotten theirs. Called by a
 * teacher (or an admin) from the class roster, because a student account has
 * no email and so no reset link can ever be sent to it.
 *
 * The new passcode comes back exactly once, here, for the adult to hand over.
 * It is not stored anywhere readable afterwards.
 */
export async function resetStudentPasscode(studentId: string): Promise<{ passcode: string; full_name: string }> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Not signed in.')

  const res = await fetch(RESET_PASSCODE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ student_id: studentId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not reset that passcode.')
  return body as { passcode: string; full_name: string }
}

// ---------- student self-service ----------

export async function getMyStudentProfile(): Promise<StudentRow | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase
    .from('students')
    .select(
      'id, class_id, username, student_code, date_of_birth, favorite_verse, favorite_quote, bio, total_points, created_at, profiles!students_id_fkey(full_name, avatar_url, pending_avatar_url, avatar_status)',
    )
    .eq('id', auth.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as any
  return {
    ...row,
    full_name: row.profiles?.full_name ?? '',
    avatar_url: row.profiles?.avatar_url ?? null,
    // Only a child's own profile carries these. A picture waiting on a
    // teacher is shown back to the child who uploaded it, and to nobody else.
    pending_avatar_url: row.profiles?.pending_avatar_url ?? null,
    avatar_status: (row.profiles?.avatar_status ?? 'none') as AvatarStatus,
  } as StudentRow
}

// ---------- search ----------

export type SearchKind = 'student' | 'class' | 'assignment' | 'lecture' | 'teacher'

export interface SearchResult {
  kind: SearchKind
  id: string
  title: string
  subtitle: string
  class_id: string | null
}

/**
 * One search across everything the person signed in is allowed to find.
 *
 * What each role can reach is decided inside ministry_search, not here, and
 * not by which portal happens to be calling it: a teacher gets their own
 * classes, an admin gets the ministry, a parent gets their own children. Ears
 * for You threads and private conversations are not searchable at all - those
 * belong in the screen built for reading them, where opening one is recorded.
 */
export async function ministrySearch(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const { data, error } = await supabase.rpc('ministry_search', { p_query: q })
  if (error) throw error
  return (data ?? []) as SearchResult[]
}

// ---------- checking what children upload ----------

export interface PendingAvatar {
  student_id: string
  full_name: string
  class_id: string | null
  class_name: string | null
  pending_avatar_url: string
  current_avatar_url: string | null
}

/**
 * Profile pictures waiting to be looked at. A teacher sees only children in
 * their own classes; an admin sees all of them. The filtering is in the
 * database function, not here.
 */
export async function listPendingAvatars(): Promise<PendingAvatar[]> {
  const { data, error } = await supabase.rpc('list_pending_avatars')
  if (error) throw error
  return (data ?? []) as PendingAvatar[]
}

/** Approve puts the picture live for the class. Reject clears it and leaves
 * whatever was approved before in place. */
export async function reviewChildAvatar(studentId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('review_child_avatar', { p_student: studentId, p_approve: approve })
  if (error) throw error
}

export async function updateMyStudentProfile(params: {
  bio?: string
  favorite_verse?: string
  favorite_quote?: string
  avatar_url?: string
  full_name?: string
}) {
  const { error } = await supabase.rpc('update_my_student_profile', {
    p_bio: params.bio ?? null,
    p_favorite_verse: params.favorite_verse ?? null,
    p_favorite_quote: params.favorite_quote ?? null,
    p_avatar_url: params.avatar_url ?? null,
    p_full_name: params.full_name ?? null,
  })
  if (error) throw error
}

export async function getMyClass(): Promise<(ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null> {
  const student = await getMyStudentProfile()
  if (!student?.class_id) return null
  const { data, error } = await supabase
    .from('classes')
    .select('*, profiles!classes_teacher_id_fkey(full_name, avatar_url)')
    .eq('id', student.class_id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as any
  return { ...row, teacher_name: row.profiles?.full_name ?? '', teacher_avatar: row.profiles?.avatar_url ?? null }
}

// ---------- leaderboard ----------

export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.from('leaderboard').select('*').limit(limit)
  if (error) throw error
  return (data ?? []) as LeaderboardRow[]
}

export type LeaderboardRange = 'week' | 'month' | 'year' | 'all'

export interface RankedLeaderboardRow {
  student_id: string
  full_name: string
  avatar_url: string | null
  class_id: string | null
  class_name: string | null
  points: number
  games: number
  streak: number
}

/**
 * One row per child for a given window, carrying everything the board shows:
 * points earned in that window, games played and the current reading streak.
 * The window is worked out in the database so every client agrees on where a
 * week starts.
 */
export async function getRankedLeaderboard(range: LeaderboardRange): Promise<RankedLeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard_ranked', { p_range: range })
  if (error) throw error
  return (data ?? []) as RankedLeaderboardRow[]
}

export interface ClassLeaderboardRow {
  class_id: string
  class_name: string
  total_points: number
  student_count: number
}

/** Rolls student rows up into class totals, for Feature 4's "Class vs Class" view. */
export function aggregateClassLeaderboard(rows: LeaderboardRow[]): ClassLeaderboardRow[] {
  const byClass = new Map<string, ClassLeaderboardRow>()
  for (const r of rows) {
    if (!r.class_id) continue
    const existing = byClass.get(r.class_id)
    if (existing) {
      existing.total_points += r.total_points
      existing.student_count += 1
    } else {
      byClass.set(r.class_id, { class_id: r.class_id, class_name: r.class_name ?? 'Unnamed Class', total_points: r.total_points, student_count: 1 })
    }
  }
  return Array.from(byClass.values()).sort((a, b) => b.total_points - a.total_points)
}

export async function recordQuizAttempt(params: { class_id?: string | null; season_id?: string | null; set_name: string; points: number; correct_count: number; total_questions: number }) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  const { error } = await supabase.from('quiz_attempts').insert({
    student_id: auth.user.id,
    class_id: params.class_id ?? null,
    season_id: params.season_id ?? null,
    set_name: params.set_name,
    points: params.points,
    correct_count: params.correct_count,
    total_questions: params.total_questions,
  })
  if (error) throw error
}

// Records a quiz result for a student who isn't the one signed in — used
// when a teacher or admin runs an offline quiz match and links a team to a
// registered Student Code. RLS still enforces it: a teacher can only record
// for students in their own class, an admin can record for anyone.
export async function recordQuizAttemptForStudent(params: {
  student_id: string
  class_id: string | null
  season_id?: string | null
  set_name: string
  points: number
  correct_count: number
  total_questions: number
}) {
  const { error } = await supabase.from('quiz_attempts').insert({
    student_id: params.student_id,
    class_id: params.class_id,
    season_id: params.season_id ?? null,
    set_name: params.set_name,
    points: params.points,
    correct_count: params.correct_count,
    total_questions: params.total_questions,
  })
  if (error) throw error
}

// Pushes a *complete* finished quiz session (every question, not just the
// aggregate points quiz_attempts stores) so History is visible from any
// device/browser, not only the one that played it - the quiz itself is
// never login-gated, so this has no auth requirement either (see the
// quiz_sessions RLS policies). Returns the inserted row's id so the caller
// can mark its local copy as synced and avoid double-counting it later.
export async function recordQuizSession(params: {
  studentId?: string | null
  playerName: string
  setName: string
  seasonName?: string
  mode?: string
  outcome: string
  pointsWon: number
  correctCount: number
  totalLevels: number
  startedAt: number
  finishedAt: number
  answers: AnswerRecord[]
}): Promise<string> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      student_id: params.studentId ?? null,
      player_name: params.playerName,
      set_name: params.setName,
      season_name: params.seasonName ?? null,
      mode: params.mode ?? null,
      outcome: params.outcome,
      points_won: params.pointsWon,
      correct_count: params.correctCount,
      total_levels: params.totalLevels,
      started_at: new Date(params.startedAt).toISOString(),
      finished_at: new Date(params.finishedAt).toISOString(),
      answers: params.answers,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export interface QuizHistoryRow {
  id: string
  player_name: string
  set_name: string
  season_name: string | null
  outcome: string
  points_won: number
  correct_count: number
  total_levels: number
  finished_at: string
  answers: AnswerRecord[]
}

/** Every synced quiz session ministry-wide, newest first - the cross-device counterpart to this device's local db.gameSessions. */
export async function getQuizHistory(limit = 300): Promise<QuizHistoryRow[]> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id, player_name, set_name, season_name, outcome, points_won, correct_count, total_levels, finished_at, answers')
    .order('finished_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Just the signed-in student's own synced matches - the Kids Dashboard's "My History" tab, filtered server-side by their own student_id rather than trusting a client-side filter. */
export async function getMyQuizHistory(limit = 100): Promise<QuizHistoryRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id, player_name, set_name, season_name, outcome, points_won, correct_count, total_levels, finished_at, answers')
    .eq('student_id', auth.user.id)
    .order('finished_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// Looks a student up by Student Code for linking, without enrolling them
// anywhere. Teacher/admin only (enforced server-side).
export async function findStudentByCode(code: string): Promise<{ id: string; full_name: string; class_id: string | null } | null> {
  const { data, error } = await supabase.rpc('find_student_by_code', { p_code: code.trim() })
  if (error) throw error
  return data as { id: string; full_name: string; class_id: string | null } | null
}

// ---------- messaging ----------

export async function getOrCreateConversation(teacherId: string, studentId: string): Promise<string> {
  const { data: existing } = await supabase.from('conversations').select('id').eq('teacher_id', teacherId).eq('student_id', studentId).maybeSingle()
  if (existing) return existing.id
  const { data, error } = await supabase.from('conversations').insert({ teacher_id: teacherId, student_id: studentId }).select('id').single()
  if (error) throw error
  return data.id
}

export interface ConversationSummary {
  id: string
  teacher_id: string
  student_id: string
  other_name: string
  other_avatar: string | null
  last_message: string | null
  last_message_at: string | null
}

export async function listMyConversations(): Promise<ConversationSummary[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from('conversations')
    .select('id, teacher_id, student_id, teacher:profiles!conversations_teacher_id_fkey(full_name, avatar_url), student:students!inner(profiles!students_id_fkey(full_name, avatar_url))')
    .or(`teacher_id.eq.${auth.user.id},student_id.eq.${auth.user.id}`)
  if (error) throw error
  return (data ?? []).map((row: any) => {
    const isTeacher = row.teacher_id === auth.user!.id
    const other = isTeacher ? row.student?.profiles : row.teacher
    return {
      id: row.id,
      teacher_id: row.teacher_id,
      student_id: row.student_id,
      other_name: other?.full_name ?? 'Unknown',
      other_avatar: other?.avatar_url ?? null,
      last_message: null,
      last_message_at: null,
    }
  })
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at')
  if (error) throw error
  return (data ?? []) as MessageRow[]
}

export async function sendMessage(conversationId: string, body: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: auth.user.id, body: body.trim() })
  if (error) throw error
}

// ---------- Ears for You ----------
// A safe place for a child to tell a trusted adult something — worried,
// curious, or just on their mind. Routing is system-controlled (the class's
// teacher, never a student's free choice); status moves through
// new -> acknowledged -> in_progress -> (escalated) -> resolved; internal
// staff notes never reach a student-facing query.

export async function submitEarsMessage(params: { class_id: string; body: string; is_anonymous: boolean }) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { error } = await supabase.from('ears_messages').insert({
    class_id: params.class_id,
    student_id: auth.user.id,
    is_anonymous: params.is_anonymous,
    body: params.body.trim(),
  })
  if (error) throw error
}

export async function listMyEarsMessages(): Promise<EarsMessageRow[]> {
  const { data, error } = await supabase.from('ears_messages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EarsMessageRow[]
}

export async function listEarsTeacherInbox(): Promise<EarsMessageRow[]> {
  const { data, error } = await supabase.from('ears_teacher_inbox').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EarsMessageRow[]
}

export async function listEarsReplies(messageId: string): Promise<EarsReplyRow[]> {
  const { data, error } = await supabase.from('ears_message_replies').select('*').eq('message_id', messageId).order('created_at')
  if (error) throw error
  return (data ?? []) as EarsReplyRow[]
}

export async function listEarsInternalNotes(messageId: string): Promise<EarsNoteRow[]> {
  const { data, error } = await supabase.from('ears_internal_notes').select('*').eq('message_id', messageId).order('created_at')
  if (error) throw error
  return (data ?? []) as EarsNoteRow[]
}

export interface EarsAuditLogRow {
  id: string
  action: string
  detail: string | null
  actor_id: string | null
  created_at: string
}

/** Admin/assigned-teacher only (RLS on ears_audit_log) - the concrete evidence behind the Safety & Privacy guarantees. */
export async function listEarsAuditLog(limit = 50): Promise<EarsAuditLogRow[]> {
  const { data, error } = await supabase
    .from('ears_audit_log')
    .select('id, action, detail, actor_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as EarsAuditLogRow[]
}

export async function acknowledgeEarsMessage(id: string) {
  const { error } = await supabase.rpc('acknowledge_ears_message', { p_id: id })
  if (error) throw error
}

export async function setEarsStatus(id: string, status: EarsStatus) {
  const { error } = await supabase.rpc('set_ears_status', { p_id: id, p_status: status })
  if (error) throw error
}

export async function escalateEarsMessage(id: string, reason: string) {
  const { error } = await supabase.rpc('escalate_ears_message', { p_id: id, p_reason: reason })
  if (error) throw error
}

export async function addEarsReply(id: string, body: string) {
  const { error } = await supabase.rpc('add_ears_reply', { p_id: id, p_body: body })
  if (error) throw error
}

export async function addEarsInternalNote(id: string, body: string) {
  const { error } = await supabase.rpc('add_ears_internal_note', { p_id: id, p_body: body })
  if (error) throw error
}

// ---------- admin ----------

export async function listTeacherApplications(status?: 'pending' | 'approved' | 'rejected'): Promise<TeacherApplication[]> {
  let query = supabase.from('teacher_applications').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as TeacherApplication[]
}

export async function approveTeacher(applicationId: string, approve: boolean) {
  const { error } = await supabase.rpc('approve_teacher', { p_application_id: applicationId, p_approve: approve })
  if (error) throw error
}

export async function promoteToAdmin(userId: string) {
  const { error } = await supabase.rpc('promote_to_admin', { p_user_id: userId })
  if (error) throw error
}

export async function listAllClassesWithTeacher(): Promise<(ClassRow & { teacher_name: string })[]> {
  const { data, error } = await supabase.from('classes').select('*, profiles!classes_teacher_id_fkey(full_name)').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row, teacher_name: row.profiles?.full_name ?? '' }))
}

export async function listAllTeachers(): Promise<Array<{ id: string; full_name: string; role: string | null }>> {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role').in('role', ['teacher', 'admin']).order('full_name')
  if (error) throw error
  return data ?? []
}

export async function listSeasons(): Promise<SeasonRow[]> {
  const { data, error } = await supabase.from('seasons').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SeasonRow[]
}

export async function createSeasonServer(name: string) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('seasons').insert({ name: name.trim(), created_by: auth.user?.id })
  if (error) throw error
}

export async function setActiveSeasonServer(id: string) {
  const all = await listSeasons()
  await Promise.all(all.map((s) => supabase.from('seasons').update({ is_active: s.id === id }).eq('id', s.id)))
}

// ---------- lectures ----------

export type LectureStatus = 'draft' | 'scheduled' | 'published' | 'unpublished' | 'expired' | 'archived'

export interface LectureRow {
  id: string
  class_id: string
  teacher_id: string
  title: string
  description: string | null
  body: string | null
  status: LectureStatus
  publish_at: string | null
  expires_at: string | null
  created_at: string
}

export async function listLectures(classId: string): Promise<LectureRow[]> {
  const { data, error } = await supabase.from('lectures').select('*').eq('class_id', classId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LectureRow[]
}

export async function createLecture(params: { class_id: string; title: string; description?: string; body?: string }) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('lectures').insert({ ...params, teacher_id: auth.user?.id })
  if (error) throw error
}

export async function setLectureStatus(id: string, status: LectureStatus) {
  const { error } = await supabase.from('lectures').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

// ---------- assignments ----------

export type AssignmentStatus = 'draft' | 'published' | 'closed'

export interface AssignmentRow {
  id: string
  class_id: string
  teacher_id: string
  title: string
  instructions: string | null
  due_date: string | null
  max_score: number | null
  status: AssignmentStatus
  created_at: string
}

export interface SubmissionRow {
  id: string
  assignment_id: string
  student_id: string
  body: string | null
  submitted_at: string
  grade: number | null
  feedback: string | null
  graded_at: string | null
  full_name?: string
}

export async function listAssignments(classId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase.from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AssignmentRow[]
}

// ---------- Sunday School calendar unlocks ----------
// A teacher decides which Sundays are "taught" for their own class; kids
// just read which dates are unlocked. Dates are plain 'YYYY-MM-DD' strings
// (see sundayDateKey in content/sundaySchoolCalendar.ts).

export async function listUnlockedSundays(classId: string): Promise<string[]> {
  const { data, error } = await supabase.from('class_sunday_unlocks').select('sunday_date').eq('class_id', classId)
  if (error) throw error
  return (data ?? []).map((row: any) => row.sunday_date as string)
}

export async function unlockSunday(classId: string, dateKey: string) {
  const { error } = await supabase.from('class_sunday_unlocks').upsert({ class_id: classId, sunday_date: dateKey }, { onConflict: 'class_id,sunday_date' })
  if (error) throw error
}

export async function lockSunday(classId: string, dateKey: string) {
  const { error } = await supabase.from('class_sunday_unlocks').delete().eq('class_id', classId).eq('sunday_date', dateKey)
  if (error) throw error
}

export async function createAssignment(params: { class_id: string; title: string; instructions?: string; due_date?: string; max_score?: number }) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('assignments').insert({ ...params, teacher_id: auth.user?.id })
  if (error) throw error
}

export async function setAssignmentStatus(id: string, status: AssignmentStatus) {
  const { error } = await supabase.from('assignments').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function listSubmissionsForAssignment(assignmentId: string): Promise<SubmissionRow[]> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, students!inner(profiles!students_id_fkey(full_name))')
    .eq('assignment_id', assignmentId)
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row, full_name: row.students?.profiles?.full_name ?? '' })) as SubmissionRow[]
}

export async function gradeSubmission(id: string, grade: number, feedback: string) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('assignment_submissions')
    .update({ grade, feedback, graded_by: auth.user?.id, graded_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- student-facing class work ----------

export async function listPublishedLectures(classId: string): Promise<LectureRow[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LectureRow[]
}

export async function listPublishedAssignments(classId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'published')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as AssignmentRow[]
}

export async function getMySubmission(assignmentId: string): Promise<SubmissionRow | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', auth.user.id)
    .maybeSingle()
  if (error) throw error
  return data as SubmissionRow | null
}

export async function submitAssignment(assignmentId: string, body: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in.')
  const { error } = await supabase
    .from('assignment_submissions')
    .upsert({ assignment_id: assignmentId, student_id: auth.user.id, body, submitted_at: new Date().toISOString() }, { onConflict: 'assignment_id,student_id' })
  if (error) throw error
}

// ---------- Bible reading plan ----------

export interface TodaysReading {
  plan_id: string
  plan_title: string
  reading_id: string
  day_number: number
  title: string
  reference: string
  passage_text: string | null
}

export interface BiblePlanRow {
  id: string
  title: string
  description: string | null
  duration_days: number
  start_date: string
  is_active: boolean
  created_at: string
}

export interface BibleReadingRow {
  id: string
  plan_id: string
  day_number: number
  title: string
  reference: string
  passage_text: string | null
}

export async function getTodaysBibleReading(): Promise<TodaysReading | null> {
  const { data, error } = await supabase.rpc('get_todays_bible_reading')
  if (error) throw error
  return data as TodaysReading | null
}

export async function getMyBibleStreak(): Promise<number> {
  const { data, error } = await supabase.rpc('get_my_bible_streak')
  if (error) throw error
  return (data as number) ?? 0
}

export async function completeBibleReading(readingId: string) {
  const { error } = await supabase.rpc('complete_bible_reading', { p_reading_id: readingId })
  if (error) throw error
}

export async function haveICompletedReading(readingId: string): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return false
  const { data, error } = await supabase
    .from('student_bible_progress')
    .select('id')
    .eq('student_id', auth.user.id)
    .eq('reading_id', readingId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// ---------- admin: bible plan management ----------

export async function listBiblePlans(): Promise<BiblePlanRow[]> {
  const { data, error } = await supabase.from('bible_plans').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BiblePlanRow[]
}

export async function createBiblePlan(params: { title: string; description?: string; duration_days: number; start_date: string }) {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('bible_plans').insert({ ...params, created_by: auth.user?.id })
  if (error) throw error
}

export async function setActiveBiblePlan(id: string, active: boolean) {
  const { error } = await supabase.from('bible_plans').update({ is_active: active }).eq('id', id)
  if (error) throw error
}

export async function listPlanReadings(planId: string): Promise<BibleReadingRow[]> {
  const { data, error } = await supabase.from('bible_plan_readings').select('*').eq('plan_id', planId).order('day_number')
  if (error) throw error
  return (data ?? []) as BibleReadingRow[]
}

export async function addBibleReading(params: { plan_id: string; day_number: number; title: string; reference: string; passage_text?: string }) {
  const { error } = await supabase.from('bible_plan_readings').insert(params)
  if (error) throw error
}

// ---------- achievements ----------

export interface AchievementRow {
  id: string
  code: string
  name: string
  description: string
  icon: string
}

export interface EarnedAchievement extends AchievementRow {
  earned_at: string
}

export interface BibleCharacterRow {
  key: string
  name: string
  book: string
  lesson_key: string
  image: string
  short_story: string
  sort_order: number
}

/** The full character catalog - unlock state lives in achievements (code = "character_" + key), not here. */
export async function listBibleCharacters(): Promise<BibleCharacterRow[]> {
  const { data, error } = await supabase.from('bible_characters').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as BibleCharacterRow[]
}

export async function listMyAchievements(): Promise<EarnedAchievement[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from('student_achievements')
    .select('earned_at, achievements!inner(id, code, name, description, icon)')
    .eq('student_id', auth.user.id)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row.achievements, earned_at: row.earned_at })) as EarnedAchievement[]
}

/** The full catalog (earned or not) - the Achievements Wall shows every badge that exists, dimmed until earned, not just the ones already won. */
export async function listAllAchievements(): Promise<AchievementRow[]> {
  const { data, error } = await supabase.from('achievements').select('id, code, name, description, icon').eq('active', true).order('name')
  if (error) throw error
  return data ?? []
}

// ---------- private notes (Notebook / Diary / Prayer Journal) ----------
// Always fully private to the student who wrote them - no teacher/admin
// policy exists on this table at all, by design.

export type NoteKind = 'notebook' | 'diary' | 'prayer'

export interface PrivateNoteRow {
  id: string
  student_id: string
  kind: NoteKind
  title: string
  body: string
  created_at: string
  updated_at: string
}

export async function listMyNotes(kind: NoteKind): Promise<PrivateNoteRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from('private_notes')
    .select('*')
    .eq('student_id', auth.user.id)
    .eq('kind', kind)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PrivateNoteRow[]
}

export async function createNote(kind: NoteKind, title: string, body: string): Promise<PrivateNoteRow> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase
    .from('private_notes')
    .insert({ student_id: auth.user.id, kind, title: title.trim(), body: body.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as PrivateNoteRow
}

export async function updateNote(id: string, title: string, body: string) {
  const { error } = await supabase.from('private_notes').update({ title: title.trim(), body: body.trim(), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('private_notes').delete().eq('id', id)
  if (error) throw error
}

// ---------- digital bank (vault) ----------
// A private place for a kid to keep files that matter to them - finished
// assignments, notes, photos, voice notes. Text notes are stored inline;
// anything with an actual file goes to the private `vault` storage bucket,
// under a folder named for the student's own auth id (RLS enforces that a
// student can only read/write their own folder).

export type VaultCategory = 'assignment' | 'note' | 'photo' | 'audio' | 'other'

export interface VaultItemRow {
  id: string
  student_id: string
  category: VaultCategory
  title: string
  note: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  created_at: string
}

export async function listMyVaultItems(): Promise<VaultItemRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase.from('vault_items').select('*').eq('student_id', auth.user.id).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as VaultItemRow[]
}

export async function addVaultNote(title: string, note: string): Promise<VaultItemRow> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase
    .from('vault_items')
    .insert({ student_id: auth.user.id, category: 'note', title: title.trim(), note: note.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as VaultItemRow
}

export async function uploadVaultFile(file: File, category: VaultCategory, title: string): Promise<VaultItemRow> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const path = `${auth.user.id}/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('vault').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      student_id: auth.user.id,
      category,
      title: title.trim() || file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as VaultItemRow
}

export async function getVaultFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('vault').createSignedUrl(path, 60 * 60)
  if (error) return null
  return data.signedUrl
}

export async function deleteVaultItem(item: VaultItemRow) {
  if (item.file_path) await supabase.storage.from('vault').remove([item.file_path])
  const { error } = await supabase.from('vault_items').delete().eq('id', item.id)
  if (error) throw error
}

// ---------- ministry calendar ----------
// One shared events calendar for the whole ministry (Children's Day, camps,
// Christmas party, etc.) - admin-only to create/edit, everyone signed in
// can read it. Separate from the per-class Sunday School lesson-unlock
// calendar in class_sunday_unlocks, which is about individual lessons, not
// ministry-wide events.

export interface MinistryEventRow {
  id: string
  title: string
  description: string | null
  event_date: string
  created_by: string | null
  created_at: string
}

export async function listMinistryEvents(): Promise<MinistryEventRow[]> {
  const { data, error } = await supabase.from('ministry_events').select('*').order('event_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as MinistryEventRow[]
}

export async function createMinistryEvent(params: { title: string; event_date: string; description?: string }): Promise<MinistryEventRow> {
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('ministry_events')
    .insert({
      title: params.title.trim(),
      event_date: params.event_date,
      description: params.description?.trim() || null,
      created_by: auth.user?.id ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as MinistryEventRow
}

export async function updateMinistryEvent(id: string, params: { title: string; event_date: string; description?: string }) {
  const { error } = await supabase
    .from('ministry_events')
    .update({ title: params.title.trim(), event_date: params.event_date, description: params.description?.trim() || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteMinistryEvent(id: string) {
  const { error } = await supabase.from('ministry_events').delete().eq('id', id)
  if (error) throw error
}

// ---------- parent dashboard ----------
// Parents sign up on their own (normal email/password, no admin approval)
// and link to a child with a short code the child already has - see
// claim_parent_role()/link_child_by_code() in Supabase. Everything below
// reads through RLS scoped to is_parent_of_student(), so a parent only
// ever sees their own linked children's data.

export interface ChildRow extends StudentRow {
  class_name: string | null
}

/** Sets role="parent" for the signed-in account - a no-op if the role is already set, so an existing student/teacher/admin can't relabel itself. */
export async function claimParentRole() {
  const { error } = await supabase.rpc('claim_parent_role')
  if (error) throw error
}

/** Called by a STUDENT to get (or generate, first time) their own parent-link code, shown on their profile. */
export async function getOrCreateParentLinkCode(): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_parent_link_code')
  if (error) throw error
  return data as string
}

/** Called by a PARENT to link a child using the code above. */
export async function linkChildByCode(code: string): Promise<{ student_id: string; full_name: string }> {
  const { data, error } = await supabase.rpc('link_child_by_code', { p_code: code.trim() })
  if (error) throw error
  return data as { student_id: string; full_name: string }
}

export async function listMyChildren(): Promise<ChildRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data: links, error: linksError } = await supabase.from('parent_links').select('student_id').eq('parent_id', auth.user.id)
  if (linksError) throw linksError
  const ids = (links ?? []).map((l) => l.student_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('students')
    .select(
      'id, class_id, username, student_code, date_of_birth, favorite_verse, favorite_quote, bio, total_points, created_at, profiles!students_id_fkey(full_name, avatar_url), classes(name)',
    )
    .in('id', ids)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    full_name: row.profiles?.full_name ?? '',
    avatar_url: row.profiles?.avatar_url ?? null,
    class_name: row.classes?.name ?? null,
  })) as ChildRow[]
}

export async function getChildBibleStreak(studentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('compute_bible_streak', { p_student_id: studentId })
  if (error) throw error
  return (data as number) ?? 0
}

export async function listChildAchievements(studentId: string): Promise<EarnedAchievement[]> {
  const { data, error } = await supabase
    .from('student_achievements')
    .select('earned_at, achievements!inner(id, code, name, description, icon)')
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row.achievements, earned_at: row.earned_at })) as EarnedAchievement[]
}

export async function listChildAttendance(studentId: string, limit = 30): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, date, present')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AttendanceRow[]
}

export async function listChildQuizAttempts(studentId: string, sinceIso: string): Promise<{ created_at: string }[]> {
  const { data, error } = await supabase.from('quiz_attempts').select('created_at').eq('student_id', studentId).gte('created_at', sinceIso)
  if (error) throw error
  return (data ?? []) as { created_at: string }[]
}

// ---------- Bible Buddy (AI companion) ----------
// A tightly-scoped kid-facing AI, answered server-side (ai-companion edge
// function - the API key never reaches the browser). Every Q&A is logged
// for safeguarding review, with the same anonymous-identity masking as
// Ears for You: a teacher/admin never gets the real identity for an
// anonymous question through any path.

export interface AiCompanionMessageRow {
  id: string
  question: string
  answer: string
  is_anonymous: boolean
  created_at: string
}

export interface AiCompanionTeacherLogRow extends AiCompanionMessageRow {
  class_id: string | null
  student_id: string | null
  student_name: string | null
}

export async function askBibleBuddy(question: string, isAnonymous: boolean): Promise<string> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Not signed in.')

  const res = await fetch(AI_COMPANION_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question, is_anonymous: isAnonymous }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Bible Buddy could not answer that.')
  return body.answer as string
}

export async function listMyBibleBuddyHistory(): Promise<AiCompanionMessageRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from('ai_companion_messages')
    .select('id, question, answer, is_anonymous, created_at')
    .eq('student_id', auth.user.id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as AiCompanionMessageRow[]
}

/**
 * What Bible Buddy said to one child, for that child's parent.
 *
 * Questions the child chose to ask privately are not here. The policy on the
 * table drops them before this ever sees a row, so no filter is needed on
 * this side, and none could be removed to get at them either. A parent gets
 * exactly what a teacher gets, and a privately asked question stays the
 * child's own.
 */
export async function listChildBibleBuddy(studentId: string, limit = 50): Promise<AiCompanionMessageRow[]> {
  const { data, error } = await supabase
    .from('ai_companion_messages')
    .select('id, question, answer, is_anonymous, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AiCompanionMessageRow[]
}

export async function listBibleBuddyTeacherLog(limit = 50): Promise<AiCompanionTeacherLogRow[]> {
  const { data, error } = await supabase
    .from('ai_companion_teacher_log')
    .select('id, class_id, student_id, student_name, question, answer, is_anonymous, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AiCompanionTeacherLogRow[]
}
