// Nachbau von SpreadsheetApp & Co., um apps-script/Code.gs lokal zu testen.
// Start: node tests/gas-mock.cjs apps-script/Code.gs  ->  http://localhost:8788/exec?code=geheim42
// Führt Code.gs mit einem nachgebauten SpreadsheetApp aus
const fs = require("fs"), http = require("http"), vm = require("vm");
const sheets = {};
function mkSheet(name){ const rows=[]; return {
  name, rows,
  getLastRow:()=>rows.length,
  getLastColumn:()=>Math.max(0,...rows.map(r=>r.length)),
  appendRow:r=>rows.push([...r]),
  setFrozenRows(){}, deleteRow:i=>rows.splice(i-1,1),
  getRange:(r,c,nr=1,nc=1)=>({
    getValues:()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>{const v=(rows[r-1+i]||[])[c-1+j];return v===undefined?"":v;})),
    setValue:(v)=>{rows[r-1]=rows[r-1]||[];rows[r-1][c-1]=v;},
    setValues:(v)=>v.forEach((row,i)=>{rows[r-1+i]=rows[r-1+i]||[];row.forEach((x,j)=>rows[r-1+i][c-1+j]=x);}),
    setNumberFormat(){return this}, setFontWeight(){return this},
  }),
};}
const ctx = {
  SpreadsheetApp:{ getActive:()=>({ getSheetByName:n=>sheets[n]||null, insertSheet:n=>(sheets[n]=mkSheet(n)), getSpreadsheetTimeZone:()=>"Europe/Berlin"}), flush(){} },
  PropertiesService:{ getScriptProperties:()=>({ getProperty:k=>(k==="CODE"?process.env.GAS_CODE??"geheim42":null) }) },
  LockService:{ getScriptLock:()=>({waitLock(){},releaseLock(){}}) },
  ContentService:{ MimeType:{JSON:"json"}, createTextOutput:t=>({t,setMimeType(){return this}}) },
  Utilities:{ formatDate:(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` },
  Set, Date, JSON, String, Number, Object,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2],"utf8"), ctx);
http.createServer((req,res)=>{
  let b=""; req.on("data",d=>b+=d); req.on("end",()=>{
    const u=new URL(req.url,"http://x");
    if(u.pathname==="/__sheets"){res.end(JSON.stringify(Object.fromEntries(Object.entries(sheets).map(([k,v])=>[k,v.rows]))));return;}
    const out = req.method==="POST" ? ctx.doPost({postData:{contents:b}}) : ctx.doGet({parameter:Object.fromEntries(u.searchParams)});
    res.setHeader("Access-Control-Allow-Origin","*"); res.setHeader("Content-Type","application/json"); res.end(out.t);
  });
}).listen(8788,()=>console.log("gas ready"));
