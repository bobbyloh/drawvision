# MCP Servers

MCP is DrawVision's connected-services/tool layer. It is not the core CAD engine, not a UI feature surface, and not a privileged mutation path.

All MCP writes must submit JSON CAD commands and receive command results. MCP servers must not patch geometry, scene graph, viewport DOM, selection, undo stacks, or serialized files directly.

## Shared Contract

Request:

```json
{
  "projectId": "local",
  "commands": [
    {
      "cmd": "wall.create",
      "start": [0, 0, 0],
      "end": [5000, 0, 0],
      "height": 3200,
      "thickness": 200,
      "material": "default_wall",
      "meta": {
        "source": "mcp"
      }
    }
  ],
  "dryRun": false
}
```

Response:

```json
{
  "ok": true,
  "results": [
    {
      "ok": true,
      "created": ["wall_01"],
      "selected": ["wall_01"]
    }
  ]
}
```

Dry runs validate and plan commands without mutation.

## `filesystem_mcp`

Purpose:

- read DrawVision project files
- write DrawVision project files through project serialization
- list project directories
- import/export JSON payloads
- provide file snapshots for Retrieval Agent and Planner Agent

Allowed operations:

- `project.open(path)`
- `project.save(path, snapshot)`
- `project.export(path, format)`
- `project.list(root)`

Restrictions:

- no direct geometry record edits
- no bypass of migrations or schema validation
- no trust in AI-generated file contents without validation

## `geometry_mcp`

Purpose:

- validate CAD commands
- run geometry analysis
- compute room closure
- detect wall joins
- analyze collisions and clearances
- analyze service dependencies

Allowed operations:

- `commands.validate(commands)`
- `commands.apply(commands, dryRun)`
- `geometry.analyze(projectSnapshot)`
- `rooms.detect(projectSnapshot, options)`
- `walls.join(projectSnapshot, wallIds, options)`
- `services.validate(projectSnapshot, options)`

Restrictions:

- persistent writes still route through the command executor
- analysis returns reports, warnings, failures, or proposed commands
- no viewport state ownership

## `rendering_mcp`

Purpose:

- automate viewport rendering
- export SVG/PNG/PDF snapshots
- run visual regression captures

Allowed operations:

- `render.snapshot(projectSnapshot, view)`
- `render.export(projectSnapshot, format, options)`
- `render.batch(projectSnapshot, scenes)`

Restrictions:

- consumes scene graph snapshots
- does not create or edit geometry
- material/style changes must be proposed as commands such as `material.assign`

## `hospitality_mcp`

Purpose:

- future hospitality planning intelligence
- room program checks
- adjacency checks
- suite checks
- operational metadata review

Allowed operations:

- `program.validate(projectSnapshot, program)`
- `rooms.classify(projectSnapshot)`
- `adjacency.analyze(projectSnapshot, requirements)`
- `suite.validate(projectSnapshot, options)`

Restrictions:

- returns structured reports or proposed commands
- no direct model mutation
- no direct viewport mutation

## `product_catalog_mcp`

Purpose:

- search future cabinet, appliance, sanitaryware, furniture, material, and finish catalogs
- map products to DrawVision parametric object requirements
- provide dimensions, materials, service requirements, and clearance metadata

Allowed operations:

- `catalog.search(category, filters)`
- `catalog.get(productId)`
- `catalog.match(objectSpec)`
- `catalog.propose_commands(productSelection)`

Restrictions:

- catalog results are not inserted directly
- placement must return commands such as `cabinet.create`, `service.create`, `object.transform`, or `material.assign`
- catalog metadata cannot override geometry validation

## `cost_estimation_mcp`

Purpose:

- compute quantities from validated project snapshots
- connect parametric objects to cost assemblies
- estimate walls, openings, cabinets, kitchens, bathrooms, furniture, services, and presentation packages

Allowed operations:

- `cost.quantities(projectSnapshot)`
- `cost.estimate(projectSnapshot, rateSet)`
- `cost.compare_options(projectSnapshots)`
- `cost.report(estimate, format)`

Restrictions:

- consumes snapshots and reports derived values
- may propose metadata commands in the future
- no geometry mutation

## `presentation_mcp`

Purpose:

- produce boards, diagrams, sheet sets, narratives, and client-facing exports from validated project snapshots
- connect render outputs with project metadata

Allowed operations:

- `presentation.create(projectSnapshot, template)`
- `presentation.export(package, format)`
- `diagrams.generate(projectSnapshot, diagramType)`

Restrictions:

- consumes validated snapshots
- may propose scene/camera/material commands in a future schema
- may not alter canonical geometry

## AI Planner Boundary

Valid AI/MCP output:

```json
{
  "commands": [
    {
      "cmd": "wall.create",
      "start": [0, 0, 0],
      "end": [5000, 0, 0],
      "height": 3200,
      "thickness": 200,
      "material": "default_wall",
      "meta": {
        "source": "ai_proposal"
      }
    }
  ],
  "explanation": "Creates a 5m wall on the ground plane."
}
```

Invalid AI/MCP output:

- raw scene graph patches
- DOM or SVG edits
- direct `state.objects` patches
- unvalidated file writes
- viewport mutation instructions
