# Office v0.3: World & Behavior Contract

## Scene geometry
- Coordinates: x ~ [-16,16], z ~ [-11,11], 1 unit ~= 1 meter.
- Partition meshes and collision volumes are created from the same functions.
- Each private room has a real doorway gap to support A* pathfinding. Don't put props across openings.
- Area anchors: `PLACES` in roster.js. Seated anchors: `SEATS` in behaviors.js.

## Asset registry
- `WORLD_OBJECTS: Map<string, OfficeObject>`
- `OfficeObject`: `id, type, label, x, y, z, portable, actions, mesh, interaction, owner`.
- IDs are stable. E.g. `document_finance`, `coffee_machine`, `chair_owner`.
- `take_object` works on portable objects when inventory is empty; holds a low-poly prop at character hand.
- `make_coffee` uses an available coffee cup from the counter. It is not a real-time physics fluid simulation.
- `place_object` delivers to a staff member or a location; models move/ownership changes in world state.
- Avoid classifying nonportable desks/computers as portable. Add new props via `put()` in office.js and update command schema.

## Scheduling & priority
- **Explicit owner commands outrank idles**, and an action has a travel phase followed by an interaction phase.
- Agent idle routines are long sessions chosen from weighted role-specific lists with anti-repeat penalty.
- Staff return to their own stations. OB rotates through an assigned coverage route, rather than converging at one place.
- Navigation obstacles include physical furniture and dynamic staff positions. Route failure halts safely.
- Each staff carries at most one item. Interaction must verify object availability.
- Groq does not control every movement frame; it only returns structured plans.

## Groq network
- Same-origin Vite middleware intercepts `/api/plan` and `/api/health`.
- Key read by Vite Node process from `.env`; no VITE_ variables, no localStorage for secrets.
- Payload contains max 500 character request + compact context; requests serialized for token budget.
- JSON schema limits actors, actions, places; client validates object IDs.
- Complex actions unsupported by the simulation produce empty or rejected plan, not fake completion.

## Non-goals (v0.3)
- Fully collision-perfect navmesh / agent steering in all edge cases.
- Full-body realistic IK for taking coffee or cleaning.
- Agents performing actual NalaroStore, GitHub, finance, or development work.
- Reconstructing friends' faces photorealistically.
