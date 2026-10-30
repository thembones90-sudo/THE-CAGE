# TheCage.exe builder

Packs the current game (index.html + src/*.js) into one Windows exe using Node's built-in
single-executable support. The exe starts a local server on 127.0.0.1 and opens the default browser.

Rebuild after the game changes (needs Node 24; downloads postject via npx on first run):

    sh "A:/THE CAGE/build-exe/build.sh"

Output: A:\THE CAGE\dist\TheCage.exe (a snapshot; it does not pick up later edits until rebuilt).
If index.html starts loading new files, add them to BOTH sea-config.json "assets" and ASSETS in launcher.js.
