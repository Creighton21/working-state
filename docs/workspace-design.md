# Working State workspace design

Working State opens on a quiet workspace for finding a task or catching up on recent work. Home gives search and updates the focus. An effort gives most of the workspace to its task list, with task details available alongside it on desktop.

[Interactive prototype](workspace-prototype.html) · [PNG preview](workspace-prototype.png) · [Animated handoff demo](workspace-handoff/index.html)

## Home

- Center a single search field in the workspace. Group matches into **Efforts** and **Tasks**. An effort result navigates to its page. A task result opens its details from the current view.
- Show the three latest updates below search. Each row shows the task title, author, time, and a one-line excerpt. Opening an update opens its task and highlights the matching note or log in Activity.
- Keep desktop navigation compact, with Home, Standalone, and the effort list. Search also finds efforts on a phone.

## Effort page

- Start with the effort title, description, and task completion count. The task list is the largest working area and stays visible next to task details when there is room to dock the pane.
- Place **Latest updates** above the task list. Show up to two updates for the effort by default, with a disclosure to collapse the section. The prototype remembers that choice per effort for the current browser session.
- Place **Recent tasks** below the list. Keep it collapsed by default and show the last task opened in its summary when available. Expanding it exposes up to three recently opened tasks from the effort.

## Task details

The pane shows the task’s effort or standalone context, title, status, description, and activity. Each activity entry shows its author, time, and type. Closing the pane returns to the originating view so work can continue from the same list or search.

| Viewport | Prototype behavior |
| --- | --- |
| At least 950 px | Dock the pane on the right and keep the task list beside it. |
| 721–949 px | Open the pane over the right side of the workspace. |
| 720 px and below | Open a full-screen task view with a Back control. |

Pointer activation slides the pane in from the right. Keyboard activation is immediate, and reduced motion replaces the slide with a short fade.

## Dark glass

Use translucent charcoal over a soft monochrome backdrop. Use blur on the navigation rail and search field, with off-white type and neutral gray selection. Reserve muted amber for the **In progress** mark. Status also has a visible label and a distinct symbol.

The docked task pane and main workspace share one continuous glass surface. A single 1 px vertical divider marks the boundary, and the window outline wraps both regions. Reduced-transparency and higher-contrast preferences use solid surfaces.

## Design review path

1. Open Home and search for **DNS migration**. Choose the effort result.
2. Open its latest update and confirm the matching note is highlighted alongside the task list.
3. Close the task, collapse **Latest updates**, and expand **Recent tasks** to find the task again.
4. Repeat on a phone and use Back to return to the effort.

The interactive prototype uses sample data. The client, API, and agent integration are described in the product brief. [Task app v1 design](v1-design.md)
