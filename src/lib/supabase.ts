import { createClient } from '@supabase/supabase-js'

// Publishable key, safe to ship in client code by design (Row Level
// Security on the backend is what actually protects the data). Used only
// by the Ask & Share section, everything else in the app stays offline.
const SUPABASE_URL = 'https://gtnnzhphexfjblujspmr.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Taveh-bi8TllfNTNKcx6uw_l9i_8Uao'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export interface QaSubmission {
  id: string
  created_at: string
  message: string
  status: 'new' | 'answered'
  answer: string | null
  answered_at: string | null
}

export interface QaSubmissionFull extends QaSubmission {
  is_anonymous: boolean
  display_name: string | null
  contact_note: string | null
}

function randomToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const CLAIM_TOKENS_KEY = 'cct-qa-claim-tokens'

export function getMyClaimTokens(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_TOKENS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveClaimToken(token: string) {
  const tokens = getMyClaimTokens()
  tokens.unshift(token)
  localStorage.setItem(CLAIM_TOKENS_KEY, JSON.stringify(tokens.slice(0, 20)))
}

export async function submitQuestion(params: { message: string; isAnonymous: boolean; displayName?: string; contactNote?: string }) {
  const claimToken = randomToken()
  const { error } = await supabase.from('church_qa_submissions').insert({
    message: params.message,
    is_anonymous: params.isAnonymous,
    display_name: params.isAnonymous ? null : params.displayName?.trim() || null,
    contact_note: params.isAnonymous ? null : params.contactNote?.trim() || null,
    claim_token: claimToken,
  })
  if (error) throw error
  saveClaimToken(claimToken)
  return claimToken
}

export async function fetchMySubmission(token: string): Promise<QaSubmission | null> {
  const { data, error } = await supabase.rpc('church_qa_get_my_submission', { p_token: token })
  if (error) throw error
  return data?.[0] ?? null
}

export async function fetchMyTeacherApproval(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('teacher_profiles').select('approved').eq('id', userId).single()
  if (error) throw error
  return data?.approved ?? false
}
