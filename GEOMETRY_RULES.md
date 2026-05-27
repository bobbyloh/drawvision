# Geometry Rules

DrawVision geometry is deterministic. Persistent objects are created or changed only by validated CAD commands.

## Units

- Native project unit is millimeters.
- Coordinates are 3D arrays: `[x, y, z]`.
- Commands are interpreted in project units unless `meta.units` is supplied and normalized before validation.
- UI may display metric or imperial values, but saved geometry remains normalized to millimeters.

## Coordinate Conventions

- `x` increases right/east in plan.
- `y` increases up/north in plan.
- `z` increases vertically.
- Plan view projects `x/y`.
- Elevation views project one horizontal axis plus `z`.
- 3D and axon views are render projections and never change canonical coordinates.

## Object ID Rules

- IDs are stable across save/load.
- IDs are unique within the project.
- IDs are generated centrally by deterministic code when omitted.
- Valid IDs start with a letter and may include letters, digits, `_`, `.`, `:`, and `-`.
- Human-readable prefixes should match kind: `wall_`, `opening_`, `room_`, `slab_`, `ceiling_`, `zone_`, `cabinet_`, `service_`, `obj_`.
- Modify, delete, select, transform, and connect commands must reference existing IDs.

## Wall Topology

Wall object:

```json
{
  "id": "wall_01",
  "kind": "wall",
  "path": {
    "type": "line",
    "start": [0, 0, 0],
    "end": [5000, 0, 0],
    "length": 5000
  },
  "height": 3200,
  "coreThickness": 200,
  "totalThickness": 200,
  "baseOffset": 0,
  "material": "default_wall",
  "layer": "A-WALL",
  "finishLayers": [],
  "openings": [],
  "joins": []
}
```

Rules:

- wall paths must be non-zero
- initial wall paths are straight lines or circular arcs
- initial wall paths lie on a horizontal plane
- height and thickness must be positive
- wall body is derived from path, thickness, finishes, height, and joins
- openings are child records and reference the host wall

## Wall Joining Rules

- Joining is explicit through `wall.join` or automatic when `wall.create.join` is `auto`.
- Join tolerance defaults to `1mm`.
- Candidate walls join only if endpoints are within tolerance or axes intersect at a valid endpoint extension.
- Miter and butt joins are allowed.
- Join recomputation must preserve wall IDs.
- Invalid joins return structured failures or warnings; they do not silently corrupt geometry.

## Snapping Rules

Snap candidates:

- grid intersections
- wall endpoints
- wall midpoints
- opening edges
- slab vertices
- room boundary vertices
- guide points

Rules:

- snapping happens before command proposal for pointer input
- schema and geometry validation still run after snapping
- endpoint snaps win over grid snaps inside the same screen tolerance
- snap metadata may be recorded in `meta` for audit/debugging

## Room Closure

- rooms are detected from closed wall-axis loops
- gaps greater than tolerance reject room detection
- crossings and self-intersections reject room creation
- openings do not break room closure
- room boundaries reference source wall IDs
- room area is computed metadata, not hand-edited geometry

## Clearance Zones

- clearance zones are validation geometry, not decorative shapes
- cabinet fronts, bathroom fixtures, furniture, service access, and circulation paths may create clearance zones
- blocking collisions produce structured validation failures
- warning-only clearance checks must be explicitly marked as warnings

## Cabinet Rules

Cabinet object:

```json
{
  "id": "cabinet_01",
  "kind": "cabinet",
  "type": "base_cabinet",
  "width": 600,
  "depth": 560,
  "height": 850,
  "position": [0, 0, 0],
  "orientation": 90,
  "material": "timber_veneer",
  "clearanceZone": 900,
  "serviceRequirement": [],
  "parentWall": "wall_01",
  "parentRoom": "room_01"
}
```

Rules:

- supported types are `base_cabinet`, `wall_cabinet`, `tall_cabinet`, `sink_base`, `hob_base`, `drawer_unit`, `corner_cabinet`, `appliance_tower`, and `island_cabinet`
- width, depth, and height must be positive
- position is the insertion origin in project units
- orientation is degrees around the Z axis
- footprint, body, and clearance are derived from parameters
- attached cabinets must reference an existing wall
- parent room is optional for raw creation and required for generated kitchens/bathrooms
- `sink_base` requires `water_supply` and `waste_pipe`
- `hob_base` requires `electrical_point` or `gas_point`, plus `exhaust_point`

## Kitchen Rules

- kitchen generation requires a parent room
- supported initial layouts are `linear`, `L-shaped`, `galley`, `U-shaped`, and `island`
- target wall IDs must exist when supplied
- cabinet runs must fit along target walls without crossing blocked openings
- clearance fronts must remain usable
- sink, hob, and fridge placement must remain reachable
- service-dependent objects must connect to compatible service objects or fail validation

## Bathroom Rules

- bathroom generation requires a parent room
- door/opening positions must be considered when available
- WC requires `water_supply` and `waste_pipe`
- vanity requires `water_supply`, `waste_pipe`, and `lighting_point`
- shower requires water and waste services
- wet/dry zones are derived zones tied to the parent bathroom
- fixture clearances must not block doors or required circulation

## Service Dependency Rules

Services are canonical dependency objects, not symbols.

Supported base services:

- `water_supply`
- `waste_pipe`
- `electrical_point`
- `lighting_point`
- `switch_point`
- `exhaust_point`
- `gas_point`
- `data_point`

Rules:

- services have IDs, positions, optional hosts, optional parent rooms, and optional served object IDs
- hosted services must reference existing walls, slabs, ceilings, cabinets, rooms, or objects
- served objects must exist
- compatibility is checked by object type and service requirement list
- missing required services block generated kitchens and bathrooms unless a future command explicitly requests a dry-run proposal

## Validation Failure Behavior

Validation failure is atomic:

- no geometry mutation
- no scene graph mutation
- no selection mutation
- no undo transaction
- no dirty flag change
- no serialization write

Failure shape:

```json
{
  "ok": false,
  "errors": [
    {
      "code": "WALL_ZERO_LENGTH",
      "message": "wall.create requires a non-zero wall path",
      "path": ["path"]
    }
  ]
}
```

Warnings are allowed only when the command is still valid:

```json
{
  "ok": true,
  "warnings": [
    {
      "code": "JOIN_SKIPPED",
      "message": "No adjacent wall endpoint was within tolerance"
    }
  ]
}
```
