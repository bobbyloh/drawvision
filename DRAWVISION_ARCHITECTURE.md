# DrawVision Architecture

DrawVision is an AI-native architectural design tool built around deterministic CAD commands. The product direction is not an agent swarm and not a chatbot-first editor. AI interprets intent and proposes structured work; deterministic code owns geometry, validation, scene mutation, rendering, undo, serialization, and reload.

## Vision

DrawVision should become the most useful architectural design tool possible under limited resources by making the project model reliable before expanding presentation, BIM depth, or autonomous workflows.

The core product surface is a validated command pipeline:

```text
User intent
-> Planner Agent
-> task graph
-> Geometry / Module / Retrieval agents
-> Validation Agent
-> structured CAD commands
-> geometry kernel
-> scene graph
-> viewport renderer
-> serialization
```

Phase 1 does not build agents. It builds the deterministic command system, scene graph, `wall.create`, serialization, and undo/redo. Agents are added only after the command path is stable.

## Lean Agent Architecture

DrawVision has five core agents and one later agent:

- Planner Agent: interprets user intent, creates task graphs, chooses modules, and sequences work. It must not generate final geometry directly.
- Geometry Agent: converts approved tasks into structured CAD command JSON for walls, slabs, openings, rooms, and object transforms. It must not mutate the viewport or scene graph.
- Validation Agent: validates schema, geometry, closure, collisions, clearances, workflow, and service dependencies. AI output never bypasses it.
- Retrieval Agent: retrieves project documents, PDFs, standards, catalogs, material references, and previous design rules. It must not produce geometry.
- Module Agent: handles higher-level architectural modules such as cabinets, kitchens, bathrooms, furniture, hospitality suites, and service connections. It outputs module-level CAD commands only.
- Presentation Agent: later phase only, for rendering views, annotations, diagrams, PPT/export workflows, and investor presentation packaging.

The agent boundary is intentionally coarse. There is no agent per object, no autonomous swarm, and no direct AI write path.

## Deterministic Core

These systems are deterministic code:

- geometry kernel
- snapping
- object IDs
- command execution
- scene graph mutation
- validation
- collision detection
- undo/redo
- serialization and reload
- viewport rendering

AI agents only propose structured commands. Commands become persistent model changes only after schema and model validation.

## Command Layer

The command layer is the only public write API for model state.

Responsibilities:

- accept JSON command input
- validate against `CAD_COMMAND_SCHEMA.json`
- normalize defaults and units
- reject unsafe or ambiguous commands
- dispatch approved commands to deterministic handlers
- create undoable transactions
- return structured results and failures

Mouse tools, typed commands, inspector edits, file imports, AI output, and MCP tools all produce the same command objects.

## Geometry Ownership

Canonical geometry belongs to the geometry kernel and domain modules. The renderer never owns geometry truth.

Target model shape:

```json
{
  "schema": "drawvision.project",
  "version": 1,
  "units": "mm",
  "geometry": {
    "walls": {},
    "openings": {},
    "rooms": {},
    "slabs": {},
    "ceilings": {},
    "zones": {},
    "cabinets": {},
    "services": {},
    "objects": {}
  },
  "sceneGraph": {
    "nodes": {},
    "drawOrder": []
  },
  "selection": [],
  "transactions": []
}
```

Current prototype conflict: `js/app.js` directly pushes, edits, deletes, renders, selects, saves, and reloads `state.objects`. That array currently mixes canonical geometry, render styling, selection targets, and entity metadata. The first refactor should introduce a command executor and scene graph while keeping the existing UI running.

## Scene Graph Ownership

The scene graph stores renderable nodes derived from canonical objects. It can cache footprints, bounds, labels, material references, selection state, and draw order. It must preserve links back to canonical geometry IDs.

Scene graph mutation happens only as a result of accepted commands. Pointer previews and hover state may exist in UI state, but they are not persistent scene graph data.

## Validation Requirements

Validation is mandatory and atomic. Failed commands cause:

- no geometry mutation
- no scene graph mutation
- no selection mutation
- no undo transaction
- no dirty flag change
- no serialization write

Validation includes schema checks, units, ID uniqueness/existence, material and layer checks, object topology, wall length, room closure, collision checks, cabinet clearances, bathroom clearances, kitchen workflow, and service dependencies.

## Module System

Modules are deterministic domain packages. They register object types, command handlers, validation rules, serialization shape, and future MCP contracts.

Initial practical modules:

- Core Room Module
- Cabinet Module
- Kitchen Module
- Bathroom Module
- Furniture Module
- Service Connection Module
- Hospitality Suite Module
- Rendering Module
- Presentation Export Module

Modules do not bypass the command executor and do not mutate the viewport directly.

## MCP Role

MCP is the connected-services/tool layer. It is not the core CAD engine and not a privileged mutation path.

MCP servers may retrieve files, run external analysis, search catalogs, estimate cost, render snapshots, or package presentations. Writes still submit JSON CAD commands and receive command results. MCP must not directly patch geometry, scene graph, files, DOM, or viewport state.

Future servers are contract-first:

- `filesystem_mcp`
- `geometry_mcp`
- `rendering_mcp`
- `hospitality_mcp`
- `product_catalog_mcp`
- `cost_estimation_mcp`
- `presentation_mcp`

## Resource Strategy

Phase 1: No agents. Build command system, scene graph, `wall.create`, serialization, undo/redo.

Phase 2: Add Planner Agent only.

Phase 3: Add Geometry Agent and Validation Agent.

Phase 4: Add Retrieval Agent.

Phase 5: Add Module Agent for cabinets, kitchens, bathrooms, furniture, and service connections.

Phase 6: Add Presentation Agent for rendering and PPT/export.

## First Practical Target

Build `wall.create` end to end:

- JSON command input
- schema validation
- unique object ID
- geometry creation
- scene graph insertion
- viewport render
- object selection
- parameter editing path
- undo/redo registration
- serialization
- reload from saved file

## Second Practical Target

Build `cabinet.create` as the first parametric module object:

- type
- width, depth, height
- position and orientation
- material
- clearance zone
- service requirement
- parent wall
- parent room
- serialization
- selection
- editing

## Third Practical Target

Build the Service Connection Module:

- `water_supply`
- `waste_pipe`
- `electrical_point`
- `lighting_point`
- `switch_point`
- `exhaust_point`
- `gas_point`
- `data_point`

Service dependencies block invalid generated layouts. For example, `sink_base` requires `water_supply` and `waste_pipe`; `hob_base` requires `electrical_point` or `gas_point` plus `exhaust_point`.
