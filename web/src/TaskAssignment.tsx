import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { taskLink } from './Activity'
import { api, ApiError, csrfHeaders, messageFor } from './api'
import type { EffortSummary, Session, Task } from './api'
import { useWorkspaceData } from './WorkspaceLists'

export function TaskAssignment({ task, session, open, onUpdated, onExpired, onOpenPage }: {
  task: Task
  session: Session
  open: boolean
  onUpdated: (task: Task) => void
  onExpired: () => void
  onOpenPage: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const { data: efforts, error: loadError, retry } = useWorkspaceData<EffortSummary[]>(open ? '/efforts' : null, 0, onExpired)
  const [effortId, setEffortId] = useState('')
  const [pending, setPending] = useState<'move' | 'refresh' | null>(null)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const refreshButton = useRef<HTMLButtonElement>(null)
  const path = taskLink(task.id)

  useEffect(() => {
    if (open && conflict && !pending) refreshButton.current?.focus()
  }, [conflict, open, pending])

  async function update(operation: 'move' | 'refresh') {
    setPending(operation)
    setError('')
    try {
      const updated = operation === 'refresh' ? await api<Task>(path) : await api<Task>(path + '/effort', {
        method: 'PATCH',
        headers: { ...csrfHeaders(session), 'Content-Type': 'application/json' },
        body: JSON.stringify({ effortId, expectedVersion: task.version }),
      })
      setConflict(false)
      onUpdated(updated)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onExpired()
      else {
        if (error instanceof ApiError && error.status === 409) setConflict(true)
        setError(messageFor(error))
      }
    } finally {
      setPending(null)
    }
  }

  function move(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (effortId && !conflict && !pending) void update('move')
  }

  if (loadError) return (
    <div className="task-assignment feed-error">
      <p role="alert">{loadError}</p>
      <button className="button" onClick={retry}>Try again</button>
    </div>
  )
  if (!efforts) return <p className="task-assignment empty" role="status">Loading efforts…</p>
  if (!efforts.length) return (
    <p className="task-assignment empty"><a className="text-link" href="/efforts" onClick={onOpenPage}>Create an effort</a> to move this task.</p>
  )

  return (
    <form className="form task-assignment" onSubmit={move}>
      <label htmlFor="assignment-effort">Move to effort</label>
      <div className="assignment-controls">
        <select id="assignment-effort" value={effortId} disabled={pending !== null || conflict}
          onChange={event => setEffortId(event.currentTarget.value)}>
          <option value="" disabled>Choose an effort</option>
          {efforts.map(effort => <option key={effort.id} value={effort.id}>{effort.title}</option>)}
        </select>
        <button type="submit" className="button" disabled={!effortId || conflict} aria-disabled={pending !== null || undefined}>
          {pending === 'move' ? 'Moving…' : 'Move task'}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {conflict && <button ref={refreshButton} type="button" className="button assignment-refresh"
        aria-disabled={pending !== null || undefined} onClick={() => { if (!pending) void update('refresh') }}>
        {pending === 'refresh' ? 'Refreshing…' : 'Refresh task'}
      </button>}
    </form>
  )
}
