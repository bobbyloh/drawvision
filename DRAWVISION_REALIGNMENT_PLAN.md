# DrawVision Realignment Plan

This diagnosis and plan realigns DrawVision around a lean agent architecture and a modular architectural engine. It is written before large code changes by design.

## 1. Current Architecture Diagnosis

DrawVision is currently a compact vanilla browser app centered on `index.html`, `styles.css`, `js/state.js`, and `js/app.js`.

Current shape:

- `js/app.js` owns UI wiring, command parsing, rendering, persistence, selection, undo, pointer tools, snapping, and most model mutation.
- `js/state.js` exports one mutable global state object containing project metadata, settings, environment, UI state, undo stack, layers, materials, selection, and render/model objects.
- `state.objects` is the practical model store, scene graph, render payload, and selection target list.
- `js/geometry.js` has useful pure helpers, but similar transform and geometry logic is duplicated inside `js/app.js`.
- `js/wall-geometry.js` is the strongest architectural starting point because it already accepts structured `wall.create` commands and returns validated parametric wall geometry.
- `js/wall-geometry.test.js` already covers straight walls, finish layers, openings, invalid openings, and arc walls.
- Save/load serializes the current UI-shaped snapshot to browser local storage or downloaded JSON.
- Undo stores full object snapshots, not command transactions.
- Rendering reads mutable `state.objects` directly and writes SVG strings.

The app is useful as a prototype, but it is not yet a deterministic CAD command engine.

## 2. Conflicts With The New Plan

- `executeCommand(raw)` is a monolithic string parser and mutation dispatcher.
- Pointer tools directly create primitive `line`, `poly`, `circle`, and `text` objects.
- `state.objects` mixes canonical geometry, scene graph data, styling, metadata, and selection targets.
- Existing line objects are not parametric walls.
- Units are feet-oriented in UI state (`gridFeet`, `pxPerFoot`, foot labels), while the target model uses millimeters.
- IDs are timestamp-derived in multiple places instead of centrally generated.
- Undo is snapshot-based and not auditable by command transaction.
- Serialization saves prototype state, not a versioned project schema with `geometry` and `sceneGraph`.
- The AI assistant UI implies AI as a panel feature; the target treats AI as a proposed-command producer.
- MCP is documentation-only today and must remain a connected-services layer, not core CAD logic.

## 3. Proposed Folder Structure

```text
drawvision/
  CAD_COMMAND_SCHEMA.json
  DRAWVISION_ARCHITECTURE.md
  AGENTS.md
  GEOMETRY_RULES.md
  MODULE_SYSTEM.md
  MCP_SERVERS.md
  DRAWVISION_REALIGNMENT_PLAN.md
  js/
    app.js
    state.js
    geometry.js
    wall-geometry.js
    command/
      executor.js
      schema-validator.js
      transactions.js
      id-factory.js
    model/
      project.js
      geometry-store.js
      scene-graph.js
      serialization.js
      migration.js
    modules/
      core-room/
        wall-commands.js
        opening-commands.js
        room-detect.js
      cabinet/
        cabinet-commands.js
        cabinet-geometry.js
        cabinet-validation.js
      services/
        service-commands.js
        service-validation.js
      kitchen/
        kitchen-generate.js
      bathroom/
        bathroom-generate.js
      furniture/
        furniture-commands.js
      hospitality/
        suite-generate.js
    renderer/
      render-snapshot.js
      svg-renderer.js
      viewport.js
    ui/
      command-line.js
      pointer-tools.js
      inspector.js
      trays.js
```

Keep this as plain ES modules for now. TypeScript can wait until command/model boundaries are stable.

## 4. Document Updates

Completed documentation alignment:

- `DRAWVISION_ARCHITECTURE.md`: lean AI-native CAD architecture, deterministic core, MCP role, command flow, geometry ownership, scene graph ownership, validation, modules, phases.
- `AGENTS.md`: Planner, Geometry, Validation, Retrieval, Module, and later Presentation Agent definitions.
- `CAD_COMMAND_SCHEMA.json`: lean schema covering the requested command groups.
- `MODULE_SYSTEM.md`: practical architectural modules only.
- `GEOMETRY_RULES.md`: millimeter units, coordinates, IDs, wall topology, joining, snapping, room closure, clearances, kitchen/bathroom/service rules, validation failure behavior.
- `MCP_SERVERS.md`: future MCP server contracts without implementing servers.

