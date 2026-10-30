#!/bin/sh
# Rebuild dist/TheCage.exe from the current index.html and src/players.js. Run from anywhere.
set -e
cd "$(dirname "$0")"
node --experimental-sea-config sea-config.json
mkdir -p ../dist
cp "$(command -v node)" ../dist/TheCage.exe
npx --yes postject@1.0.0-alpha.6 ../dist/TheCage.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
echo "Built ../dist/TheCage.exe"
