const fs=require('fs');
for(const fn of ['index.html','draft.html']){
let s=fs.readFileSync(fn,'utf8');
const addon='<script src="src/ace-recruitment-v1.js"></script>';
if(s.includes(addon))continue;
const marker='<script src="src/overall.js"></script>';
if(!s.includes(marker))throw Error('No overall source '+fn);
s=s.replace(marker,marker+addon);
fs.writeFileSync(fn,s);
}
