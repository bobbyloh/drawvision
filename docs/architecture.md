# DrawVision Architecture

## Language Strategy

DrawVision should not start with one language for everything. It should use each language where it fits.

## Current Prototype

- HTML/CSS/JavaScript
- Runs in browser and GitHub Pages
- Good for rapid UI, command prompt, drawing workflow, and AI-command experiments
- Product frame: sketch-to-insight, where sketches and command input become structured visuals and measurable design data

## Near-Term Production Direction

- TypeScript for the main CAD application logic
- Pure geometry modules separated from UI
- Browser-first deployment
- JSON project format as the first native file format

## Performance-Critical Future Direction

- C++ compiled to WebAssembly for heavy geometry operations
- Boolean operations
- Mesh generation
- STL/OBJ processing
- Large model performance

## Scripting And AI Automation

- Python for scripting workflows, batch conversion, testing utilities, and AI agent pipelines
- AI should generate DrawVision command chains, not direct pixel edits

Example:

```text
Prompt:
Create a 12 by 16 ft room and extrude walls to 10 ft.

Command chain:
input poly 0,0 12,0 12,16 0,16 close
offset selected 0.5
extrude selected z 10
group selected as room_01
```

## Recommended Stack

- UI: HTML/CSS/TypeScript
- Geometry core: TypeScript first, C++/WASM later
- Automation: Python
- File format: DrawVision JSON first
- Export targets: SVG, DXF, STL, OBJ
- Testing: Node test runner for core logic, browser integration tests later
