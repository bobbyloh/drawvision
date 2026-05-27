# DrawVision Weeks-Based MVP Plan

Goal: build a usable architectural CAD prototype in weeks, not a full CAD clone.

## What We Can Realistically Build In Weeks

- Browser-based 2D CAD workspace.
- 1:1 architectural grid.
- Command prompt.
- Keyboard shortcuts.
- Draw line/poly/circle/text.
- Select by click and box.
- Move/copy/repeat.
- Measure distance.
- Simple extrusion metadata and axon preview.
- Layers/tags.
- Save/open/export JSON.
- SVG export.
- AI prompt-to-command-chain prototype.

## What Must Be Deferred

- Full solid modeling kernel.
- Robust boolean operations.
- True parametric constraint solver.
- Production DXF round-trip.
- IFC/BIM-level data model.
- Large model acceleration.
- Native desktop app.

## 4 Week Plan

### Week 1: Stable CAD Skeleton

- Modularize code.
- Finish SketchUp-like UI layout.
- Working command prompt.
- Drawing tools: line, poly, circle, text.
- Selection: click, box-in, crossing.
- Save/open JSON.

### Week 2: Editing Workflow

- Move from point to point.
- Copy/repeat by N.
- Rotate X/Y/Z.
- Measure distance.
- Delete line/poly.
- Flatten Z0.
- Layer visibility.
- Basic SVG export.

### Week 3: Architectural Usefulness

- Dimensions.
- Text annotations.
- Groups/components.
- Simple extrusion preview.
- View presets: plan, elevations, axon.
- Improve mobile/touch support.

### Week 4: AI Command Bridge

- Natural language to DrawVision command chains.
- Preview generated commands before execution.
- Command history replay.
- Project templates.
- User acceptance testing with remembered DrawVision workflows.

## Definition Of Success

The MVP is successful if Bob can:

- Open DrawVision from a browser.
- Draw a basic architectural plan at 1:1 scale.
- Use remembered commands like `input line`, `input poly`, `gen cir`, `move from . to .`.
- Select and edit objects.
- Save and reload a project.
- Export a shareable drawing.
- Ask AI to generate editable command chains.
