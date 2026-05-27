# DrawVision SketchUp Web Adoption Map

DrawVision is a browser CAD workspace, so the web-specific SketchUp workflow is relevant. The adopted ideas are model lifecycle, home workspace, visible save state, web-friendly open/download, and persistent local work.

## Adopted Concepts

- Home screen with `New Model`, `Open JSON`, and `Continue Current`.
- Recent local models list from browser storage.
- Save status in the top bar.
- `file save` writes to browser `localStorage`.
- `file open` reads a local DrawVision JSON model.
- `download model` / `export json` downloads a portable JSON file.
- `export svg` downloads the current viewport as SVG.
- `share` reports the current browser URL and advises JSON export for portable sharing.
- Browser restore attempts to reload the last local model on startup.

## Command Mapping

- `home` opens the home workspace.
- `home close` returns to the model workspace.
- `file new` creates a clean model.
- `file open` launches the browser file picker.
- `file save` saves locally.
- `file save as` renames and saves locally.
- `download model` exports DrawVision JSON.
- `export svg` exports the current view.
- `share` exposes the current browser URL.

## Intentional Difference From SketchUp Web

DrawVision does not depend on a cloud identity provider. Browser storage is local-first. Portable sharing should use JSON export until a proper backend or GitHub-backed project store is added.

## Next Web Priorities

1. Add true model thumbnails to recent models.
2. Add explicit import for images/SVG/DXF.
3. Add project folders and named scenes.
4. Add web-safe autosave version history.
5. Add a local backend API for relational object storage.
