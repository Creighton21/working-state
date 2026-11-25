import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceHandoff } from './WorkspaceHandoff'

function Demo() {
  const [replay, setReplay] = useState(0)
  return (
    <>
      <div id="handoff" aria-label="Working State demo of opening a task from an agent update">
        <WorkspaceHandoff key={replay} />
      </div>
      <button className="ws-replay" onClick={() => setReplay(value => value + 1)}>Replay demo</button>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Demo />)
