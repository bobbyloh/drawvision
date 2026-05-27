# DrawVision User Manual

## Part 1: Introduction, Drawing Preparation, Baselines, And Blocks

### 1. Introduction

DrawVision is a sketch-to-insight architectural design environment. The command prompt remains the primary precision interface, while sketch capture, interpretation, analytics, visualization, and presentation workflows are being layered around it.

The goal is to combine:

- remembered DrawVision-style commands
- SketchUp-like readable UI
- 1:1 architectural drawing
- editable geometry
- future AI prompt-to-command workflows

The core workflow is:

```text
Think
Type or choose command
Pick points with mouse/touch
Confirm measurement
Edit geometry
Save/export
```

### 2. Drawing Preparation

Before drawing, confirm the environment:

```text
Scale: 1:1
Units: architectural feet/inches
Grid: 20' x 20'
Snap: 1'
View: Plan / Top
```

Recommended starting commands:

```text
view plan
select none
snap grid
```

The Measurements box should be visible. It reports coordinates, distances, radii, copy counts, and extrusion heights.

### 3. Creating Baselines

Baselines are reference lines used to organize the drawing.

Typical uses:

- building grid lines
- wall reference lines
- center lines
- axis guides
- layout control points

Basic command:

```text
input line
```

Then click:

```text
from point
to point
```

Example command intent:

```text
line from 0,0 to 20,0
line from 0,0 to 0,20
```

Current mouse workflow:

1. Choose `Line` from the tool rail or type `line`.
2. Click the first grid point.
3. Click the second grid point.
4. The line is created and selected.

Axis constraints:

```text
X = lock horizontal direction
Y = lock vertical direction
Z = lock elevation/depth direction
```

### 4. Creating Blocks

Blocks are reusable grouped elements.

In early DrawVision, this will map to:

```text
group selected as name
component selected as name
block selected as name
```

Planned block workflow:

1. Draw the object.
2. Select the elements.
3. Convert selection into a named block.
4. Insert or repeat the block.

Example:

```text
select in box
group selected as room_grid_01
rep n 3 x
```

Block types to support:

- room modules
- door symbols
- window symbols
- furniture symbols
- bathroom fixture symbols
- structural grid modules

### 5. Part 1 Checklist

Before moving to the next lesson, the user should be able to:

- Open DrawVision.
- Identify command prompt, measurements box, tool rail, tray, and viewport.
- Set view to plan/top.
- Draw a baseline with two clicks.
- Use X/Y/Z axis lock.
- Select elements.
- Understand the purpose of blocks/components.

## Next Part

Part 2 should cover:

- drawing walls
- offsets
- trimming/extending
- basic room layout
- dimensions

## Part 2: Setting Styles, Entering Dimensions, Inserting Blocks, And Creating The Body

### 1. Setting Styles

Styles control how geometry appears and prints.

Core style properties:

- layer
- color
- line weight
- line type
- fill
- text height
- dimension style
- material name

Early DrawVision commands:

```text
set selected layer walls
set selected color red
set selected weight 3
set selected fill concrete
set text height 6in
```

Recommended default layers:

```text
walls
floor
guides
notes
dimensions
blocks
body
```

Style goal:

The drawing should be readable before it becomes visually decorative.

### 2. Entering Dimensions

Dimensions should be entered through the command prompt or Measurements box.

Common examples:

```text
line 12'
move selected 3'
gen cir dia 4'
extrude selected z 10'
offset selected 6in
```

Mouse workflow:

1. Start a command.
2. Click the first point.
3. Type a dimension into the Measurements box or command prompt.
4. Press Enter.

Dimension types to support:

- length
- width
- radius
- diameter
- angle
- height / Z
- copy spacing
- repeat count

Measurement command:

```text
distance from . to .
```

### 3. Inserting Blocks

Blocks are reusable drawing elements.

Examples:

- doors
- windows
- furniture
- sanitary fixtures
- grid bubbles
- title markers

Future command syntax:

```text
insert block door_900 at .
insert block window_1200 at .
insert block wc at .
insert block bed_queen at .
```

Block workflow:

