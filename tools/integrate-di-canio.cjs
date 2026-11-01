const fs=require('fs');
for(const fn of ['index.html','draft.html']){
let html=fs.readFileSync(fn,'utf8');
const prev='<script src="src/ace-recruitment-v1.js"></script>';
const newTag='<script src="src/di-canio-recruitment-v1.js"></script>';
if(!html.includes(newTag)){if(!html.includes(prev))throw Error('missing predecessor '+fn);html=html.replace(prev,prev+newTag);fs.writeFileSync(fn,html);}
}
