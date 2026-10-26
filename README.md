# Nalaro Cowork

A personal 3D office simulation inspired by the blocky visual language of Minecraft and Roblox. Nine stylized employees move, work, and receive owner commands. Groq is optional: **idle behavior, navigation, and animation run locally without AI calls**.

## Features in v0.2
- Original procedural voxel avatars for **Ulum, Adi, Agil, Ulin, Lukman, Siswo, Huda, Fadil, Sumanto**, with distinct hairstyles, simple faces, role outfits and accessories.
- Lightweight Three.js office: desks, chairs, glass facade, pantry, meeting, lounge.
- Floating nicknames, clickable staff, orbit/zoom camera, adaptive pixel ratio.
- Context-aware weighted idle behaviors; anti-repeat and staggered timing.
- Simple A* office pathfinding and priority command queue.
- Commands such as `@fadil samperin lukman dan suruh berdiri`, `@ulum melambaikan tangan`, `@adi pergi ke ruang meeting`.
- Optional Groq GPT-OSS 20B planner for commands not covered by deterministic parser.
- Localhost API proxy. Groq API key never leaves the server.

**Important:** This is a playable simulation foundation, not an autonomous coding agent. No repo access, shell execution, invoice processing, or real business operations have been enabled.

## Start

Requires Node.js 20.19+ / 22.12+ and a WebGL2-compatible browser.

```bash
git clone https://github.com/khoirulzz/nalarocowork.git
cd nalarocowork
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**. The office works without a Groq key; familiar commands are parsed locally.

### Optional Groq

```bash
cp .env.example .env
# Edit .env: GROQ_API_KEY=gsk_...
npm run server
```

Keep `npm run dev` running in another terminal. The server listens on `127.0.0.1:8787`. A successful connection changes the interface status to “Groq siap”.

Unfamiliar commands use Groq Structured Outputs to produce up to seven validated movement and interaction steps. Unsupported real-world actions are rejected instead of faked.

### Checks
```bash
npm test
npm run build
```

## Source code

```
src/
  main.js       # Three.js scene, UI, camera, dashboard
  office.js     # interior and obstacle-based pathfinding
  avatars.js    # modular low-poly rig and voxel faces/hair/outfits
  behaviors.js  # idle scheduler + animation state + task queue
  commands.js   # no-token command parser, normalized plans, Groq client
  roster.js     # 9 character identities and office anchors
  styles.css    # panel design and responsive layout
server/index.mjs # optional localhost Groq proxy
docs/            # architecture & asset standards
tests/           # command and plan sanity checks
```

## Art direction
This is a custom implementation, not a redistributed fork. The avatar profiles were art-directed from provided photos, but **no original photos or photographic face textures are committed** because this is a public GitHub repository. If sharing likeness-based models more broadly, obtain your friends' permission. Different employees share a common pivot-rig hierarchy and can be swapped for detailed GLB models later.

## Development status
**MVP foundation, v0.2**. Animation is procedural, simplified and not full inverse kinematics; characters cannot physically pick up arbitrary objects yet. Pathfinding is coarse grid A* and needs additional QA around furniture. GitHub Actions verifies syntax/build, but visual and FPS testing on the target older laptop are necessary before calling it production-ready.

## Roadmap
1. GLB asset loading and more personalized rig/face polish; LOD/material merge for GPU.
2. Improved navigation, chair alignment, social interactions and animation blending.
3. Persist tasks and office world across sessions.
4. NalaroStore / GitHub connections with role-based permissions and approval gates.
