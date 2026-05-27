# Code Tightening Roadmap

DrawVision must become a professional interior architecture CAD system for the AI era. The codebase should move from prototype sketching toward a deterministic, testable, parametric design engine.

The goal is not to add more UI first. The goal is to make the model trustworthy enough that architects, interior designers, hospitality planners, and AI agents can all work through the same command and validation pipeline.

## Product Standard

Professional interior architecture requires:

- real dimensions in millimeters
- stable object IDs
- editable parametric objects
- wall, room, opening, cabinet, service, furniture, kitchen, bathroom, and hospitality intelligence
- lighting, wiring, electrical, exhaust, and mechanical coordination intelligence
- wall paneling, furnishing layout, ceiling treatment, concealed lighting, features, accessibility, and serviceability coordination
- clear ownership of geometry truth
- deterministic undo/redo
- project files that reload exactly
- AI proposals that are reviewable commands, not hidden mutations
- validation failures that protect the model

Every feature should answer this question:

> Does this make the project model more reliable, more editable, or more useful to a professional designer?

If not, defer it.

## Current Code Risks

The current browser prototype has useful pieces, but it is too loose for professional CAD work.

Main risks:

- `js/app.js` does too much: UI, commands, rendering, mutation, undo, save/load, and object editing.
- `state.objects` is overloaded as geometry model, scene graph, render style, and selection target.
- string commands mutate state directly without schema validation.
- units are still feet-oriented in the UI while the new model direction requires millimeters.
- undo stores object snapshots, not command transactions.
- save/load preserves prototype state, not a professional project model.
- pointer tools create dumb primitives instead of structured commands.
- parametric interiors objects are not yet first-class.

## Tightening Principles

1. Commands are the only mutation API.
2. Geometry kernel owns geometry truth.
3. Scene graph owns renderable relationships.
4. UI is an intent producer and renderer only.
5. AI proposes commands; it does not edit state.
6. Objects are parametric first, renderable second.
7. Validation happens before mutation.
8. Undo/redo stores transactions.
9. Serialization saves canonical model data.
10. Tests cover every command handler and validation rule.

## Target Code Boundaries

```text
js/
  app.js                    thin bootstrap only
  state.js                  UI state only during transition
  command/
    executor.js             validates and dispatches commands
    schema-validator.js     validates CAD_COMMAND_SCHEMA.json
    transactions.js         undo/redo transaction model
    id-factory.js           central stable ID generation
  model/
    project.js              project model factory and defaults
    geometry-store.js       canonical geometry collections
    scene-graph.js          render node creation and lookup
    serialization.js        save/load project format
    migration.js            legacy model import
  modules/
    core-room/
    cabinet/
    services/
    kitchen/
    bathroom/
    furniture/
    hospitality/
  renderer/
    svg-renderer.js         render scene graph snapshots
    viewport.js             view/camera/grid only
  ui/
    command-line.js
    pointer-tools.js
    inspector.js
    system-panel.js
```

## Professional Interior Object Priorities

### 1. Room And Wall Reliability

Needed before interiors intelligence:

- `wall.create`
- `wall.modify`
- `wall.join`
- `opening.insert`
- `room.detect`
- saved/reloaded canonical wall and room objects
- clear room boundary and wall relationship model

Professional requirement:

- a room must know its boundary walls, openings, area, height, and zones.

### 2. Cabinet System

Cabinets are the first practical interiors object.

Must store:

- type
- width, depth, height
- material
- position and orientation
- installation wall
- parent room
- clearance zone
- service requirement
- object ID
- serialization state

Supported first:

- base cabinet
- wall cabinet
- tall cabinet
- sink base
- hob base
- drawer unit
- corner cabinet
- appliance tower
- island cabinet

### 3. Services As Dependencies

Services are not symbols. They are dependencies.

Required service rules:

- sink base requires `water_supply` and `waste_pipe`
- hob base requires `electrical_point` or `gas_point`, plus `exhaust_point`
- WC requires `waste_pipe` and `water_supply`
- vanity requires `water_supply`, `waste_pipe`, and optionally `lighting_point`
- bathroom and kitchen exhaust requires `exhaust_point` and later mechanical route compatibility

