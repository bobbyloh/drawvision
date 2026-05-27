# DrawVision Changelog

## Initial Local Agent Setup

- Created planner agent
- Created geometry agent
- Created validation agent
- Created retrieval agent
- Created module agent
- Created project status docs

## Foundation CAD Pipeline

- Added command executor
- Connected wall.create to wall geometry system
- Added scene graph infrastructure
- Added model store
- Added serialization and reload support
- Added undo/redo for created objects

## Modular Foundation Expansion

- Added scene graph render adapter
- Added JSON command input helper
- Added cabinet.create parametric object
- Added service.create dependency object
- Updated command executor for modular objects
- Updated command schema

## Relationship Engine

- Added cabinet-to-wall attachment relationship
- Added service connection relationship
- Added service dependency validation

## Relationship Commands

- Added cabinet.attach_to_wall command
- Added service.connect command
- Added service rule presets
- Added automatic service requirement assignment

## Room Foundation

- Added room.detect geometry object
- Added room boundary area and centroid
- Added point-in-room helper
- Added room.contains relationship
- Added room rendering adapter support
- Updated command schema for room commands

## Kitchen Generator Foundation

- Added kitchen.generate module generator
- Added linear cabinet sequence generation
- Added room containment for generated cabinets
- Added service rule inheritance for generated kitchen cabinets

## Kitchen Service Orchestration

- Added automatic kitchen service provisioning
- Added automatic service.create for required cabinet services
- Added automatic service.connect for generated services
- Updated kitchen.generate to validate generated kitchen service dependencies

## Bathroom Generator Foundation

- Added bathroom.generate module generator
- Added bathroom fixture generation
- Added automatic service provisioning for vanity, WC, shower, and floor trap
- Added room containment for bathroom fixtures

## Automatic Room Containment

- Added automatic object-to-room containment detection
- Added anchor point extraction for parametric objects
- Added autoContainAllObjects helper
