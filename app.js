const STORAGE_KEY="pexfo-mess-tracker-v2";
const LEGACY_KEY="pexfo-mess-tracker-v1";
const $=id=>document.getElementById(id);
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
let state=loadState(),view=new Date(),extraView=new Date(),selected=null,deferredInstall=null;
view.setDate(1);extraView.setDate(1);
function loadState(){
  try{
    let raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)raw=localStorage.getItem(LEGACY_KEY);
    const old=raw?JSON.parse(raw):{};
    // Migrate the first prototype's plain date->status object without losing entries.
    if(old && typeof old==="object" && !Array.isArray(old)){
      const records=old.records && typeof old.records==="object"?old.records:
        Object.fromEntries(Object.entries(old).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&["ate","skip"].includes(v)));
      return {rate:Number(old.rate)||140,records,extras:Array.isArray(old.extras)?old.extras:[]};
    }
  }catch{}
  return {rate:140,records:{},extras:[]};
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);}
function key(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function prefix(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-`;}
function monthLabel(date){return date.toLocaleDateString("en-IN",{month:"long",year:"numeric"});}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200);}
function showTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  ["mess","extras","settings"].forEach(n=>$(n+"Tab").hidden=n!==name);
  if(name==="extras")renderExtras();
  if(name==="settings")$("dailyRate").value=state.rate;
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));

function renderMess(){
  const y=view.getFullYear(),m=view.getMonth(),totalDays=new Date(y,m+1,0).getDate(),p=prefix(view);
  const entries=Object.entries(state.records).filter(([k])=>k.startsWith(p));
  const ate=entries.filter(([,v])=>v==="ate").length,skip=entries.filter(([,v])=>v==="skip").length;
  $("monthTitle").textContent=monthLabel(view);$("billAmount").textContent=money(ate*state.rate);
  $("billFormula").textContent=`${ate} full ${ate===1?"day":"days"} × ${money(state.rate)}`;
  $("atePriceLabel").textContent=money(state.rate);$("ateCount").textContent=ate;$("skipCount").textContent=skip;$("savedAmount").textContent=money(skip*state.rate);
  $("sumAte").textContent=ate;$("sumSkip").textContent=skip;$("sumUnmarked").textContent=totalDays-ate-skip;
  $("sumBill").textContent=money(ate*state.rate);$("markedDays").textContent=`${ate+skip} marked`;
  $("weekdays").innerHTML=weekdays.map(d=>`<div>${d}</div>`).join("");
  let html="";for(let i=0;i<new Date(y,m,1).getDay();i++)html+="<div></div>";
  const today=new Date();
  for(let d=1;d<=totalDays;d++){
    const k=key(y,m,d),status=state.records[k]||"",isToday=y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate();
    html+=`<button class="day ${status} ${isToday?"today":""} ${selected===k?"selected":""}" data-date="${k}" aria-label="${k} ${status||"not marked"}">${d}</button>`;
  }
  $("calendar").innerHTML=html;$("calendar").querySelectorAll("[data-date]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.date;renderMess();}));
  if(selected){$("selection").hidden=false;$("selectedDate").textContent=new Date(selected+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});const s=state.records[selected];$("selectedHint").textContent=s==="ate"?"Marked as ate all meals":s==="skip"?"Marked as skipped":"Not marked yet";}else $("selection").hidden=true;
}
function setMessStatus(status){if(!selected)return;state.records[selected]=status;save();renderMess();toast(status==="ate"?"Marked: ate all meals":"Marked: skipped");}
$("markAte").addEventListener("click",()=>setMessStatus("ate"));$("markSkip").addEventListener("click",()=>setMessStatus("skip"));
$("clearDay").addEventListener("click",()=>{if(selected){delete state.records[selected];save();renderMess();toast("Date cleared");}});
$("closeSelection").addEventListener("click",()=>{selected=null;renderMess();});
$("prevMonth").addEventListener("click",()=>{view.setMonth(view.getMonth()-1);selected=null;renderMess();});
$("nextMonth").addEventListener("click",()=>{view.setMonth(view.getMonth()+1);selected=null;renderMess();});

function renderExtras(){
  const p=prefix(extraView),items=state.extras.filter(x=>x.date.startsWith(p)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  const total=items.reduce((s,x)=>s+x.price,0);
  $("extraMonthTitle").textContent=monthLabel(extraView);$("extrasMonthLabel").textContent=monthLabel(extraView)+" · separate from mess bill";
  $("extrasTotal").textContent=money(total);$("extrasCount").textContent=items.length;
  $("extrasAverage").textContent=money(items.length?total/items.length:0);$("extraMonthCount").textContent=`${items.length} entries`;$("extrasListTotal").textContent=money(total);
  $("extrasList").innerHTML=items.length?items.map(x=>`<div class="extra-entry"><div class="entry-main"><b>${escapeHtml(x.name)}</b><small>${new Date(x.date+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</small></div><div class="entry-actions"><span class="entry-price">${money(x.price)}</span><button class="delete-entry" data-delete="${x.id}" aria-label="Delete ${escapeHtml(x.name)}">×</button></div></div>`).join(""):'<div class="empty-list">No extra expenses this month. Add your tea, snacks, shakes, etc. above.</div>';
  $("extrasList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{if(confirm("Delete this extra expense?")){state.extras=state.extras.filter(x=>x.id!==Number(b.dataset.delete));save();renderExtras();toast("Expense deleted");}}));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("extraDate").value=new Date().toISOString().slice(0,10);
$("extraForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("extraName").value.trim(),price=Number($("extraPrice").value),date=$("extraDate").value;
  if(!name||!date||!Number.isFinite(price)||price<=0){toast("Enter a valid item name, price and date");return;}
  state.extras.push({id:Date.now(),name,price:Math.round(price*100)/100,date});save();
  extraView=new Date(Number(date.slice(0,4)),Number(date.slice(5,7))-1,1);
  $("extraName").value="";$("extraPrice").value="";$("extraDate").value=new Date().toISOString().slice(0,10);
  renderExtras();toast("Extra expense added");
});
$("extraPrevMonth").addEventListener("click",()=>{extraView.setMonth(extraView.getMonth()-1);renderExtras();});
$("extraNextMonth").addEventListener("click",()=>{extraView.setMonth(extraView.getMonth()+1);renderExtras();});
$("rateForm").addEventListener("submit",e=>{
  e.preventDefault();const n=Number($("dailyRate").value);
  if(!Number.isFinite(n)||n<0){toast("Enter a valid daily price");return;}
  state.rate=Math.round(n*100)/100;save();renderMess();toast("Daily mess price saved");
});

function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("exportBtn").addEventListener("click",()=>{
  const rows=[["Type","Date","Name / Status","Price (INR)"],...Object.entries(state.records).sort(([a],[b])=>a.localeCompare(b)).map(([d,s])=>["Mess",d,s,s==="ate"?state.rate:0]),...state.extras.map(x=>["Extra",x.date,x.name,x.price])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  download("pexfo-mess-and-extras.csv","\uFEFF"+csv,"text/csv;charset=utf-8");toast("CSV exported");
});
$("backupBtn").addEventListener("click",()=>download("pexfo-mess-backup.json",JSON.stringify({app:"PEXFO Mess Tracker",version:2,rate:state.rate,records:state.records,extras:state.extras},null,2),"application/json"));
$("restoreBtn").addEventListener("click",()=>$("restoreFile").click());
$("restoreFile").addEventListener("change",async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const d=JSON.parse(await f.text()),records=d.records||{},extras=Array.isArray(d.extras)?d.extras:[];if(!records||typeof records!=="object"||Array.isArray(records))throw Error();
    const clean={};for(const [k,v] of Object.entries(records))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&["ate","skip"].includes(v))clean[k]=v;
    const cleanExtras=extras.filter(x=>x&&typeof x.name==="string"&&Number.isFinite(Number(x.price))&&Number(x.price)>0&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)).map(x=>({id:Number(x.id)||Date.now()+Math.random(),name:x.name.slice(0,50),price:Number(x.price),date:x.date}));
    state={rate:Number.isFinite(Number(d.rate))&&Number(d.rate)>=0?Number(d.rate):state.rate,records:clean,extras:cleanExtras};save();renderMess();renderExtras();$("dailyRate").value=state.rate;toast("Backup restored");
  }catch{toast("Invalid backup file");}e.target.value="";
});
$("historyBtn").addEventListener("click",()=>{
  const box=$("history");box.hidden=!box.hidden;if(box.hidden)return;
  const entries=Object.entries(state.records).sort(([a],[b])=>b.localeCompare(a));
  box.innerHTML=entries.length?entries.map(([d,s])=>`<div class="history-row"><span>${new Date(d+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span><span style="color:${s==="ate"?"#58d7a8":"#ef8490"}">${s==="ate"?"Ate all · "+money(state.rate):"Skipped · ₹0"}</span></div>`).join(""):'<p class="history-empty">No mess records yet.</p>';
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
$("dailyRate").value=state.rate;renderMess();renderExtras();