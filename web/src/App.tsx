import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { RecentActivity, TaskNotes, taskLink } from './Activity'
import { TaskAssignment } from './TaskAssignment'
import { EffortDetail, EffortIndex, StandaloneList, StatusLabel, effortLink, useWorkspaceData } from './WorkspaceLists'
import { api, ApiError, csrfHeaders, messageFor } from './api'
import type { Effort, Session, Task } from './api'

function workspaceRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const taskId = /^\/tasks\/([^/]+)$/.exec(path)?.[1] ?? null
  const history = window.history.state
  const origin = taskId ? history?.taskOrigin : path
  return {
    pagePath: typeof origin === 'string' && /^\/(standalone|efforts(?:\/[^/]+)?)$/.test(origin) ? origin : '/',
    taskId,
    activityId: new URLSearchParams(window.location.search).get('activity'),
    openerHref: taskId && typeof history?.taskOpener === 'string' ? history.taskOpener : null,
  }
}

export function App() {
  const [session, setSession] = useState<Session>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const reloadSession = useCallback(() => {
    setSession(undefined)
    setError('')
    setAttempt(current => current + 1)
  }, [])

  useEffect(() => {
    const request = new AbortController()
    api<Session>('/session', { signal: request.signal })
      .then(setSession)
      .catch(error => {
        if (!request.signal.aborted) setError(messageFor(error))
      })
    return () => request.abort()
  }, [attempt])

  if (!session) {
    return (
      <main className="entry">
        <div className="entry-surface">
          <h1>Working State</h1>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button className="button" onClick={reloadSession}>Try again</button>
            </>
          ) : <p role="status">Connecting to the workspace…</p>}
        </div>
      </main>
    )
  }

  return session.signedIn
    ? <Workspace session={session} recheckSession={reloadSession} />
    : <SignIn session={session} onSuccess={setSession} />
}

