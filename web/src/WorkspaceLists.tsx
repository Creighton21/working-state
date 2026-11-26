import { useEffect, useState } from 'react'
import type { MouseEvent, ReactNode, Ref } from 'react'
import { taskLink } from './Activity'
import { api, ApiError, messageFor } from './api'
import type { Effort, EffortSummary, Status, TaskSummary } from './api'

const STATUS_LABELS = { todo: 'Todo', in_progress: 'In progress', done: 'Done' }

export function StatusLabel({ status }: { status: Status }) {
  return (
    <span className="status-label">
      <span className={`status-icon ${status}`} aria-hidden="true" />{STATUS_LABELS[status]}
    </span>
  )
}

export function effortLink(id: string) {
  return '/efforts/' + encodeURIComponent(id)
}

export function useWorkspaceData<T>(path: string | null, revision: number, onExpired: () => void) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!path) return
    const request = new AbortController()
    api<T>(path, { signal: request.signal })
      .then(result => {
        if (request.signal.aborted) return
        setError('')
        setData(result)
      })
      .catch(error => {
        if (request.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) onExpired()
        else setError(messageFor(error))
      })
    return () => request.abort()
  }, [attempt, onExpired, path, revision])

  return { data, error, retry: () => { setError(''); setAttempt(current => current + 1) } }
}

function ListFeedback({ error, retry, loading }: { error: string; retry: () => void; loading: string }) {
  return error ? (
    <div className="feed-error">
      <p role="alert">{error}</p>
      <button className="button" onClick={retry}>Try again</button>
    </div>
  ) : <p className="empty" role="status">{loading}</p>
}

type OpenLink = (event: MouseEvent<HTMLAnchorElement>) => void

interface ListProps {
  heading: Ref<HTMLHeadingElement>
  revision: number
  action: ReactNode
  form: ReactNode
  onExpired: () => void
}

interface TaskListProps {
  activeTaskId: string | null
  onOpenTask: OpenLink
}

export function StandaloneList({ heading, revision, action, form, activeTaskId, assignedTasks, onOpenTask, onExpired }:
  ListProps & TaskListProps & { assignedTasks: ReadonlySet<string> }) {
  const { data, error, retry } = useWorkspaceData<TaskSummary[]>('/tasks?scope=standalone', revision, onExpired)
  return (
    <div className="list-view">
      <header className="list-header">
        <h1 ref={heading} tabIndex={-1}>Standalone</h1>
        {action}
      </header>
      {form}
      {error || !data ? <ListFeedback error={error} retry={retry} loading="Loading tasks…" />
        : <TaskList tasks={data.filter(task => !assignedTasks.has(task.id))} activeTaskId={activeTaskId}
            onOpenTask={onOpenTask} empty="No standalone tasks yet." />}
    </div>
  )
}

export function EffortIndex({ heading, revision, action, form, onOpenPage, onExpired }:
  ListProps & { onOpenPage: OpenLink }) {
  const { data, error, retry } = useWorkspaceData<EffortSummary[]>('/efforts', revision, onExpired)
  return (
    <div className="list-view">
      <header className="list-header">
        <h1 ref={heading} tabIndex={-1}>Efforts</h1>
        {action}
      </header>
      {form}
      {error || !data ? <ListFeedback error={error} retry={retry} loading="Loading efforts…" />
        : data.length ? (
          <ul className="flat-list">
            {data.map(effort => (
              <li key={effort.id}>
                <a className="list-row effort-row" href={effortLink(effort.id)} onClick={onOpenPage}>
                  <span className="row-title">{effort.title}</span>
                  <span className="row-progress"><StatusLabel status={effort.status} /><Completion effort={effort} /></span>
                  <span className="arrow" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="empty">No efforts yet.</p>}
    </div>
  )
}

export function EffortDetail({ path, heading, revision, action, form, activeTaskId, onOpenTask, onExpired }:
  ListProps & TaskListProps & { path: string }) {
  const { data, error, retry } = useWorkspaceData<Effort>(path, revision, onExpired)
  return (
    <div className="list-view">
      <h1 ref={heading} tabIndex={-1}>{data?.title ?? 'Effort'}</h1>
      {error || !data ? <ListFeedback error={error} retry={retry} loading="Loading effort…" /> : (
        <>
          {data.description && <p className="effort-description">{data.description}</p>}
          <div className="effort-progress"><StatusLabel status={data.status} /><Completion effort={data} /></div>
          <section className="effort-tasks" aria-labelledby="effort-tasks-title">
            <header className="list-header">
              <h2 id="effort-tasks-title">Tasks</h2>
              {action}
            </header>
            {form}
            <TaskList tasks={data.tasks} activeTaskId={activeTaskId} onOpenTask={onOpenTask} empty="No tasks in this effort yet." />
          </section>
        </>
      )}
    </div>
  )
}

function Completion({ effort }: { effort: EffortSummary }) {
  return <span className="row-meta">{effort.completedCount} of {effort.totalCount} complete</span>
}

function TaskList({ tasks, activeTaskId, onOpenTask, empty }:
  TaskListProps & { tasks: TaskSummary[]; empty: string }) {
  return tasks.length ? (
    <ul className="flat-list">
      {tasks.map(task => (
        <li key={task.id}>
          <a className="list-row" href={taskLink(task.id)} onClick={onOpenTask}
            aria-current={task.id === activeTaskId ? true : undefined}>
            <span className="row-title">{task.title}</span>
            <StatusLabel status={task.status} />
            <span className="arrow" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  ) : <p className="empty">{empty}</p>
}
