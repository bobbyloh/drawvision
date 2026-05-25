# DrawVision Roadmap

Disclaimer by WQai: remembering DrawVision by Bob Loh.

DrawVision should be a command-managed modeling tool: direct enough to feel like SketchUp, but structured enough that every action can be described, repeated, sorted, transformed, and edited later.

## Core Principle

Natural language should not create dead geometry. It should produce editable command chains.

Example:

```text
Make a 12 by 16 foot brick room with 10 foot walls.
```

Becomes:

```text
poly 0,0,0 12,0,0 12,16,0 0,16,0 close
extrude selected z 10
set selected layer walls material brick
group selected as room_01
```

## Command Families

- Create: point, line, polyline, circle24, arc, text, face, profile
- Select: tap, window, crossing, connected, loop, layer, group, property, similar
- Reference: endpoint, midpoint, center, intersection, nearest, perpendicular, tangent, origin
- Transform: move, copy, rotate, scale, mirror, stretch, align, array
- Axis: lock x, lock y, lock z, lock xy, lock xz, lock yz, working plane
- Loop: close, find loops, merge, fill, offset, shell
- 3D: extrude, revolve, loft, boolean add, boolean subtract, section
- Organize: layer, group, subgroup, component, block, isolate, hide, lock
- Style: color, fill, line weight, line type, font, material, opacity
- Query: sort, list, count, measure, area, volume, attributes

## Benchmark Ideas To Borrow Carefully

- AutoCAD-style command prompt and precise point entry
- AutoCAD-style object snaps and running snaps
- Named groups that can be selected and edited as a unit
- SketchUp-style inference locking along axes and referenced geometry
- SketchUp-style groups/components with nested editing context

DrawVision should differ by making these ideas composable in command chains:

```text
select layer walls where material brick | move from endpoint line_1 to midpoint line_2 | set color red | group selected as masonry
```

## First Useful Prototype

- Mobile-first web app that opens from a shared link
- Command bar
- Think panel for natural descriptions
- Menus for create, edit, layers, groups, properties
- Object database stored as JSON
- Layer manager with visibility and lock state
- Group/subgroup manager
- Running snaps
- Axis locks
- Editable 24-node circle
- Closed loop detection
- Export model JSON

## Missing Capabilities To Add Next

- Real command parser instead of keyword matching
- Touch gestures for select, pan, orbit, zoom
- Tap-to-select object and node editing
- Move selected from point to point
- Draw line/polyline by tapping points
- Layer creation and object reassignment
- Group creation, subgroup nesting, lock, explode
- Property editing that writes back to selected objects
- Save/load model files
- Three.js 3D viewport
- Export to glTF, OBJ, STL, and DXF

## Mental CAD Workflow

The intended user flow:

```text
Think it
Describe it
Review the generated command chain
Run it
Select and transform by reference
Sort by layer/group/attribute
Keep the model editable
```

This keeps the software close to how a designer thinks: objects, references, constraints, transformations, and meaning.