function SignIn({ session, onSuccess }: { session: Session; onSuccess: (session: Session) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const body = new URLSearchParams({
      username: String(values.get('username')),
      password: String(values.get('password')),
    })
    setBusy(true)
    setError('')
    try {
      // A successful login rotates the token, so read the authenticated session before rendering the workspace.
      await api<void>('/session', { method: 'POST', headers: csrfHeaders(session), body })
      const next = await api<Session>('/session')
      if (!next.signedIn) throw new ApiError(401, 'The session cookie was unavailable. Open the HTTPS workspace URL and try again.')
      onSuccess(next)
    } catch (error) {
      setError(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="entry">
      <div className="entry-surface">
        <div className="brand"><BrandMark />Working State</div>
        <h1>Sign in</h1>
        <form className="form" onSubmit={signIn}>
          <label>Username
            <input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
          </label>
          <label>Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error && <p role="alert" className="form-error">{error}</p>}
          <button className="button primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </main>
  )
}

function Workspace({ session, recheckSession }: { session: Session; recheckSession: () => void }) {
  const [{ route, displayed, pointer }, setView] = useState(() => {
    const route = workspaceRoute()
    return { route, displayed: route, pointer: false }
  })
  const { pagePath, taskId, activityId } = route
  const onHome = pagePath === '/'
  const onStandalone = pagePath === '/standalone'
  const onEfforts = !onHome && !onStandalone
  const onEffortIndex = pagePath === '/efforts'
  const effortId = onEfforts && !onEffortIndex ? pagePath.slice('/efforts/'.length) : undefined
  const paneOpen = taskId !== null
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const modal = phone && paneOpen
  const [compose, setCompose] = useState(false)
  const [revision, setRevision] = useState(0)
  const [assignedTasks, setAssignedTasks] = useState<ReadonlySet<string>>(() => new Set())
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const newItemButton = useRef<HTMLButtonElement>(null)
  const pageHeading = useRef<HTMLHeadingElement>(null)
  const workspace = useRef<HTMLElement>(null)
  const previousRoute = useRef(route)
  const pendingBack = useRef<boolean | null>(null)

  const changeRoute = useCallback((route: ReturnType<typeof workspaceRoute>, pointer: boolean) => {
    setView(current => ({
      route,
      displayed: route.taskId || !pointer ? route : current.displayed,
      pointer,
    }))
    if (!route.taskId) setRevision(current => current + 1)
    setCompose(false)
  }, [])

  useEffect(() => {
    function syncRoute() {
      changeRoute(workspaceRoute(), pendingBack.current ?? false)
      pendingBack.current = null
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [changeRoute])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)')
    function onChange() { setPhone(query.matches) }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    const previous = previousRoute.current
    if (previous.pagePath !== pagePath) {
      workspace.current?.scrollTo(0, 0)
      if (!paneOpen) pageHeading.current?.focus({ preventScroll: true })
    } else if (!paneOpen && previous.taskId) {
      const links = workspace.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? []
      const opener = Array.from(links).find(link => link.getAttribute('href') === previous.openerHref)
      const target = opener ?? pageHeading.current
      target?.focus({ preventScroll: true })
    }
    previousRoute.current = route
  }, [pagePath, paneOpen, route])

  function openTask(href: string, pointer = false, fromLink = false) {
    const taskOpener = fromLink ? href : null
    if (taskId) window.history.replaceState({ ...window.history.state, taskOpener }, '', href)
    else window.history.pushState({ taskOrigin: pagePath, taskOpener }, '', href)
    changeRoute(workspaceRoute(), pointer)
  }

  function openTaskLink(event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return
    event.preventDefault()
    openTask(event.currentTarget.pathname + event.currentTarget.search, event.detail > 0, true)
  }

  const closeTask = useCallback((pointer = false) => {
    if (window.history.state?.taskOrigin) {
      if (pendingBack.current !== null) return
      pendingBack.current = pointer
      window.history.back()
    } else {
      window.history.replaceState(null, '', '/')
      changeRoute(workspaceRoute(), pointer)
    }
  }, [changeRoute])

  function navigate(href: string) {
    window.history.pushState(null, '', href)
    changeRoute(workspaceRoute(), false)
  }

  function openPage(event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return
    event.preventDefault()
    const href = event.currentTarget.pathname
    if (href !== pagePath) navigate(href)
    else if (paneOpen) closeTask(event.detail > 0)
  }

  useEffect(() => {
    if (!paneOpen) return
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) closeTask()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [paneOpen, closeTask])

  function cancelCreate() {
    setCompose(false)
    requestAnimationFrame(() => newItemButton.current?.focus())
  }

  const refreshLists = useCallback((task: Task) => {
    if (task.effortId) setAssignedTasks(current => new Set(current).add(task.id))
    setRevision(current => current + 1)
  }, [])

  async function signOut() {
    setSigningOut(true)
    setSignOutError('')
    try {
      await api<void>('/session/logout', { method: 'POST', headers: csrfHeaders(session) })
      recheckSession()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) recheckSession()
      else setSignOutError(messageFor(error))
    } finally {
      setSigningOut(false)
    }
  }

  const kind = onEffortIndex ? 'effort' : 'task'
  const createButton = !compose && (
    <button ref={newItemButton} className={onHome ? 'new-task' : 'button list-action'} onClick={() => setCompose(true)}>
      <span className="plus-icon" aria-hidden="true" />New {kind}
    </button>
  )
  const createForm = compose && (
    <CreateItem kind={kind} effortId={effortId} session={session}
      onCreate={(id, pointer) => {
        if (kind === 'effort') navigate(effortLink(id))
        else {
          setRevision(current => current + 1)
          openTask(taskLink(id), pointer)
        }
      }}
      onCancel={cancelCreate} onExpired={recheckSession} />
  )
  const listProps = {
    heading: pageHeading, revision, action: createButton, form: createForm, onExpired: recheckSession,
  }

  return (
    <div className="shell" data-task-open={paneOpen || undefined} data-pane-motion={pointer || undefined}>
      <nav className="rail" aria-label="Workspace" inert={modal}>
        <a href="/" className="brand" onClick={openPage}><BrandMark />Working State</a>
        <div className="rail-links">
          <a href="/" className="nav-link" aria-current={onHome ? 'page' : undefined} onClick={openPage}>
            <span className="nav-icon home-icon" aria-hidden="true" />Home
          </a>
          <a href="/standalone" className="nav-link" aria-current={onStandalone ? 'page' : undefined} onClick={openPage}>
            <span className="nav-icon standalone-icon" aria-hidden="true" />Standalone
          </a>
          <a href="/efforts" className="nav-link" aria-current={onEffortIndex ? 'page' : onEfforts ? 'location' : undefined}
            onClick={openPage}>
            <span className="nav-icon efforts-icon" aria-hidden="true" />Efforts
          </a>
        </div>
        <button className="nav-link sign-out" disabled={signingOut} onClick={signOut}>Sign out</button>
        {signOutError && <p role="alert" className="form-error">{signOutError}</p>}
      </nav>
      <main className="workspace" ref={workspace} inert={modal}>
        {onHome ? <div className="home-view">
          <h1 ref={pageHeading} tabIndex={-1}>Home</h1>
          {createButton}
          {createForm}
          <RecentActivity revision={revision} selectedId={activityId} onOpen={openTaskLink} onExpired={recheckSession} />
        </div> : onStandalone
          ? <StandaloneList {...listProps} assignedTasks={assignedTasks} activeTaskId={taskId} onOpenTask={openTaskLink} />
          : onEffortIndex ? <EffortIndex {...listProps} onOpenPage={openPage} />
          : <EffortDetail key={pagePath} path={pagePath} {...listProps} activeTaskId={taskId} onOpenTask={openTaskLink} />}
      </main>
      <aside className="task-pane" inert={!paneOpen} role={modal ? 'dialog' : undefined}
        aria-modal={modal || undefined} aria-labelledby={displayed.taskId ? 'task-title' : undefined}
        onTransitionEnd={event => {
          if (event.target !== event.currentTarget || !['transform', 'opacity'].includes(event.propertyName)) return
          setView(current => current.route.taskId ? current : { ...current, displayed: current.route })
        }}
        onKeyDown={modal ? keepFocusInPane : undefined}>
        {displayed.taskId && <TaskDetails key={displayed.taskId} taskId={displayed.taskId}
          activityId={displayed.activityId} open={paneOpen} phone={phone} session={session}
          onClose={closeTask} onOpenPage={openPage} onUpdated={refreshLists} onExpired={recheckSession} />}
      </aside>
    </div>
  )
}

