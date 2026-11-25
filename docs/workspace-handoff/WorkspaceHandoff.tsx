import { ChevronRight, Folder, Home, ListTodo, Search, X } from 'lucide-react'
import { Stage } from '../../.agents/skills/stageshow/kit/stage'
import { Bar, Window } from '../../.agents/skills/stageshow/kit/window'
import { Phone } from '../../.agents/skills/stageshow/kit/phone'
import { Row } from '../../.agents/skills/stageshow/kit/parts/Row'
import { Avatar } from '../../.agents/skills/stageshow/kit/parts/Avatar'
import { Field } from '../../.agents/skills/stageshow/kit/controls/Field'
import type { Act } from '../../.agents/skills/stageshow/kit'
import './workspace.css'

type Scene = { detail: boolean; note: boolean; cursorAway: boolean }
const initial: Scene = { detail: false, note: false, cursorAway: true }
const poster: Scene = { detail: true, note: true, cursorAway: true }
const rest = { wide: { x: 706, y: 114 }, compact: { x: 286, y: 93 } }
const taskTitle = 'Verify staged DNS records'
const author = 'Codex'
const update = 'A and CNAME records match the export.'
const nextStep = 'MX and TXT still need a second pass.'

async function handoff(a: Act<Scene>) {
  await a.wait(1300)
  await a.set({ cursorAway: false })
  const row = a.rect('update')
  await a.move({ x: row.x + row.width - 25, y: row.y + row.height / 2 })
  await a.wait(390)
  a.mark('press')
  await a.click()
  await a.set({ cursorAway: true })
  await a.wait(105)
  a.mark('open')
  await a.set({ detail: true })
  await a.wait(580)
  a.mark('note')
  await a.set({ note: true })
  await a.wait(6200)
}

function HomeView({ selected, compact }: { selected: boolean; compact: boolean }) {
  const avatarSize = compact ? 34 : 26
  return (
    <div className="ws-home">
      <div className="ws-home-title">Find your work</div>
      <Field value="" placeholder="Search tasks and efforts" className="ws-search" leading={<Search size={15} strokeWidth={1.6} />} />
      <div className="ws-section-label">Latest updates</div>
      <div className="ws-updates">
        <Row
          data-target="update" data-cursor="hand" selected={selected} pad={10}
          lead={<Avatar name={author} tone="ink" size={avatarSize} />}
          title={taskTitle}
          subtitle={author + ' · ' + (compact ? 'A and CNAME records match' : update)}
          meta={<time>9:42 AM</time>}
        >
          <ChevronRight className="ws-arrow" size={13} strokeWidth={1.6} />
        </Row>
        <Row pad={10} lead={<Avatar name="Pi" tone="ink" size={avatarSize} />} title="Verify restored files" subtitle={<Bar w={167} h={6} tone={2} />} />
        <Row pad={10} lead={<Avatar plain size={avatarSize} />} title={<Bar w={89} h={7} tone={3} />} subtitle={<Bar w={142} h={6} tone={2} />} />
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <div className="ws-rail">
      <Row pad={8} lead={<Home size={14} strokeWidth={1.6} />} title="Home" selected />
      <Row pad={8} lead={<ListTodo size={14} strokeWidth={1.6} />} title="Standalone" />
      <div className="ws-side-effort"><Row pad={8} lead={<Folder size={14} strokeWidth={1.6} />} title="DNS migration" /></div>
      <Row pad={8} lead={<Folder size={14} strokeWidth={1.6} />} title={<Bar w={71} h={6} tone={2} />} />
    </div>
  )
}

function TaskPane({ compact, detail, note }: Pick<Scene, 'detail' | 'note'> & { compact: boolean }) {
  return (
    <div className="ws-pane-track" aria-hidden={!detail}>
      <div className="ws-pane">
        <div className="ws-context"><span>DNS migration</span><span className="ws-close"><X size={14} strokeWidth={1.6} /></span></div>
        <div className="ws-task-title">{taskTitle}</div>
        <div className="ws-status"><i aria-hidden />In progress</div>
        <p className="ws-description">Compare the staged records with the registrar export.</p>
        <div className="ws-activity">
          <div className="ws-section-label">Activity</div>
          <Row
            className="ws-note" data-lit={note || undefined}
            pad={10} lead={<Avatar name={author} size={compact ? 36 : 24} tone="ink" />}
            title={author} meta={<time>9:42 AM</time>}
            subtitle={update + ' ' + nextStep}
          />
        </div>
      </div>
    </div>
  )
}

function WorkSurface({ state, compact }: { state: Scene; compact: boolean }) {
  return (
    <div className="ws-shared-surface" data-open={state.detail || undefined} data-cursor-away={state.cursorAway || undefined}>
      <HomeView selected={state.detail} compact={compact} />
      <TaskPane {...state} compact={compact} />
    </div>
  )
}

export function WorkspaceHandoff() {
  return (
    <Stage<Scene>
      width={960} height={436}
      compact={{ below: 690, width: 358, height: 410 }}
      theme="dark" palette="mono" fidelity="standard"
      initial={initial} poster={poster} play="once" script={handoff}
      cursor={{ at: rest, idle: 1100 }}
      className="ws"
      tokens={{
        '--ss-surface': '#202123', '--ss-chrome': '#202123', '--ss-well': '#1b1c1e',
        '--ss-line': 'rgb(233 235 238 / 16%)', '--ss-line-faint': 'rgb(233 235 238 / 11%)',
        '--ss-text-strong': '#f1f1ef', '--ss-text': '#d5d6d8', '--ss-text-faint': '#b2b4b8',
        '--ss-font': '"Helvetica Neue", Arial, sans-serif', '--ss-accent': '#b8b9bb',
      }}
    >
      {(state, _, layout) => layout === 'compact' ? (
        <Phone width={326} dark className="ws-phone" wallpaper="linear-gradient(145deg, #2d2f31, #171819 64%)">
          <div className="ws-mobile-bar"><span>Working State</span></div>
          <WorkSurface state={state} compact />
        </Phone>
      ) : (
        <Window title="Working State" className="ws-window" lights="grey">
          <div className="ws-workspace">
            <Sidebar />
            <WorkSurface state={state} compact={false} />
          </div>
        </Window>
      )}
    </Stage>
  )
}
