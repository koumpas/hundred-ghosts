#!/bin/sh
# Copies the current reference code into the skill folder. usage: tools/build-skill.sh
set -e
cd "$(dirname "$0")/.."
D=skill/swarm-playtest/reference/hundred-ghosts
rm -rf "$D"; mkdir -p "$D/tools" "$D/log/reviews"
cp sim.js render.js main.js index.html viewer.html post.html README.md package.json "$D/"
cp tools/serve.mjs tools/run-swarm.mjs tools/cut.sh tools/release.sh tools/review-pack.mjs tools/export.mjs tools/verify.mjs tools/probe.js tools/diag.js tools/jump.js tools/quick.js tools/render-post.mjs tools/music.py "$D/tools/"
cp log/reviews/PANEL.md "$D/log/reviews/"
{ echo "# The 12 version commits of Hundred Ghosts"; echo; echo "Each message states the measurement and the change. Use them as examples."; for n in 1 2 3 4 5 6 7 8 9 10 11 12; do echo; echo '```'; git log -1 --format=%B "v$n" | grep -v '^Co-Authored-By'; echo '```'; done; } > "$D/COMMITS.md"
du -sh skill/swarm-playtest | cat; find skill -type f | wc -l
