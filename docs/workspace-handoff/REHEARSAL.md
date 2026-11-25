# Working State handoff rehearsal

The scene adapts Stageshow’s `hero-demo` for one action. On Home, the cursor opens Codex’s latest update for **Verify staged DNS records**. The task enters from the right and the Activity entry shows the full note. The open task holds on screen. Replay returns to Home and runs the scene again.

| Host viewport | Composition |
| --- | --- |
| 1280 px | A cropped desktop window with Home still visible beside the task and a single divider across the shared charcoal surface. |
| 390 px | A phone composition with a full-width task view and an activity note that wraps within the screen. |
| 390 px with reduced motion | A still of the open task and highlighted note. |

The visual review tightened the Home row spacing and reduced the emphasis of the search field once the task opened. The phone layout gained room for the full note, and the cursor now leaves before the pane enters so the transition stays clear.

The React entry passed TypeScript checking. Headless Chrome exercised the opening sequence and Replay. The phone press close-up and reduced-motion poster passed their rehearsal gates. The desktop state and press captures reported no gated findings, with gaps in Chrome’s frame sampling that left continuous motion coverage inconclusive. Mobile review used a browser viewport. Physical-device playback remains unverified.

[Replayable preview](index.html) · [10-second video](workspace-handoff.mp4) · [Workspace design](../workspace-design.md)