1. Choose or type block command.
2. Pick insertion point.
3. Rotate if needed.
4. Confirm scale.
5. Place into the drawing.

Repeat workflow:

```text
insert block column at .
rep n 5 x
```

### 4. Creating The Body

The body is the mass or main form generated from 2D geometry.

Typical workflow:

```text
input poly
click footprint points
close poly
extrude selected z 10
view 3d
```

Architectural example:

```text
input poly
0,0
20,0
20,12
0,12
close
extrude selected z 10
```

The body should keep:

- original footprint
- extrusion height
- layer
- material
- editable command history

Supported early body operations:

```text
extrude selected z 10
merge line to 0
view 3d
view plan
```

Future body operations:

- push/pull face
- cut opening
- boolean subtract
- boolean add
- section cut
- assign material

### 5. Part 2 Checklist

The user should be able to:

- Assign basic styles.
- Enter dimensions using commands.
- Understand radius vs diameter.
- Insert or plan reusable blocks.
- Create a closed footprint.
- Extrude the footprint into a simple body.
- Return from axon/3D to plan view.

## Part 2.2: Creating A Staircase Arrow Block And An Action Macro

### 1. Purpose

A staircase arrow block shows the direction of travel on a stair.

It should include:

- arrow line
- arrow head
- label such as `UP` or `DN`
- insertion point
- rotation
- scale

### 2. Draw The Stair Arrow

Basic command sequence:

```text
input line
pick arrow start
pick arrow end
input poly
draw arrow head
input text UP
pick text location
```

Recommended block name:

```text
stair_arrow_up
stair_arrow_down
```

### 3. Create The Block

Planned command:

```text
select in box
block selected as stair_arrow_up
```

Block attributes:

```text
name: stair_arrow_up
type: annotation
base_point: arrow tail
default_layer: notes
default_scale: 1:1
rotation: editable
```

### 4. Action Macro

An action macro records repeated command steps.

Example macro:

```text
macro stair_arrow_up
input line
input poly
input text UP
block selected as stair_arrow_up
end macro
```

The goal is to later allow:

```text
run macro stair_arrow_up at .
```

### 5. AI Use Later

AI should be able to generate the macro, but the user should approve the command chain before execution.

Example:

```text
AI prompt:
Create a standard UP stair arrow block.

Generated command chain:
input line ...
input poly ...
input text UP ...
block selected as stair_arrow_up
```

## Part 3: Drawing Stairs, Storage, And Wall Openings

### 1. Drawing Stairs

Stairs are made from:

- stair boundary
- treads
- riser lines
- landing
- direction arrow
- label

Basic stair layout:

```text
input line
draw stair width
offset tread spacing
rep n 10 y
insert block stair_arrow_up at .
```

Useful future commands:

```text
stair width 3' tread 10in riser 7in count 12
stair direction up
stair landing 3'
```

Stair layers:

```text
stairs
notes
dimensions
```

### 2. Drawing Storage

Storage elements include:

- cabinet
- closet
- shelf
- wardrobe
- utility storage

Simple storage workflow:

```text
input rect
set selected layer storage
input text ST
group selected as storage_01
```

Future block examples:

```text
insert block closet_2ft at .
insert block cabinet_base at .
insert block shelf_unit at .
```

### 3. Wall Openings

Wall openings include:

- door opening
- window opening
- pass-through
- service opening

Required CAD behavior:

- select wall
- define opening start and end points
- cut wall segment
- insert door/window block
- keep wall and opening editable

Proposed commands:

```text
opening door width 3' on selected wall at .
opening window width 4' sill 3' head 7' at .
cut wall from . to .
insert block door_3ft at .
```

Early manual workaround:

```text
delete line
input line
draw remaining wall segments
insert block door_3ft at opening
```

### 4. Part 3 Checklist

The user should be able to:

- Draw a simple stair with repeated tread lines.
- Place a stair arrow block.
- Draw storage rectangles and label them.
- Understand wall opening logic.
- Insert or prepare door/window blocks.
- Keep all objects on correct layers.

## Part 4.1: Building Fixtures

### 1. Purpose