## 5. Phased Implementation Plan

Phase 1: No agents.

- create command executor
- create schema validator
- create central ID factory
- create transaction undo/redo model
- create project model with geometry and scene graph
- implement `wall.create` end to end
- serialize and reload the new project format

Phase 2: Planner Agent only.

- Planner interprets intent and emits task graphs
- Planner does not generate final geometry
- Planner output is reviewed before command generation

Phase 3: Geometry Agent and Validation Agent.

- Geometry Agent emits structured CAD command JSON
- Validation Agent validates every proposed command batch
- AI output cannot bypass deterministic validation

Phase 4: Retrieval Agent.

- retrieve project docs, standards, PDFs, catalogs, and prior rules
- feed grounded context to Planner and Module Agent

Phase 5: Module Agent.

- add cabinets, kitchens, bathrooms, furniture, and service connections
- keep module output as structured CAD commands

Phase 6: Presentation Agent.

- rendering views
- annotations
- diagrams
- PPT/export packaging
- only after command and geometry infrastructure are stable

## 6. Files To Create First

Implementation files:

- `js/command/id-factory.js`
- `js/command/schema-validator.js`
- `js/command/transactions.js`
- `js/command/executor.js`
- `js/model/project.js`
- `js/model/geometry-store.js`
- `js/model/scene-graph.js`
- `js/model/serialization.js`
- `js/model/migration.js`
- `js/modules/core-room/wall-commands.js`
- `js/renderer/render-snapshot.js`

Keep `js/app.js` working during the transition. Initially it should call the new executor for JSON `wall.create` while legacy drawing remains available.

## 7. First Code Milestone: `wall.create`

Acceptance command:

```json
{
  "cmd": "wall.create",
  "start": [0, 0, 0],
  "end": [5000, 0, 0],
  "height": 3200,
  "thickness": 200,
  "material": "default_wall"
}
```

Required behavior:

- command line accepts JSON command input
- schema validation runs first
- model validation checks material, layer, ID uniqueness, and path validity
- omitted ID is generated centrally
- `createWallGeometry` creates canonical wall geometry
- wall inserts into `project.geometry.walls`
- scene graph node inserts into `project.sceneGraph.nodes`
- new wall is selected by default
- transaction records created/selected IDs and before/after deltas
- viewport renders the wall from scene graph data
- project serializes canonical geometry and scene graph
- reload restores wall ID, geometry, scene node, material, units, and selection
- undo removes the wall and redo restores it

Focused tests:

- valid wall creates canonical geometry and scene node
- omitted ID is stable and unique
- duplicate ID fails atomically
- zero-length wall fails atomically
- missing material fails atomically
- save/load preserves wall and selection
- undo/redo round trip works

## 8. Second Code Milestone: `cabinet.create`

Acceptance command:

```json
{
  "cmd": "cabinet.create",
  "type": "base_cabinet",
  "width": 600,
  "depth": 560,
  "height": 850,
  "position": [0, 0, 0],
  "orientation": 90,
  "material": "timber_veneer",
  "clearanceZone": 900,
  "serviceRequirement": []
}
```

Required behavior:

- schema and model validation
- supported cabinet type registry
- positive dimensions
- canonical cabinet object
- derived footprint/body
- derived clearance zone
- optional parent wall and parent room links
- service requirement declaration
- scene graph node
- selection
- transaction registration
- serialization and reload
- inspector editing through a future `cabinet.modify`

Focused tests:

- valid base cabinet creates canonical object and scene node
- all supported cabinet types validate
- invalid type fails
- negative dimensions fail atomically
- clearance zone derives and serializes
- `sink_base` declares water and waste dependencies
- `hob_base` declares electrical-or-gas and exhaust dependencies

## 9. Keeping The Agent System Lean

- Build zero agents in Phase 1.
- Add only Planner Agent in Phase 2.
- Keep Geometry Agent limited to command JSON.
- Keep Module Agent coarse-grained; do not create agents for walls, cabinets, doors, or fixtures.
- Keep Retrieval Agent read-only and grounded in documents/catalogs.
- Keep Validation Agent mandatory and separate from generation.
- Keep Presentation Agent out of the product until command execution, geometry, validation, serialization, and modules are stable.
- Measure every agent by whether it reduces human work without weakening deterministic model ownership.
