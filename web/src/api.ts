export interface Session {
  signedIn: boolean
  csrfHeader: string
  csrfToken: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  version: number
  activity: Note[]
}

interface Author {
  id: string
  name: string
  type: 'owner' | 'agent'
}

interface ActivityEntry {
  id: string
  taskId: string
  author: Author
  createdAt: string
}

export interface Note extends ActivityEntry {
  body: string
}

export interface RecentNote extends ActivityEntry {
  taskTitle: string
  excerpt: string
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api/v1' + path, options)
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new ApiError(response.status, error?.message ?? 'The request failed. Try again.')
  }
  return response.status === 204 ? undefined as T : response.json()
}

export function messageFor(error: unknown) {
  return error instanceof ApiError ? error.message : 'Could not reach the workspace. Try again.'
}

export function csrfHeaders(session: Session) {
  return { [session.csrfHeader]: session.csrfToken }
}
