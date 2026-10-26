# Avatar asset direction

Nine art-directed, lightweight, block-based characters:
Ulum (CEO), Adi (CS), Agil (OB), Ulin (OB), Lukman (Accountant), Siswo (Technician), Huda (Designer), Fadil (Assistant), Sumanto (CS).

## Source policy
The original employee photos are **not** included in the public repository.
`src/roster.js` contains illustrated colorway / hairstyle parameters; it is not a face recognition model.
Reference photos should remain in a private local folder and be used only with consent.
Procedural characters share one articulated hierarchy and can be replaced by GLB rigs later.

## Polishing pass
- Hair: wavy, quiff, curly, straight fringe, tight curls, short cropped, textured, curly front, swept.
- Face: micro-variations in brow density, eyes, mouth, ears, and face silhouette; no photorealistic reconstruction.
- Outfits: blue-gray customer service headset, olive/beige OB clothing, patterned collar for accountant, orange assistant layer, dark CEO blazer, tablet for designer, utility patches for technician.
- Identity: nickname displayed above the head; subtitle shown on hover/selection rather than constant labels.
- Meshes: BoxGeometry and shared materials, no 4K maps, no enormous external skins; target low GPU memory.
- Rig: head, left/right arm, left/right leg pivots; animations are generated at runtime.
