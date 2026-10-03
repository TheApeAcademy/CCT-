import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Users, HeartHandshake, ShieldCheck, Lock, type LucideIcon } from 'lucide-react'
import { SHOWCASE_GROUPS, COMING_SOON } from '../content/featureShowcase'
import { showcaseIcon } from '../content/showcaseIcons'
import { playClick } from '../lib/sound'
import PublicShell, { IconTile } from '../components/public/PublicShell'
import { card, display, grid } from '../components/public/kit'

// The design's eight picture cards. Each one only links where a visitor who
// is not signed in can actually go: the children's features open the child
// sign-up, the rest their own public door.
const PICTURES: [string, string, string, string, string][] = [
  ['Kids Village', 'A playful map where every building is a feature.', '/village/home-brickbuilding.png', '/join', '#c13bff'],
  ['Bible Journey', 'Duolingo-style lessons through Genesis.', '/village/bible-book.png', '/join', '#ff8a3d'],
  ['Live Quiz Show', 'The big-screen quiz with teams and lifelines.', '/feature-quiz.png', '/setup', '#ffd84d'],
  ['Games', 'Live matches, practice and mini games.', '/village/game-rocket.png', '/training', '#ff4fa3'],
  ['Ears for You', 'A safe place to share worries with a teacher.', '/village/ears-hearttree.png', '/join', '#4f7bff'],
  ['Digital ID Card', 'A shareable card for every child.', '/village/profile-card.png', '/join', '#b56bd9'],
  ['Teacher Portal', 'Classes, lectures, assignments and quiz hosting.', '/village/class-house1.png', '/teacher', '#19c99b'],
  ['Leaderboard', 'Points for every quiz answer, reading and assignment.', '/feature-leaderboard.png', '/join', '#e0a400'],
]

const GROUP_COLOUR: Record<string, string> = { children: '#c13bff', teachers: '#19c99b', admins: '#ffd84d', parents: '#4f9bff' }

export default function Features() {
  return (
    <PublicShell eyebrow="Features" title="Everything inside" sub="All the ways children, parents and teachers use the app." accent="#ff8a3d">
      <div style={grid(260)}>
        {PICTURES.map(([t, s, img, to, col]) => (
          <Link key={t} to={to} onClick={() => playClick()} className="pb-lift" style={{ ['--pb-col' as string]: col, display: 'flex', flexDirection: 'column', gap: 12, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}>
            <img src={img} alt="" style={{ height: 80, alignSelf: 'flex-start', objectFit: 'contain', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.4))' }} />
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 21 }}>{t}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(236,230,250,.7)' }}>{s}</span>
          </Link>
        ))}
      </div>

      {SHOWCASE_GROUPS.map((group) => {
        const col = GROUP_COLOUR[group.key] ?? '#ffd84d'
        return (
          <section key={group.key} style={{ marginTop: 64 }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: col }}>{group.eyebrow}</span>
            <h2 style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>{group.title}</h2>
            <p style={{ margin: '12px 0 0', maxWidth: 640, fontSize: 16, lineHeight: 1.6 }}>{group.intro}</p>
            {group.cta && (
              <Link to={group.cta.to} onClick={() => playClick()} style={{ display: 'inline-flex', marginTop: 18, padding: '12px 22px', borderRadius: 999, background: col, color: '#1a0f2e', fontWeight: 800, fontSize: 14 }}>
                {group.cta.label}
              </Link>
            )}
            <div style={{ ...grid(280), marginTop: 22 }}>
              {group.features.map((f) => {
                const Icon = showcaseIcon(f.icon)
                const inner = (
                  <>
                    <IconTile col={col} size={44}>
                      <Icon style={{ width: 22, height: 22 }} strokeWidth={2} />
                    </IconTile>
                    <p style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 19, color: '#fff' }}>{f.title}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55 }}>{f.description}</p>
                    {f.to ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 800, color: col }}>
                        Open it <ArrowRight style={{ width: 12, height: 12 }} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 700, color: 'rgba(236,230,250,.5)' }}>
                        <Lock style={{ width: 12, height: 12 }} strokeWidth={2.25} /> {f.where}
                      </span>
                    )}
                  </>
                )
                return f.to ? (
                  <Link key={f.title} to={f.to} onClick={() => playClick()} className="pb-lift" style={{ ...card, ['--pb-col' as string]: col, display: 'block', padding: 22, color: 'inherit' }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={f.title} style={{ ...card, padding: 22 }}>
                    {inner}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section style={{ marginTop: 64 }}>
        <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ff8a3d' }}>Not built yet</span>
        <h2 style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>Still on the way</h2>
        <p style={{ margin: '12px 0 0', maxWidth: 640, fontSize: 16, lineHeight: 1.6 }}>These are real plans, not marketing. They are listed here so nothing above has to be vague.</p>
        <div style={{ ...grid(260), marginTop: 22 }}>
          {COMING_SOON.map((c) => {
            const Icon = showcaseIcon(c.icon)
            return (
              <div key={c.title} style={{ ...card, padding: 22, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.22)' }}>
                <IconTile col="#ffffff" size={40}>
                  <Icon style={{ width: 18, height: 18 }} strokeWidth={2} />
                </IconTile>
                <p style={{ margin: '12px 0 0', fontFamily: display, fontWeight: 800, fontSize: 18, color: '#fff' }}>{c.title}</p>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55 }}>{c.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ marginTop: 64, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>Which one are you?</h2>
        <p style={{ margin: '12px auto 0', maxWidth: 480, fontSize: 16, lineHeight: 1.6 }}>Each portal is its own separate way in, with its own sign-in.</p>
        <div style={{ ...grid(220), marginTop: 22 }}>
          <DoorLink to="/join" icon={Sparkles} label="I'm a Child" sub="Sign up with a name and a passcode" col="#c13bff" />
          <DoorLink to="/teacher" icon={Users} label="I'm a Teacher" sub="Apply to teach a Sunday School class" col="#19c99b" />
          <DoorLink to="/parent" icon={HeartHandshake} label="I'm a Parent" sub="Follow your child's progress" col="#4f9bff" />
          <DoorLink to="/admin" icon={ShieldCheck} label="I'm an Admin" sub="Oversee the whole ministry" col="#ffd84d" />
        </div>
      </section>
    </PublicShell>
  )
}

function DoorLink({ to, icon: Icon, label, sub, col }: { to: string; icon: LucideIcon; label: string; sub: string; col: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="pb-lift" style={{ ...card, ['--pb-col' as string]: col, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 22, color: '#fff' }}>
      <IconTile col={col} size={46}>
        <Icon style={{ width: 22, height: 22 }} strokeWidth={2} />
      </IconTile>
      <span style={{ fontFamily: display, fontWeight: 800, fontSize: 18 }}>{label}</span>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(236,230,250,.6)' }}>{sub}</span>
    </Link>
  )
}
