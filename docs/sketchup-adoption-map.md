# DrawVision SketchUp-Style Adoption Map

DrawVision should adopt SketchUp's interaction principles only where they improve Bob's command-driven CAD workflow. The goal is not a clone. The goal is a fast architectural command environment with familiar mouse, shortcut, measurement, tray, and context behavior.

## Adopted UI Principles

- Top menu exposes the command tree: File, Edit, View, Draw, Model, Tools, Export, Window.
- Left toolbar activates core tools without replacing the command prompt.
- Center drawing area remains the primary modeling space.
- Right tray shows entity info, layers, and scenes/views.
- Status area gives active tool hints and modifier reminders.
- Measurements box accepts precise numeric input while a tool is active.
- Right-click opens entity-specific properties and edit actions.
- Mouse wheel zoom and navigation do not cancel the active drawing tool.

## Command-Prompt Conditioning

The command prompt remains authoritative. SketchUp-style tools are mapped into DrawVision's grammar:

- `line`, `input line .`, then repeated `.` continues chained line creation.
- `gen cir seg 36`, then radius input in Measurements creates exact circles.
- `distance from . to .` uses the same two-pick pattern as line and move.
- `extrude selected z 10` maps to Push/Pull behavior.
- `rep n 3 x`, `3x`, `3*`, and `3/` map to external/internal array behavior.
- `sv axon`, `sv plan`, `sv nelev`, `va`, and `view all 3d` map to scene/view behavior.
- `show nodes all`, `F`, and `G` support inference-like node and grid snaps.

## Shortcut Strategy

DrawVision keeps Bob's remembered keys where they conflict with SketchUp:

- `.` is graphic pick, not a typed period.
- `,` places a node at the current snapped cursor point.
- `F` toggles nearest-node snap.
- `G` toggles grid/intersection snap.
- `X`, `Y`, `Z` constrain the next point to an axis.
- `-` backtraces the current step.

SketchUp-compatible shortcuts are added where they do not damage Bob's grammar:

- `Space` select mode.
- `L` line.
- `C` circle.
- `M` move.
- `T` text / measure according to current DrawVision mapping.
- `O` orbit/axon view.
- `H` pan hint.
- `Shift+Z` zoom extents.

## Measurements Box Rules

- A plain number is interpreted as feet.
- Suffixes are supported: `'`, `"`, `in`, `mm`, `cm`, `m`.
- During line creation, a length creates the next segment in the current cursor direction.
- During circle creation, a length becomes the radius.
- During move, a length moves selected geometry from the base point toward the cursor direction.
- Array inputs: `3x`, `3*`, `3/`.

## Not Yet Adopted

- Full inference engine with edge, face, midpoint, perpendicular, tangent, and parallel inference.
- True orbit camera matrix and perspective projection.
- Push/Pull face topology editing.
- Component definitions with live instance propagation.
- Materials, texture positioning, shadows, terrain, and dynamic components.
- Full import/export pipeline for DWG/DXF/STL/OBJ/IFC.

## Implementation Priority

1. Make command chaining reliable.
2. Make snaps and axes predictable.
3. Make measurements precise.
4. Make entity properties relational-database backed.
5. Add true model topology: vertices, edges, faces, groups, components.
6. Add AI prompt automation on top of stable commands, not before.
