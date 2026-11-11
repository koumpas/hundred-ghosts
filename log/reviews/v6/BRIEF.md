# Playtest brief - build 6 of "Hundred Ghosts"

Hundred Ghosts is a 2D side-view obstacle-course platformer with 8 short stages. You cannot hold the controller, so you get recorded runs.

For each stage you get two images (absolute paths below):
- `sK-bot50.png`: 6 frames, in time order, of one recorded run of a mid-skill player. The last frame shows the goal or the death.
- `sK-end.png`: 100 recorded players ("ghosts") on the same stage at the end of the run. Red glow = where players died. The bottom strip shows the whole stage.

Recorded results of three players (low, mid, high skill) on each stage:

| stage | name | low-skill player | mid-skill player | high-skill player |
|---|---|---|---|---|
| 1 | First Steps | reached goal in 10.3 s | reached goal in 16.5 s | reached goal in 10.0 s |
| 2 | Spike Garden | died: spike at 73% of the stage | reached goal in 12.6 s | reached goal in 25.1 s |
| 3 | Saw Mill | died: saw at 50% of the stage | died: saw at 50% of the stage | reached goal in 9.9 s |
| 4 | Ferry Lines | reached goal in 14.3 s | reached goal in 12.7 s | reached goal in 14.2 s |
| 5 | Crumble Bridge | died: saw at 61% of the stage | reached goal in 9.4 s | reached goal in 9.3 s |
| 6 | Spring Loaded | gave up (no way forward found in 45 s) at 37% of the stage | gave up (no way forward found in 45 s) at 38% of the stage | gave up (no way forward found in 45 s) at 38% of the stage |
| 7 | Laser Gate | died: laser at 85% of the stage | reached goal in 12.6 s | reached goal in 12.4 s |
| 8 | Gauntlet | died: spike at 77% of the stage | reached goal in 13.7 s | died: laser at 68% of the stage |

Images:
- stage 1: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s1-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s1-end.png
- stage 2: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s2-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s2-end.png
- stage 3: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s3-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s3-end.png
- stage 4: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s4-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s4-end.png
- stage 5: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s5-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s5-end.png
- stage 6: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s6-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s6-end.png
- stage 7: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s7-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s7-end.png
- stage 8: /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s8-bot50.png and /Users/alexkoumpas/Library/Application Support/Claude/scratch-workspaces/c442d49c-c1d3-4995-9b30-01415c89d8cb/cf14803e-75ca-4eb9-bc88-6fb66790f512/scratch-2026-11-11-b5d528/hundred-ghosts/shots/v6/s8-end.png

Judge only what you see: fairness (does a death look like the player's fault?), difficulty curve from stage 1 to 8, variety, how clear the screen is, and how much you would want to play it. A stage that nobody can finish, or that everybody finishes with no risk, is a defect.
