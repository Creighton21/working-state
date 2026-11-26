import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { RecentActivity, TaskNotes, taskLink } from './Activity'
import { api, ApiError, csrfHeaders, messageFor } from './api'
import type { Session, Task } from './api'

const STATUS_LABELS = { todo: 'Todo', in_progress: 'In progress', done: 'Done' }

function taskRoute() {
  return {
    taskId: /^\/tasks\/([^/]+)\/?$/.exec(window.location.pathname)?.[1] ?? null,
    activityId: new URLSearchParams(window.location.search).get('activity'),
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
    const route = taskRoute()
    return { route, displayed: route, pointer: false }
  })
  const { taskId, activityId } = route
  const paneOpen = taskId !== null
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const modal = phone && paneOpen
  const [compose, setCompose] = useState(false)
  const [feedRevision, setFeedRevision] = useState(0)
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const newTaskButton = useRef<HTMLButtonElement>(null)
  const homeHeading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<HTMLElement>(null)
  const paneWasOpen = useRef(paneOpen)
  const pendingBack = useRef<boolean | null>(null)

  const changeRoute = useCallback((route: ReturnType<typeof taskRoute>, pointer: boolean) => {
    setView(current => ({
      route,
      displayed: route.taskId || !pointer ? route : current.displayed,
      pointer,
    }))
    if (!route.taskId) setFeedRevision(current => current + 1)
  }, [])

  useEffect(() => {
    function syncRoute() {
      changeRoute(taskRoute(), pendingBack.current ?? false)
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
    if (!paneOpen && paneWasOpen.current) {
      const source = opener.current?.isConnected ? opener.current : homeHeading.current
      source?.focus({ preventScroll: true })
      opener.current = null
    }
    paneWasOpen.current = paneOpen
  }, [paneOpen])

  function openTask(href: string, pointer = false) {
    if (taskId) window.history.replaceState(window.history.state, '', href)
    else window.history.pushState({ fromHome: true }, '', href)
    changeRoute(taskRoute(), pointer)
    setCompose(false)
  }

  function openUpdate(event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return
    event.preventDefault()
    opener.current = event.currentTarget
    openTask(event.currentTarget.pathname + event.currentTarget.search, event.detail > 0)
  }

  const closeTask = useCallback((pointer = false) => {
    if (window.history.state?.fromHome) {
      if (pendingBack.current !== null) return
      pendingBack.current = pointer
      window.history.back()
    } else {
      window.history.replaceState(null, '', '/')
      changeRoute(taskRoute(), pointer)
    }
  }, [changeRoute])

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    if (!paneOpen || !plainClick(event)) return
    event.preventDefault()
    closeTask(event.detail > 0)
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
    requestAnimationFrame(() => newTaskButton.current?.focus())
  }

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

  return (
    <div className="shell" data-task-open={paneOpen || undefined} data-pane-motion={pointer || undefined}>
      <nav className="rail" aria-label="Workspace" inert={modal}>
        <a href="/" className="brand" onClick={goHome}><BrandMark />Working State</a>
        <a href="/" className="nav-link" aria-current="page" onClick={goHome}>
          <span className="home-icon" aria-hidden="true" />Home
        </a>
        <button className="nav-link sign-out" disabled={signingOut} onClick={signOut}>Sign out</button>
        {signOutError && <p role="alert" className="form-error">{signOutError}</p>}
      </nav>
      <main className="workspace" inert={modal}>
        <div className="home-view">
          <h1 ref={homeHeading} tabIndex={-1}>Home</h1>
          {compose
            ? <CreateTask session={session} onCreate={(task, pointer) => openTask(taskLink(task.id), pointer)}
                onCancel={cancelCreate} onExpired={recheckSession} />
            : <button ref={newTaskButton} className="new-task" onClick={() => setCompose(true)}>
                <span className="plus-icon" aria-hidden="true" />New task
              </button>}
          <RecentActivity revision={feedRevision} selectedId={activityId} onOpen={openUpdate} onExpired={recheckSession} />
        </div>
      </main>
      <aside className="task-pane" inert={!paneOpen} role={modal ? 'dialog' : undefined}
        aria-modal={modal || undefined} aria-labelledby={displayed.taskId ? 'task-title' : undefined}
        onTransitionEnd={event => {
          if (event.target !== event.currentTarget || !['transform', 'opacity'].includes(event.propertyName)) return
          setView(current => current.route.taskId ? current : { ...current, displayed: current.route })
        }}
        onKeyDown={event => {
          // Back is the sole tab stop inside the full-screen task view.
          if (modal && event.key === 'Tab') {
            event.preventDefault()
            event.currentTarget.querySelector<HTMLButtonElement>('.pane-close')?.focus()
          }
        }}>
        {displayed.taskId && <TaskDetails key={displayed.taskId} taskId={displayed.taskId}
          activityId={displayed.activityId} open={paneOpen} phone={phone} onClose={closeTask}
          onExpired={recheckSession} />}
      </aside>
    </div>
  )
}

function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function CreateTask({ session, onCreate, onCancel, onExpired }: {
  session: Session
  onCreate: (task: Task, pointer: boolean) => void
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
    const values = new FormData(event.currentTarget)
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
      const task = await api<Task>('/tasks', {
        method: 'POST',
        headers: { ...csrfHeaders(session), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description.trim() ? description : null }),
      })
      onCreate(task, pointer)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onExpired()
      else setError(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form task-form" aria-label="New task" onSubmit={create} noValidate>
      <div ref={titleGroup} className="title-field">
        <label htmlFor="task-create-title">Title</label>
        <input id="task-create-title" ref={titleField} name="title" required
          aria-invalid={invalidTitle || undefined} aria-describedby={invalidTitle ? 'task-title-error' : undefined}
          onChange={event => {
            if (invalidTitle && event.currentTarget.value.trim()) setInvalidTitle(false)
          }} />
        <p id="task-title-error" className="form-error" role="alert">{invalidTitle && 'Enter a task title.'}</p>
      </div>
      <label>Description <span className="optional">(optional)</span>
        <textarea name="description" rows={3} />
      </label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="button" onClick={onCancel} type="button" disabled={busy}>Cancel</button>
        <button className="button primary" type="submit" disabled={busy}
          onClick={event => { pointerActivation.current = event.detail > 0 }}>
          {busy ? 'Creating…' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

function TaskDetails({ taskId, activityId, open, phone, onClose, onExpired }: {
  taskId: string
  activityId: string | null
  open: boolean
  phone: boolean
  onClose: (pointer: boolean) => void
  onExpired: () => void
}) {
  const [task, setTask] = useState<Task>()
  const [error, setError] = useState('')
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!open) return
    const request = new AbortController()
    api<Task>('/tasks/' + taskId, { signal: request.signal })
      .then(task => { setError(''); setTask(task) })
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
        <span className="pane-context">Standalone task</span>
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
            <p className="status"><span className={`status-icon ${task.status}`} aria-hidden="true" />{STATUS_LABELS[task.status]}</p>
            {task.description && <p className="task-description">{task.description}</p>}
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
