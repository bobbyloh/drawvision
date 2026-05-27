# DrawVision Module System

DrawVision modules are deterministic architectural packages. They define object types, command handlers, validation rules, dependencies, serialization shape, and future MCP contracts.

Modules are not agents. The Module Agent may propose module-level commands, but deterministic module handlers execute only after validation.

## Module Contract

Every module must define:

- owned object types
- command names
- required and optional parameters
- validation rules
- dependencies on other modules
- serialization format
- scene graph output
- future MCP interface

Handlers receive validated commands and a project model context. They return transaction deltas, created or modified IDs, warnings, failures, and measurements.

Modules must not mutate the viewport directly and must not bypass the command executor.

## Core Room Module

Object types:

- `wall`
- `opening`
- `room`
- `slab`
- `ceiling`
- `zone`

Commands:

- `wall.create`
- `wall.modify`
- `wall.delete`
- `wall.join`
- `opening.insert`
- `room.detect`
- `slab.create`
- `ceiling.create`
- `zone.define`

Validation:

- walls require non-zero paths, positive height, positive thickness, valid material, and valid layer
- openings must fit along the host wall and within wall height
- rooms require closed wall loops
- slabs and ceilings require closed, non-self-intersecting boundaries
- zones require a boundary or valid parent room

First milestone: `wall.create` end to end.

## Cabinet Module

Object types:

- `cabinet`
- `cabinet_clearance_zone`

Commands:

- `cabinet.create`
- `cabinet.array`
- `cabinet.attach_to_wall`

Supported cabinet types:

- `base_cabinet`
- `wall_cabinet`
- `tall_cabinet`
- `sink_base`
- `hob_base`
- `drawer_unit`
- `corner_cabinet`
- `appliance_tower`
- `island_cabinet`

Cabinet parameters:

- type
- width, depth, height
- position
- orientation
- material
- clearance zone
- service requirement
- parent wall
- parent room

Validation:

- dimensions must be positive
- type must be supported
- parent wall and parent room must exist when supplied
- clearance zone must not collide with blocking objects
- `sink_base` requires `water_supply` and `waste_pipe`
- `hob_base` requires `electrical_point` or `gas_point`, plus `exhaust_point`

Second milestone: `cabinet.create` as the first parametric module object.

## Kitchen Module

Object types:

- `kitchen`
- `kitchen_work_zone`
- generated cabinet references

Commands:

- `kitchen.generate`

Parameters:

- parent room
- layout type: `linear`, `L-shaped`, `galley`, `U-shaped`, or `island`
- target walls
- service points
- appliance preferences
- clearance rules

Validation:

- parent room must exist
- cabinet runs must fit along target walls
- generated cabinets must avoid openings and collisions
- sink, hob, and fridge workflow must remain usable
- service-dependent objects must bind to compatible services or fail

## Bathroom Module

Object types:

- `bathroom`
- bathroom fixture records
- bathroom clearance zones

Commands:

- `bathroom.generate`

Parameters:

- parent room
- service points
- fixture preferences
- clearance requirements
- wet/dry zone preferences

Validation:

- parent room must exist
- WC requires `water_supply` and `waste_pipe`
- vanity requires `water_supply`, `waste_pipe`, and `lighting_point`
- shower requires water and waste services
- door and circulation clearances must remain usable

## Furniture Module

Object types:

- `furniture`
- `clearance_zone`

Commands:

- `object.transform`
- future furniture create commands through the Module Agent

Parameters:

- furniture type
- dimensions
- position
- orientation
- material
- parent room
- clearance rules

Validation:

- dimensions must be positive
- parent room must exist when supplied
- clearance zones must not block required circulation

## Service Connection Module

Object types:

- `water_supply`
- `waste_pipe`
- `electrical_point`
- `lighting_point`
- `switch_point`
- `exhaust_point`
- `gas_point`
- `data_point`

Commands:

- `service.create`
- `service.connect`

Validation:

- service type must be supported
- positions must be finite 3D points
- hosted services must reference valid host objects
- served objects must exist
- service compatibility must match object requirements

Third milestone: build services as dependency objects, not decorative symbols.

## Hospitality Suite Module

Object types:

- `hospitality_suite`
- suite zones
- furniture and service references

Commands:

- future `suite.generate`

Validation:

- suite must reference rooms or room boundaries
- furniture, kitchen, bathroom, and service dependencies remain module-owned
- operational clearances and housekeeping paths are validation concerns

This module waits until room, cabinet, bathroom, furniture, and service primitives are reliable.

## Rendering Module

Object types:

- render scene metadata
- view presets

Commands:

- future rendering commands

Validation:

- rendering consumes scene graph snapshots
- rendering must not create or modify canonical geometry

## Presentation Export Module

Object types:

- presentation packages
- sheets
- diagrams

Commands:

- future presentation/export commands

Validation:

- presentation consumes validated project and render snapshots
- presentation output is not model truth

This module belongs with the later Presentation Agent phase.
