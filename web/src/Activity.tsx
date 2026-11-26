import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { api, ApiError, messageFor } from './api'
import type { Note, RecentNote } from './api'

const timeFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const fullTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'medium' })

export function taskLink(taskId: string, activityId?: string) {
  const path = '/tasks/' + encodeURIComponent(taskId)
  return activityId ? path + '?' + new URLSearchParams({ activity: activityId }) : path
}

export function RecentActivity({ revision, selectedId, onOpen, onExpired }: {
  revision: number
  selectedId: string | null
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void
  onExpired: () => void
}) {
  const [notes, setNotes] = useState<RecentNote[]>()
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const request = new AbortController()
    api<RecentNote[]>('/activity?limit=3', { signal: request.signal })
      .then(result => {
        setError('')
        setNotes(result)
      })
      .catch(error => {
        if (request.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) onExpired()
        else setError(messageFor(error))
      })
    return () => request.abort()
  }, [onExpired, retry, revision])

  return (
    <section className="home-feed" aria-labelledby="latest-title">
      <h2 id="latest-title">Latest updates</h2>
      {error ? (
        <div className="feed-error">
          <p role="alert">{error}</p>
          <button className="button" onClick={() => { setError(''); setRetry(current => current + 1) }}>Try again</button>
        </div>
      ) : !notes ? <p className="empty" role="status">Loading updates…</p>
        : notes.length ? (
          <ul className="flat-list">
            {notes.map(note => (
              <li key={note.id}>
                <a className="update-row" href={taskLink(note.taskId, note.id)} onClick={onOpen}
                  aria-current={note.id === selectedId ? true : undefined}>
                  <Avatar name={note.author.name} />
                  <div>
                    <span className="row-title">{note.taskTitle}</span>
                    <span className="row-meta update-meta">
                      <span className="update-author" title={note.author.name}>{note.author.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="update-preview">{note.excerpt}</span>
                    </span>
                  </div>
                  <NoteTime dateTime={note.createdAt} />
                  <span className="arrow" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="empty">No work notes yet.</p>}
    </section>
  )
}

export function TaskNotes({ notes, selectedId }: { notes: Note[]; selectedId: string | null }) {
  const selected = useRef<HTMLLIElement>(null)
  useLayoutEffect(() => {
    selected.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [notes, selectedId])

  return (
    <section className="activity" aria-labelledby="activity-title">
      <h3 id="activity-title">Activity</h3>
      {notes.length ? (
        <ul className="flat-list">
          {notes.map(note => (
            <li className="note" key={note.id} id={'note-' + note.id}
              aria-current={note.id === selectedId ? true : undefined}
              ref={note.id === selectedId ? selected : undefined}>
              <Avatar name={note.author.name} />
              <div>
                <div className="note-meta">
                  <strong>{note.author.name}</strong>
                  <span className="row-meta">Work note</span>
                  <NoteTime dateTime={note.createdAt} />
                </div>
                <p>{note.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty">No work notes yet.</p>}
    </section>
  )
}

function Avatar({ name }: { name: string }) {
  return <span className="avatar" aria-hidden="true">{Array.from(name)[0]?.toLocaleUpperCase()}</span>
}

function NoteTime({ dateTime }: { dateTime: string }) {
  const date = new Date(dateTime)
  return <time className="stamp" dateTime={dateTime} title={fullTimeFormat.format(date)}>{timeFormat.format(date)}</time>
}
