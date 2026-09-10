// Data layer for the Children's Ministry platform: teacher applications,
// classes/roster, student profiles, leaderboard, messaging, and Ears for You.
// Thin wrappers over Supabase so the pages stay focused on UI.
import { supabase, JOIN_CLASS_FUNCTION_URL, STUDENT_REGISTER_FUNCTION_URL } from './supabase'

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

export interface StudentRow {
  id: string
  class_id: string | null
  username: string
  date_of_birth: string | null
  favorite_verse: string | null
  favorite_quote: string | null
  bio: string | null
  total_points: number
  created_at: string
  full_name: string
  avatar_url: string | null
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
    .select('id, class_id, username, date_of_birth, favorite_verse, favorite_quote, bio, total_points, created_at, profiles!inner(full_name, avatar_url)')
    .eq('class_id', classId)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    full_name: row.profiles?.full_name ?? '',
    avatar_url: row.profiles?.avatar_url ?? null,
  })) as StudentRow[]
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
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: body.email, password: params.passcode })
  if (signInError) throw signInError
  return body as { email: string; student_id: string; student_code: string }
}

export async function studentSignInByCode(params: { student_code: string; passcode: string }) {
  const { data: email, error } = await supabase.rpc('get_student_login_email_by_code', { p_code: params.student_code.trim() })
  if (error) throw error
  if (!email) throw new Error("We couldn't find that Student Code. Double check it and try again.")
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: params.passcode })
  if (signInError) throw new Error('Wrong passcode. Try again, or ask your teacher to help.')
}

// ---------- student self-service ----------

export async function getMyStudentProfile(): Promise<StudentRow | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase
    .from('students')
    .select('id, class_id, username, date_of_birth, favorite_verse, favorite_quote, bio, total_points, created_at, profiles!inner(full_name, avatar_url)')
    .eq('id', auth.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as any
  return { ...row, full_name: row.profiles?.full_name ?? '', avatar_url: row.profiles?.avatar_url ?? null } as StudentRow
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

export async function getMyClass(): Promise<(ClassRow & { teacher_name: string }) | null> {
  const student = await getMyStudentProfile()
  if (!student?.class_id) return null
  const { data, error } = await supabase.from('classes').select('*, profiles!classes_teacher_id_fkey(full_name)').eq('id', student.class_id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as any
  return { ...row, teacher_name: row.profiles?.full_name ?? '' }
}

// ---------- leaderboard ----------

export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.from('leaderboard').select('*').limit(limit)
  if (error) throw error
  return (data ?? []) as LeaderboardRow[]
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
    .select('id, teacher_id, student_id, teacher:profiles!conversations_teacher_id_fkey(full_name, avatar_url), student:students!inner(profiles!inner(full_name, avatar_url))')
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
    .select('*, students!inner(profiles!inner(full_name))')
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
