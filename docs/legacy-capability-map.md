# DrawVision Legacy Capability Map

Purpose: capture Bob Loh's remembered DrawVision / HOK-era workflow so the new DrawVision is rebuilt around the correct mental model.

## Core Principle

The system should behave like a command-driven architectural drawing/modeling environment:

- 1:1 real-world drawing scale.
- Architectural units first, not arbitrary pixels.
- Command prompt always available.
- `.` means graphic selector / mouse pick token.
- Mouse picks define points: `from . to .`, `in . out .`, center/radius, source/destination.
- `F` toggles nearest-node snap.
- `G` toggles grid/intersection snap.
- Keyboard axis constraints with `X`, `Y`, `Z`.
- Tool operations should be repeatable, scriptable, and editable.

## Remembered Commands And Workflows

### Input Geometry

- `input line`
- `line from . to .`
- `input poly`
- `poly from . to .`
- `input text`
- `gen cir .`
- `gen cir seg 36`
- circle qualifiers: radius / diameter

### Selection

- point select
- `in . out .` window selection
- crossing / out selection
- select by line, poly, layer, type

### Editing

- `move poly from . to .`
- `repeat poly from . to . copy x`
- `rep n`
- repeat defaults to X axis unless Y/Z is specified
- rotate X/Y/Z, default X axis
- delete line by point
- delete poly by point
- merge line to 0
- flatten 3D geometry
- `extrude selected z height`
- extrude closed poly / circle / face into 3D mass
- keep source footprint editable after extrusion

### Viewing

- plan = top view
- `NELEV` = north elevation
- `sv 3d` = set virtual screen view to 3D
- `sv axon` = set virtual screen view to axon
- `sv nelev` = set virtual screen view to north elevation
- axon / 3D view
- N / S / E / W views

### Measurement

- `measure dist from . to .`
- `distance from . to .`
- measurements box should report exact feet/inches.

## Implementation Direction

Organize code by capability:

- `environment`: units, scale, grid, snap.
- `elements`: line, poly, circle, text, face, group.
- `tools`: select, line, poly, circle, text, move, repeat, measure, delete, flatten.
- `views`: plan, elevations, axon.
- `command`: parser, history, command aliases.
- `ui`: toolbar, tray, command prompt, measurements.

## Open Memory Questions

- What did the original menu structure look like?
- Was `copy x` count-based, distance-based, or repeated until boundary?
- How were layers/classes named?
- Did text have style tables?
- Did line/poly tools have close/undo/back options?
- Was Z height stored per element or per operation?
