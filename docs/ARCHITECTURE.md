# Nalaro Cowork — Architecture v0.2

## Guiding principles
- Browser scene (Three.js) runs every frame locally; Groq is NEVER called for idle movement or animation.
- Owner dashboard is private/local first. There is no login/user management in MVP.
- Character nicknames are canonical stable IDs. Commands cannot execute shell or network tools.
- All AI plans are validated by server and by the client before any 3D state change.
- UI and character rigs are authored independently. Future GLB replacements can share anchor points.
- No actual photo references, face crops, secrets, or personal biometrics in source control.

## Runtime
```
Vite web app → Simulation + Procedural Avatar Rig
             → Behavior scheduler + simple navigation
             → Command parser (no tokens for common commands)
             → Optional localhost Groq proxy → GPT-OSS 20B structured JSON
```

## Modules
- `src/roster.js`: nickname, colorway, hairstyle, office spots.
- `src/avatars.js`: 3D articulated voxel avatar, outfit details, ID/name labels.
- `src/office.js`: walls, furnishings, desk layout, walkable office.
- `src/behaviors.js`: idle weights, variable duration, movement, per-character action queues.
- `src/commands.js`: deterministic commands and JSON validation.
- `src/main.js`: application setup, scene loop, dashboard interaction.
- `server/index.mjs`: optional Groq structured-output proxy.

## Privacy / safety
Original reference photos and cropped texture versions are excluded. Uploading personal photos to a public repository requires separate explicit approval. Local-only files go in `private-assets/`, ignored by Git.
Groq receives only the minimal command and employee-state context. Never ship an API key in `VITE_*` variables or browser requests.
The current engine is **a simulated office**, not a real autonomous repo-working agent. Connecting NalaroStore/GitHub later requires explicit least-privilege permissions and sandboxed tools.

## TODO / phased delivery
1. Avatar model polishing and performant GLB import.
2. Navmesh/pathfinding around obstacles (current routing uses a lightweight graph).
3. Interaction-aware IK (reaching, carrying, sitting alignment).
4. Owner control / agent task queue persistence.
5. Optional project integrations with human approval.
