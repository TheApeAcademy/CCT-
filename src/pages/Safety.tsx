import { MessageCircle, Ear, UserCheck, Image, Lock, ShieldCheck, Database, HeartHandshake, ClipboardList } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PublicShell, { IconTile } from '../components/public/PublicShell'
import { card, cardTitle, cardText, grid } from '../components/public/kit'

// The design's six cards first, each checked against what the app really
// does, then the three guarantees the old page carried that the design did
// not, so nothing the ministry promised before is dropped.
const GUARANTEES: [string, string, LucideIcon][] = [
  ['Teacher-only messaging', 'Children can only message their own Sunday school teacher. There is no child-to-child chat and no public profile.', MessageCircle],
  ['Ears for You', 'Worries go privately to the teacher and can be sent anonymously. An anonymous message never carries the child’s name to anyone, by any path.', Ear],
  ['Approved teachers', 'Every teacher applies and is reviewed by a ministry admin before they can see children.', UserCheck],
  ['Photo review', 'Profile photos are checked by a teacher before anyone else can see them.', Image],
  ['No personal details', 'Children sign in with a name and passcode. No email or phone is needed from them.', Lock],
  ['Bible Buddy guard rails', 'The AI helper stays on Bible topics and points worried children to a trusted adult.', ShieldCheck],
  ['Rules held by the database', 'A teacher sees only their own class, an admin sees the ministry, and a child sees only their own data. Database security rules enforce this even if someone bypasses the app.', Database],
  ['Parents opt in', 'A parent account is never created for a child. A parent signs up on their own device and links using a code only the child can see and choose to share.', HeartHandshake],
  ['Sensitive actions are logged', 'When a safeguarding message is read, acknowledged, replied to or escalated, the app records who did it and when.', ClipboardList],
]

export default function Safety() {
  return (
    <PublicShell eyebrow="Safety" title="Safe by design" sub="How we keep every child safe on the platform." accent="#2fe0b5">
      <div style={grid(300)}>
        {GUARANTEES.map(([t, s, Icon]) => (
          <div key={t} style={card}>
            <IconTile col="#2fe0b5" size={46}>
              <Icon style={{ width: 22, height: 22 }} strokeWidth={2} />
            </IconTile>
            <p style={{ ...cardTitle, margin: '14px 0 0', fontSize: 20 }}>{t}</p>
            <p style={cardText}>{s}</p>
          </div>
        ))}
      </div>
      <div style={{ ...card, marginTop: 16, background: 'rgba(47,224,181,.08)', borderColor: 'rgba(47,224,181,.3)' }}>
        <p style={{ ...cardTitle, margin: 0, fontSize: 20 }}>Have a concern?</p>
        <p style={cardText}>If you ever have a safeguarding concern about a child on this platform, contact the ministry directly. Do not wait on an app feature to raise it.</p>
      </div>
    </PublicShell>
  )
}