function keepFocusInPane(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return
  const tabs = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, select')]
    .filter(element => !element.matches(':disabled'))
  if (!tabs.length) return
  const active = document.activeElement
  const edge = event.shiftKey ? tabs[0] : tabs[tabs.length - 1]
  const beyond = event.shiftKey ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING
  if (!active || !event.currentTarget.contains(active) || active === edge ||
      (edge.compareDocumentPosition(active) & beyond)) {
    event.preventDefault()
    const target = event.shiftKey ? tabs[tabs.length - 1] : tabs[0]
    target.focus()
  }
}

function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function CreateItem({ kind, effortId, session, onCreate, onCancel, onExpired }: {
  kind: 'task' | 'effort'
  effortId?: string
  session: Session
  onCreate: (id: string, pointer: boolean) => void
  onCancel: () => void
  onExpired: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invalidTitle, setInvalidTitle] = useState(false)
  const titleGroup = useRef<HTMLDivElement>(null)
  const titleField = useRef<HTMLInputElement>(null)
  const pointerActivation = useRef(false)

  useEffect(() => titleField.current?.focus(), [])

  useLayoutEffect(() => {
    if (invalidTitle) titleGroup.current?.scrollIntoView({ block: 'nearest' })
  }, [invalidTitle])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const title = String(values.get('title'))
    setError('')
    if (!title.trim()) {
      setInvalidTitle(true)
      titleField.current?.focus()
      return
    }

    const description = String(values.get('description'))
    const pointer = pointerActivation.current
    setInvalidTitle(false)
    setBusy(true)
    try {
      const item = await api<{ id: string }>('/' + kind + 's', {
        method: 'POST',
        headers: { ...csrfHeaders(session), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description.trim() ? description : null, effortId }),
      })
      if (form.isConnected) onCreate(item.id, pointer)
    } catch (error) {
      if (!form.isConnected) return
      if (error instanceof ApiError && error.status === 401) onExpired()
      else setError(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form task-form" aria-label={`New ${kind}`} onSubmit={create} noValidate>
      <div ref={titleGroup} className="title-field">
        <label htmlFor={kind + '-create-title'}>Title</label>
        <input id={kind + '-create-title'} ref={titleField} name="title" required
          aria-invalid={invalidTitle || undefined} aria-describedby={invalidTitle ? kind + '-title-error' : undefined}
          onChange={event => {
            if (invalidTitle && event.currentTarget.value.trim()) setInvalidTitle(false)
          }} />
        <p id={kind + '-title-error'} className="form-error" role="alert">
          {invalidTitle && (kind === 'effort' ? 'Enter an effort title.' : 'Enter a task title.')}
        </p>
      </div>
      <label>Description <span className="optional">(optional)</span>
        <textarea name="description" rows={3} />
      </label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="button" onClick={onCancel} type="button" disabled={busy}>Cancel</button>
        <button className="button primary" type="submit" disabled={busy}
          onClick={event => { pointerActivation.current = event.detail > 0 }}>
          {busy ? 'Creating…' : `Create ${kind}`}
        </button>
      </div>
    </form>
  )
}

