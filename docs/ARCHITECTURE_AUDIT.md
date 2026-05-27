# DrawVision Architecture Audit

## Current Finding

The current prototype already contains useful CAD foundation code.

## Existing Useful Files

| File | Observed Role |
|---|---|
| js/app.js | UI, viewport, input handling, rendering orchestration |
| js/geometry.js | generic geometry helpers |
| js/wall-geometry.js | wall command validation and wall body derivation |
| js/state.js | app state, tools, menus, undo stack, settings |

## Strengths

- There is already wall-specific geometry logic.
- wall.create-style validation exists in js/wall-geometry.js.
- State object already includes undoStack.
- UI already supports drawing and view modes.
- Documentation and agent folders now exist.

## Architecture Problems

- app.js appears to mix UI, input, rendering, command handling, and model logic.
- State is centralized but not yet clearly separated into scene graph, UI state, and command history.
- wall.create exists as geometry logic but may not yet be connected to a formal command executor.
- There may be duplicated schema files at root and schemas/.
- Units are currently feet-based in UI state, while new architecture wants millimeters.
- No clear command execution pipeline is confirmed yet.
- No confirmed scene graph abstraction yet.
- No confirmed serialization contract for parametric objects yet.

## Keep

- js/wall-geometry.js wall validation and derived geometry logic.
- js/geometry.js helper functions.
- Existing UI prototype as temporary viewport.
- state.undoStack as starting point for undo/redo.
- Existing tests if passing.

## Refactor Toward

User intent
→ Planner Agent
→ CAD command JSON
→ command executor
→ validation
→ geometry creation
→ scene graph insertion
→ viewport render
→ serialization

## Immediate Next Step

Create a command executor that calls existing wall geometry functions instead of creating new parallel wall logic.

## Do Not Do Yet

- Do not rewrite the UI.
- Do not add more agents.
- Do not build kitchen/bathroom/cabinet modules before wall.create is integrated end-to-end.
- Do not replace existing wall-geometry.js unless tests prove it is wrong.

