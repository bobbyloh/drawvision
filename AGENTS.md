# DrawVision Agents

DrawVision uses a lean agent architecture. Agents propose plans or structured CAD commands. They do not mutate geometry, scene graph, viewport, files, undo stacks, or serialized project state directly.

AI output must pass through schema validation, deterministic validation, the command executor, the geometry kernel, the scene graph, and serialization.

## Planner Agent

Responsibility:

- interpret user intent
- decompose design goals
- create a task graph
- decide which modules are needed
- sequence work
- enforce product direction and resource limits

Input:

- user request
- project summary
- available modules
- retrieved context when needed
- validation feedback

Output:

- task graph
- module selection
- ordered agent calls
- clarification questions only when required

Forbidden actions:

- generate final geometry directly
- mutate model state
- emit raw scene graph patches
- bypass validation
- call Presentation Agent before core command infrastructure is stable

When to call:

- natural-language design requests
- multi-step edits
- requests involving multiple modules
- ambiguous commands that need decomposition

Dependencies:

- Retrieval Agent for grounded context
- Geometry Agent for low-level CAD commands
- Module Agent for cabinets, kitchens, bathrooms, furniture, hospitality, and services
- Validation Agent for all proposed outputs

## Geometry Agent

Responsibility:

- convert approved tasks into CAD command JSON
- generate wall, slab, opening, room, zone, and object transform commands
- keep commands explicit and reviewable

Input:

- approved Planner task
- project geometry summary
- applicable schema subset
- validation feedback

Output:

- structured CAD command JSON only

Forbidden actions:

- mutate viewport or scene graph
- create IDs outside the deterministic ID factory unless explicitly supplied and valid
- produce module-level kitchen, bathroom, cabinet, or service layouts
- skip schema validation

When to call:

- wall, opening, slab, ceiling, room, zone, select, transform, and material tasks
- conversion of planner steps into executable low-level commands

Dependencies:

- Planner Agent
- Validation Agent
- command schema

## Validation Agent

Responsibility:

- validate schema
- validate geometry
- validate room closure
- validate object collisions
- validate cabinet clearances
- validate bathroom clearances
- validate kitchen workflow
- validate service dependencies

Input:

- proposed command or command batch
- project model snapshot
- module rules
- geometry rules

Output:

- accepted commands
- structured failures
- structured warnings
- repair recommendations when useful

Forbidden actions:

- mutate geometry
- mutate scene graph
- silently fix commands without reporting the change
- allow AI output to bypass deterministic validation

When to call:

- before every AI-proposed command batch
- before command execution
- after failed command execution to classify failures

Dependencies:

- CAD command schema
- geometry kernel
- module validators
- project model

## Retrieval Agent

Responsibility:

- retrieve project documents, PDFs, plans, standards, catalogs, material references, and previous design rules
- provide grounded context to Planner and Module Agent

Input:

- retrieval question
- project references
- target module or design task

Output:

- cited context summaries
- relevant constraints
- catalog or standards snippets normalized for planning

Forbidden actions:

- produce geometry
- mutate project files
- write CAD commands
- invent standards without sources

When to call:

- when a design task references external documents, standards, products, materials, or prior project rules
- before module generation that depends on catalog or standards data

Dependencies:

- future `filesystem_mcp`
- future `product_catalog_mcp`
- project document store

## Module Agent

Responsibility:

- handle higher-level architectural modules
- generate module-level CAD commands for cabinets, kitchens, bathrooms, furniture, hospitality suites, and service connections

Input:

- Planner task
- project model summary
- retrieved context
- module constraints
- validation feedback

Output:

- module-level CAD command JSON
- dependency declarations
- clearances and service requirements

Forbidden actions:

- mutate geometry directly
- bypass Validation Agent
- create one-off object-specific agents
- generate rendering or presentation packages

When to call:

- `cabinet.create`
- `kitchen.generate`
- `bathroom.generate`
- service connection planning
- furniture and hospitality suite layouts

Dependencies:

- Planner Agent
- Retrieval Agent
- Validation Agent
- deterministic module handlers

## Presentation Agent

Status: later phase only.

Responsibility:

- rendering views
- annotations
- diagram generation
- PPT/export workflows
- investor presentation packaging

Input:

- validated project snapshot
- scene graph snapshot
- presentation brief
- selected views and annotations

Output:

- render/export command proposals
- presentation package plans
- diagram specifications

Forbidden actions:

- run before core command and geometry infrastructure is stable
- mutate canonical geometry
- bypass scene graph snapshots
- treat presentation output as model truth

When to call:

- Phase 6 only
- after command execution, geometry, validation, serialization, and module infrastructure are reliable

Dependencies:

- rendering pipeline
- future `rendering_mcp`
- future `presentation_mcp`