### 3A. Lighting, Wiring, And Mechanical Services

Professional realization needs coordinated service systems.

Must store:

- lighting fixture type
- fixture position
- host ceiling, wall, cabinet, or object
- parent room
- switch and circuit references
- routed wire runs
- electrical/data/control system type
- mechanical duct routes
- diffuser and return locations
- exhaust relationships
- ceiling coordination zones

Initial realization commands:

- `service.lighting_fixture`
- `service.circuit_define`
- `service.wire_run`
- `service.mechanical_duct`
- `service.mechanical_diffuser`
- `service.mechanical_return`

Professional requirement:

- the model should reveal whether an interior can be powered, switched, lit, exhausted, ventilated, coordinated above the ceiling, priced, and presented.

### 3B. Coordinated Interior Stream

Interior design elements must be generated and validated together.

Required object families:

- wall paneling
- furnishing layouts
- ceiling treatments
- concealed lighting zones
- feature walls and feature objects
- access panels
- maintenance zones
- accessibility paths

Professional requirement:

- a beautiful feature wall or ceiling is incomplete if it blocks switches, outlets, grilles, drivers, valves, filters, access panels, door clearances, turning areas, or maintenance reach.

Initial commands:

- `interior.panel_create`
- `interior.ceiling_treatment`
- `interior.feature_create`
- `furniture.layout_generate`
- `accessibility.validate`
- `serviceability.validate`

### 4. Kitchen Intelligence

`kitchen.generate` must use:

- detected room
- wall lengths
- openings
- service points
- cabinet module
- clearance rules
- workflow logic

Initial layouts:

- linear
- L-shaped
- galley
- U-shaped
- island

### 5. Bathroom Intelligence

`bathroom.generate` must use:

- room boundary
- door/opening position
- service points
- wet/dry zoning
- fixture clearances

Objects:

- WC
- basin
- vanity
- shower
- glass partition
- mirror
- floor trap
- towel rail

## Phase Plan

### Phase 1: Command Spine

Outcome: one reliable mutation path.

Tasks:

- create command executor
- load and validate `CAD_COMMAND_SCHEMA.json`
- add central ID factory
- add transaction model
- route JSON commands through executor
- keep legacy string commands as compatibility producers only

Exit criteria:

- invalid commands fail atomically
- valid commands return structured results
- no new feature directly pushes to `state.objects`

### Phase 2: Project Model

Outcome: canonical model separated from UI state.

Tasks:

- create `project.geometry`
- create `project.sceneGraph`
- create `project.selection`
- define material and layer registries
- write project serialization
- write migration from current prototype snapshots

Exit criteria:

- saved file includes canonical geometry and scene graph
- reload restores IDs, selection, and object parameters

### Phase 3: `wall.create` End To End

Outcome: first professional vertical slice.

Tasks:

- reuse `js/wall-geometry.js`
- validate material/layer/ID uniqueness
- insert wall into geometry store
- derive scene graph node
- render wall from scene graph
- select created wall
- support undo/redo
- support save/reload

Exit criteria:

- JSON example creates a wall
- wall survives reload
- undo removes it
- redo restores it
- tests cover validation failures

### Phase 4: Inspector And Parameter Editing

Outcome: objects remain editable.

Tasks:

- inspector reads selected canonical object
- inspector writes `wall.modify`, `cabinet.modify`, or `metadata.update`
- remove direct table editing assumptions

Exit criteria:

- changing wall height/thickness runs a command
- failed edits do not mutate the model

### Phase 5: `cabinet.create`

Outcome: first interiors object.

Tasks:

- create cabinet geometry module
- create cabinet validation module
- create cabinet command handler
- derive footprint, body, and clearance zone
- serialize and reload cabinets

Exit criteria:

- cabinet create JSON works
- all supported cabinet types validate
- invalid dimensions fail atomically
- clearance is represented as model data

### Phase 6: Service Objects

Outcome: dependency-aware interiors planning.

