# DrawVision Relational Database Design

Goal: every visible element and attributes table should tie back to a relational data model.

## Why A Database

DrawVision should not treat drawings as loose pixels. Every element should be queryable:

- select all doors
- count door blocks
- list wall openings
- schedule fixtures
- find all objects on a layer
- trace group/subgroup membership
- export quantities
- let AI query and edit project data safely

## Current Stage

The browser prototype stores data in JavaScript objects and JSON.

This should evolve into:

```text
Browser UI
  -> DrawVision data service
  -> SQLite for local/single-user
  -> PostgreSQL for multi-user/server use later
```

## Core Tables

### projects

```text
id
name
units
paper_scale
virtual_scale
created_at
updated_at
```

### elements

```text
id
project_id
type
layer_id
group_id
geometry_json
style_id
created_at
updated_at
```

### element_attributes

```text
id
element_id
key
value
value_type
```

### nodes

```text
id
element_id
node_index
x
y
z
role
```

### layers

```text
id
project_id
name
color
visible
locked
line_weight
```

### groups

```text
id
project_id
parent_group_id
name
type
```

### blocks

```text
id
project_id
name
category
base_x
base_y
base_z
definition_json
```

### block_instances

```text
id
block_id
project_id
x
y
z
rotation
scale
attributes_json
```

### views

```text
id
project_id
name
type
camera_json
viewbox_json
scale
```

### command_history

```text
id
project_id
command_text
result
created_at
```

## Attributes Table Binding

The UI attributes table should be generated from:

```text
elements
element_attributes
nodes
layers
groups
block_instances
```

When the user selects an object:

1. UI gets `element.id`.
2. Data layer queries the element row.
3. Data layer joins layer/group/block records.
4. Data layer loads attributes and nodes.
5. UI displays a relational attributes table.

## AI Integration

AI should query structured data:

```sql
select * from elements where type = 'door';
select * from element_attributes where key = 'width';
```

AI should write by command chain, not arbitrary database mutation.

Example:

```text
AI proposes:
insert block door_900 at 4,0
tag selected D01
```

Then DrawVision command engine updates the database.