function TaskDetails({ taskId, activityId, open, phone, session, onClose, onOpenPage, onUpdated, onExpired }: {
  taskId: string
  activityId: string | null
  open: boolean
  phone: boolean
  session: Session
  onClose: (pointer: boolean) => void
  onOpenPage: (event: MouseEvent<HTMLAnchorElement>) => void
  onUpdated: (task: Task) => void
  onExpired: () => void
}) {
  const [task, setTask] = useState<Task>()
  const [error, setError] = useState('')
  const title = useRef<HTMLHeadingElement>(null)
  const effortPath = task?.effortId ? effortLink(task.effortId) : null
  const { data: effort } = useWorkspaceData<Effort>(open ? effortPath : null, 0, onExpired)

  useEffect(() => {
    if (!open) return
    const request = new AbortController()
    api<Task>('/tasks/' + taskId, { signal: request.signal })
      .then(task => {
        if (request.signal.aborted) return
        setError('')
        setTask(task)
      })
      .catch(error => {
        if (request.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) onExpired()
        else setError(messageFor(error))
      })
    return () => request.abort()
  }, [taskId, onExpired, open])

  useEffect(() => {
    if (open) title.current?.focus({ preventScroll: true })
  }, [task, activityId, error, open, phone])

  return (
    <>
      <header className="pane-bar">
        {effortPath
          ? <a className="pane-context pane-context-link" href={effortPath} onClick={onOpenPage}>{effort?.title ?? 'Effort'}</a>
          : <span className="pane-context">{task && 'Standalone task'}</span>}
        <button className="pane-close" type="button" aria-label={phone ? 'Back' : 'Close task'}
          onClick={event => onClose(event.detail > 0)}>
          <span className="close-icon" aria-hidden="true" />
          <span className="back-label" aria-hidden="true">Back</span>
        </button>
      </header>
      <div className="pane-content">
        <h2 className="task-title" id="task-title" ref={title} tabIndex={-1}>{task?.title ?? 'Task'}</h2>
        {task ? (
          <>
            <p className="status"><StatusLabel status={task.status} /></p>
            {task.description && <p className="task-description">{task.description}</p>}
            {!task.effortId && <TaskAssignment task={task} session={session} open={open}
              onUpdated={updated => { setTask(updated); onUpdated(updated) }} onExpired={onExpired}
              onOpenPage={onOpenPage} />}
            <TaskNotes notes={task.activity} selectedId={activityId} />
          </>
        ) : error ? <p role="alert" className="form-error">{error}</p> : <p role="status">Loading task…</p>}
      </div>
    </>
  )
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true" />
}