Tasks:

- implement service point commands
- validate host/served object links
- add service requirement checks
- render service points from scene graph

Exit criteria:

- sink cabinet can report missing water/waste
- hob can report missing power/gas/exhaust
- service dependencies survive reload

### Phase 6A: Lighting, Wiring, And Mechanical Coordination

Outcome: realization systems become first-class model data.

Tasks:

- implement lighting fixture command handler
- implement circuit and wire run command handlers
- implement mechanical duct, diffuser, and return command handlers
- add ceiling coordination zones
- validate host surfaces and parent rooms
- serialize and reload lighting/electrical/mechanical objects

Exit criteria:

- lighting fixtures can be placed as parametric objects
- switches and circuits can reference controlled fixtures
- wire runs route between service objects
- diffusers and returns can reference rooms and duct routes
- kitchens and bathrooms can report missing lighting or exhaust dependencies

### Phase 6B: Coordinated Interior Stream

Outcome: professional interior features are coordinated with accessibility and services.

Tasks:

- implement wall panel command model
- implement ceiling treatment command model
- implement interior feature command model
- implement furniture layout generation command shell
- add accessibility validation command
- add serviceability validation command
- connect concealed lighting, mechanical objects, and access panels to ceiling treatments
- connect switches, outlets, grilles, access panels, and removable zones to wall paneling

Exit criteria:

- wall paneling cannot silently cover service points
- ceiling treatments can reference concealed lights and mechanical objects
- feature objects can declare clearance and service requirements
- furnishing layouts can be checked for circulation and accessibility
- serviceability issues return object-linked structured results

### Phase 7: Kitchen And Bathroom Generators

Outcome: smart interior layout commands.

Tasks:

- implement room detection
- implement cabinet run placement
- implement kitchen workflow validation
- implement bathroom fixture clearance validation
- add wet/dry zoning

Exit criteria:

- `kitchen.generate` creates command-derived cabinets
- `bathroom.generate` creates command-derived fixtures
- failures are structured and useful

### Phase 8: Professional Presentation And MCP

Outcome: connected workflows without weakening model integrity.

Tasks:

- rendering snapshots consume scene graph
- presentation exports consume project snapshots
- MCP servers use command contracts only
- product catalog and cost estimation consume parametric objects

Exit criteria:

- external tools can validate or propose commands
- no MCP path mutates geometry directly

## Testing Requirements

Every command handler needs tests for:

- valid command
- missing required fields
- invalid dimensions
- duplicate IDs
- missing referenced objects
- validation failure atomicity
- transaction creation
- undo/redo
- serialization and reload

Minimum test groups:

- `command/executor.test.js`
- `model/serialization.test.js`
- `modules/core-room/wall-commands.test.js`
- `modules/cabinet/cabinet-commands.test.js`
- `modules/services/service-commands.test.js`
- `modules/services/lighting-commands.test.js`
- `modules/services/mechanical-commands.test.js`
- `modules/interiors/panel-commands.test.js`
- `modules/interiors/ceiling-treatment.test.js`
- `modules/interiors/accessibility-serviceability.test.js`
- `modules/kitchen/kitchen-generate.test.js`
- `modules/bathroom/bathroom-generate.test.js`

## Code Quality Rules

- Keep modules small and named by responsibility.
- Prefer pure functions in geometry and validation.
- Never let UI functions own canonical mutation.
- Never duplicate geometry helpers in `app.js`.
- Avoid timestamp IDs outside the central ID factory.
- Avoid string parsing for professional CAD commands.
- Use structured result objects for success, warning, and failure.
- Keep legacy prototype commands isolated until they can be replaced.

## Immediate Next Step

Build the command spine and `wall.create` vertical slice before adding more visible features.

The first useful professional milestone is not a richer UI. It is this:

```text
JSON wall.create
-> schema validation
-> geometry validation
-> canonical wall
-> scene graph node
-> viewport render
-> selected object
-> transaction
-> save
-> reload
-> undo/redo
```

Once that works, cabinet and interiors intelligence can be built without rewiring the app again.
