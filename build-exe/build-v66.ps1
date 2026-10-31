$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location $root
python tools/package-v5-web.py
if($LASTEXITCODE -ne 0){throw 'Could not rebuild static game assets'}
python tools/build-sea-config.py
if($LASTEXITCODE -ne 0){throw 'Could not regenerate SEA manifest'}
Set-Location $PSScriptRoot
node --experimental-sea-config sea-complete.json
if($LASTEXITCODE -ne 0){throw 'Could not compile Node single-executable blob'}
$node=(Get-Command node.exe).Source
$target=Join-Path $root 'dist\TheCage-V66-Last-Line-Experimental.exe'
New-Item -ItemType Directory -Force (Join-Path $root 'dist') | Out-Null
Copy-Item $node $target -Force
cmd /c ('npx --yes postject@1.0.0-alpha.6 "'+$target+'" NODE_SEA_BLOB "'+(Join-Path $PSScriptRoot 'sea-complete.blob')+'" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2')
if($LASTEXITCODE -ne 0){throw 'Postject injection failed'}
Get-Item $target | Select-Object FullName,Length,LastWriteTime
'V66_EXPERIMENTAL_WINDOWS_EXE_BUILT'