Fixtures are reusable architectural objects that help complete a usable floor plan.

Fixture examples:

- WC
- wash basin
- shower
- bathtub
- kitchen sink
- stove
- refrigerator
- washer/dryer
- wardrobe
- vanity

### 2. Fixture Block Strategy

Each fixture should be a block/component.

Fixture block data:

```text
name
type
base point
width
depth
rotation
layer
symbol geometry
clearance zone
```

Example commands:

```text
insert block wc at .
insert block basin_600 at .
insert block shower_900 at .
rotate z 90
move from . to .
```

### 3. Fixture Layers

Recommended layers:

```text
fixtures
plumbing
clearance
notes
dimensions
```

### 4. Fixture Workflow

1. Draw or load fixture block.
2. Pick insertion point.
3. Rotate if needed.
4. Confirm clearance.
5. Group into room package if needed.

### 5. AI Use Later

AI should be able to propose fixture layouts from room type.

Example:

```text
Prompt:
Create a compact hotel bathroom layout.

Command chain:
insert block wc at 2,2
insert block basin_600 at 5,2
insert block shower_900 at 8,2
dimension bathroom_clearance
```

## Part 4.2: Dynamic Blocking Of Door And Window Arrangement And Baseline Numbers

### 1. Dynamic Door And Window Blocks

Door and window blocks should carry parameters.

Door parameters:

```text
width
swing angle
handing
wall host
opening start
opening end
tag number
```

Window parameters:

```text
width
height
sill height
head height
wall host
tag number
```

Proposed commands:

```text
insert door width 3' at .
insert window width 4' sill 3' at .
flip selected
rotate z 90
```

### 2. Baseline Numbers

Baseline numbers identify grid/reference lines.

Examples:

```text
A
B
C
1
2
3
```

Baseline workflow:

```text
input line
set selected layer baselines
input text A
place baseline bubble
block selected as baseline_A
```

Future command:

```text
baseline horizontal A from . to .
baseline vertical 1 from . to .
```

### 3. Dynamic Arrangement Workflow

1. Draw wall baseline.
2. Place door/window on wall.
3. Assign tag number.
4. Adjust position with move from `. to .`.
5. Repeat similar openings with `rep n`.

Example:

```text
insert window width 4' at .
rep n 3 x
tag selected W01
```

### 4. Part 4 Checklist

The user should be able to:

- Understand fixture blocks.
- Understand door/window parameters.
- Place baseline numbers.
- Use dynamic block concepts.
- Prepare for AI-generated layouts.

## Part 5.1: Arranging Furniture Blocks, Hatching Floors And Paving Stones, And Writing Room Names

### 1. Furniture Blocks

Furniture blocks make plans readable and usable.

Examples:

- bed
- sofa
- chair
- table
- desk
- wardrobe
- TV console

Proposed commands:

```text
insert block bed_queen at .
insert block sofa_3seat at .
insert block dining_4pax at .
rotate z 90
move from . to .
```

Furniture should be placed on:

```text
furniture
```

### 2. Hatching Floors

Floor hatches communicate material and zone.

Examples:

- tile
- timber
- carpet
- concrete
- stone

Proposed commands:

```text
hatch selected tile 2x2
hatch selected timber plank
hatch selected concrete
```

Early implementation can store hatch as object attributes:

```text
attrs.hatch = "tile"
attrs.hatch_scale = "2'"
```

### 3. Paving Stones

Paving stone patterns are repeated hatch/block systems.

Examples:

```text
paver 300x600 running bond
paver 400x400 grid
paver stone random
```

Future command:

```text
hatch selected paver_300x600
```

### 4. Writing Room Names

Room names should be text objects with standard style.

Examples:

```text
input text BEDROOM
input text BATHROOM
input text LIVING
input text KITCHEN
```

Room label workflow:

1. Select room/space.
2. Pick center point.
3. Enter room name.
4. Optionally add area.

Future command:

```text
room name BEDROOM at .
room area selected
```

### 5. Part 5 Checklist

The user should be able to:

- Insert furniture blocks.
- Move and rotate furniture.
- Hatch a floor area.
- Apply paving pattern concept.
- Add room names.
- Keep furniture, hatch, and room names on correct layers.

## Part 5.2: Quantifying Door Blocks And Creating Drawing Frame Blocks With Title Blocks

### 1. Quantifying Door Blocks

Door blocks should carry data so they can be counted.

Door block attributes:

```text
tag
width
height
type
fire_rating
material
room_from
room_to
quantity
```

Example commands:

```text
select block door
count selected
schedule doors
```

Future output:

```text
D01  900x2100  timber  qty 4
D02  800x2100  timber  qty 2
```

The goal is not just drawing symbols, but extracting useful quantities.

### 2. Creating Drawing Frame Blocks

A drawing frame block defines the printable sheet boundary.

Frame types:

```text
A4
A3
A2
A1
A0
Arch D
Arch E
```

Frame block contents:

- border
- margin
- title block area
- revision table
- scale note
- drawing number
- project name
- sheet title

Proposed command:

```text
insert block frame_arch_d at 0,0
```

### 3. Title Blocks

Title block fields:

```text
project
drawing_title
drawing_number
revision
date
scale
drawn_by
checked_by
client
```

Future command:

```text
title set project DrawVision Test
title set drawing_title Ground Floor Plan
title set scale 1:100
```

### 4. Part 5.2 Checklist

The user should be able to:

- Understand door block data.
- Count door blocks.
- Create or insert a drawing frame.
- Understand title block fields.
- Prepare drawings for sheet output.

## Part 6.1: Creating A Page Setup, Creating And Configuring Viewports, And Printing Drawings

### 1. Page Setup

Page setup controls how model space appears on paper.

Required settings:

```text
paper size
orientation
plot scale
line weights
monochrome/color
margins
title block
```

Example page setup:

```text
paper Arch D
orientation landscape
plot scale 1:100
lineweight on
```

### 2. Viewports

A viewport is a window from paper space into model space.

Viewport properties:

```text
view name
scale
center point
rotation
locked/unlocked
visible layers
```

Commands:

```text
viewport create plan scale 1:100
viewport create axon scale fit
viewport lock selected
```

### 3. Printing Drawings

Early output formats:

```text
SVG
PDF later
PNG later
```

Future command:

```text
print current sheet
export pdf
export svg
```

Printing checklist:

- correct title block
- correct drawing scale
- line weights readable
- dimensions visible
- room names visible
- revision field filled

### 4. Part 6.1 Checklist

The user should be able to:

- Understand model space vs paper space.
- Create a page setup.
- Create a viewport.
- Set viewport scale.
- Prepare drawing for print/export.

## Part 6.2: Preparing A Block Library, Creating Templates And Standard Drawings

### 1. Block Library

A block library stores reusable components.

Recommended folders:

```text
blocks/doors
blocks/windows
blocks/fixtures
blocks/furniture
blocks/annotations
blocks/title-blocks
blocks/details
```

Block metadata:

```text
name
category
base_point
width
depth
height
layer
tags
version
```

### 2. Templates

Templates define project standards.

Template contents:

- units
- grid
- layers
- line weights
- text styles
- dimension styles
- title block
- default blocks
- sheet setup

Example:

```text
template hotel_room
template residential_plan
template bathroom_layout
```

### 3. Standard Drawings

Standard drawings are reusable starting points.

Examples:

- hotel room plan
- bathroom plan
- kitchen layout
- stair detail
- door schedule
- reflected ceiling plan

Future command:

```text
new from template hotel_room
insert standard bathroom_01
```

### 4. AI Use Later

AI should use templates and block libraries instead of inventing random geometry.

Example:

```text
Prompt:
Create a compact hotel room using standard blocks.

AI command chain:
new from template hotel_room
insert block bed_queen at 4,8
insert block desk_1200 at 12,5
insert block bathroom_pod_01 at 0,0
dimension room
```

### 5. Part 6.2 Checklist

The user should be able to:

- Understand a block library.
- Understand templates.
- Reuse standard drawings.
- Prepare project standards.
- See how AI will use approved blocks/templates.
