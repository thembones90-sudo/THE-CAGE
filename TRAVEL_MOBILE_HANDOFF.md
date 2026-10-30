# THE CAGE Travel / Mobile Handoff
Checkpoint: c2833fd on codex/t3-tactical-space. Experimental T3 is not approved; default v0.4 is preserved.
The current HTML has a mobile viewport and narrow-screen CSS, but full touch/mobile QA and hosting are not complete.
For another town: localhost/127.0.0.1 on your phone does NOT connect to the home PC. Windows EXE does not run on a phone. A hosted HTTPS web build is required for mobile play.
GitHub currently blocked: No git remote configured, and GitHub CLI is not authenticated. The connected account is thembones90-sudo; there was no owned THE-CAGE repo.
Create a PRIVATE GitHub repo named THE-CAGE without initializing README, then on SKYNET:
1. gh auth login
2. Set-Location 'A:\THE CAGE'
3. git remote add origin https://github.com/thembones90-sudo/THE-CAGE.git
4. git push -u origin codex/t3-tactical-space
No force push. Don't publish as public without review.
GitHub Mobile can inspect source and commits, but editing/testing requires browser IDE or computer. Local run: node tools/serve.mjs; http://127.0.0.1:4173/ .
The portable Git bundle in project parent directory contains commit history, not ignored build artifacts or Windows EXEs.
