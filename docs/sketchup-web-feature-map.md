# DrawVision SketchUp Web Feature Map

This map tracks browser-specific SketchUp Web concepts that are useful for DrawVision.

## App Settings

- General: autosave, template/unit default, grid size, snap spacing.
- Accessibility: axis colors, inference color, high contrast.
- Navigation: mouse/trackpad preference, invert zoom/pan, sensitivity.
- Memory: local model size estimate, warnings, undo cleanup, optimize now.

## Using SketchUp Web

- DrawVision uses a command-first search/prompt instead of hiding tools behind icons.
- `search <concept>` is the local equivalent of SketchUp Web Search.
- `Shift+S` or `?` focuses the command prompt with `search `.
- Display commands should not cancel active tools.

## Web Feature Limits

- No Ruby extensions in the browser model.
- Dynamic components are deferred.
- Browser-reserved shortcuts should not be required.
- High-resolution printing is deferred; use SVG/JSON export first.

## Creating And Editing Model Panels

- Entity Info: current right tray.
- Outliner: future hierarchical model tree.
- Instructor: current status/tool hints, future tutorial panel.
- Components: future block/component system.
- Materials: visualization tray placeholder.
- Styles: visualization tray placeholder.
- Environments: visualization tray placeholder.
- Tags: mapped to current layers.
- Shadows/Display: future display settings.
- Model Info: current env/settings structure.
- Solid Inspector: future geometry validator.

## Visualization

- Materials panel should manage material definitions and selected-object assignment.
- PBR/WebGPU support is future work.
- Styles should remain preset-driven first: normal, high contrast, hidden dashed, nodes visible.
- Environments are future background/light presets.
- AI render is staged as an assistant workflow after SVG/model capture is stable.

## AI Assistant

- AI Help maps to command search and command explanation.
- Generate Object maps to prompt-to-command-chain generation.
- AI Render maps to viewport export plus prompt/style rendering.
- All AI-generated geometry should be reviewed before execution.

## Add Location

- Store geolocation metadata on the project.
- Track true north separately from model axes.
- Flat site, elevated terrain, map texture, terrain mesh, and 3D buildings are future import targets.
- Geolocation content should map to tags/layers for visibility control.

## Materials

- Initial implementation should support named material presets and selected-object assignment.
- Texture maps, metalness, roughness, normal maps, and AI texture generation are future rendering-layer work.
