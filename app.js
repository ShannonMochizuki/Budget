const VERSION='1.0.5',KEY='budgetCompassDataV1';
const cats=['Food & Drinks','Transport','Groceries','Shopping','Bills','Home','Entertainment','Health','Gifts','Other'];
const defaults={transactions:[],budgets:{'Food & Drinks':600,Transport:150,Groceries:350,Shopping:200,Bills:500,Home:200,Entertainment:150,Health:100,Gifts:100,Other:150},recurring:[],goals:[]};
let data=load(),deferredPrompt=null; const $=x=>document.getElementById(x),money=n=>'S$'+Number(n||0).toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});
function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return structuredClone(defaults)}} function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function monthKey(d){return d.slice(0,7)} const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,mk=today.slice(0,7); $('date').value=today;$('monthName').textContent=now.toLocaleDateString('en-SG',{month:'long',year:'numeric'});
for(const id of ['category','recCategory']) $(id).innerHTML=cats.map(c=>`<option>${c}</option>`).join('');
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===b.dataset.tab))});
$('type').onchange=()=>{let exp=$('type').value==='expense';$('catBox').style.display=exp?'':'none';$('payBox').style.display=exp?'':'none'};
$('txnForm').onsubmit=e=>{e.preventDefault();let amount=Number($('amount').value);if(!(amount>0))return;data.transactions.push({id:Date.now(),type:$('type').value,amount,category:$('category').value,desc:$('desc').value.trim(),date:$('date').value,payment:$('payment').value});e.target.reset();$('date').value=today;$('type').value='expense';$('type').onchange();save()};
$('recForm').onsubmit=e=>{e.preventDefault();let a=Number($('recAmount').value);if(!(a>0))return;data.recurring.push({id:Date.now(),name:$('recName').value.trim(),amount:a,category:$('recCategory').value});e.target.reset();save()};
$('goalForm').onsubmit=e=>{e.preventDefault();let t=Number($('goalTarget').value),m=Number($('goalMonthly').value);if(!(t>0)||m<0)return;data.goals.push({id:Date.now(),name:$('goalName').value.trim(),target:t,monthly:m});e.target.reset();save()};
function remove(kind,id){data[kind]=data[kind].filter(x=>x.id!==id);save()} window.rm=remove;
function render(){let tx=data.transactions.filter(t=>monthKey(t.date)===mk),expenses=tx.filter(t=>t.type==='expense'),income=tx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0),spent=expenses.reduce((a,t)=>a+t.amount,0),budget=Object.values(data.budgets).reduce((a,n)=>a+Number(n||0),0),plannedSave=data.goals.reduce((a,g)=>a+Number(g.monthly||0),0),rec=data.recurring.reduce((a,r)=>a+r.amount,0);$('income').textContent=money(income);$('spent').textContent=money(spent);$('remaining').textContent=money(Math.max(0,budget-spent));$('savings').textContent=money(plannedSave);$('txnCount').textContent=expenses.length+' expenses';
let days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),left=Math.max(1,days-now.getDate()+1),available=Math.min(Math.max(0,budget-spent),Math.max(0,income-spent-plannedSave-rec)),daily=available/left;$('safeDaily').textContent=money(daily);$('safeText').textContent=`${left} day${left===1?'':'s'} left · after planned savings and S$${rec.toFixed(2)} recurring commitments`;
let sums={};expenses.forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);let sorted=Object.entries(sums).sort((a,b)=>b[1]-a[1]);$('breakdown').innerHTML=sorted.length?sorted.map(([c,v])=>{let b=Number(data.budgets[c]||0),p=b?v/b*100:100;return `<div class="item"><div class="row"><span>${c}</span><span class="amount">${money(v)} / ${money(b)}</span></div><div class="bar"><div class="fill ${p>100?'over':''}" style="width:${Math.min(100,p)}%"></div></div></div>`}).join(''):'<div class="empty">No expenses recorded this month.</div>';
$('transactions').innerHTML=tx.length?tx.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,12).map(t=>`<div class="item row"><div><strong>${t.desc||t.category||'Income'}</strong><div class="muted">${t.date}${t.type==='expense'?' · '+t.category:''}</div></div><div><span class="amount ${t.type==='income'?'good':''}">${t.type==='income'?'+':'−'}${money(t.amount)}</span><button class="smallbtn" onclick="rm('transactions',${t.id})">Delete</button></div></div>`).join(''):'<div class="empty">Nothing recorded yet.</div>';
$('budgetList').innerHTML=cats.map(c=>`<label>${c}<input type="number" min="0" step="10" value="${Number(data.budgets[c]||0)}" data-budget="${c}"></label>`).join('');document.querySelectorAll('[data-budget]').forEach(i=>i.onchange=()=>{data.budgets[i.dataset.budget]=Math.max(0,Number(i.value)||0);save()});
$('recList').innerHTML=data.recurring.length?data.recurring.map(r=>`<div class="item row"><div><strong>${r.name}</strong><div class="muted">${r.category}</div></div><div><span class="amount">${money(r.amount)}/mo</span><button class="smallbtn" onclick="rm('recurring',${r.id})">Delete</button></div></div>`).join(''):'<div class="empty">No recurring expenses yet.</div>';
$('goalList').innerHTML=data.goals.length?data.goals.map(g=>`<div class="item row"><div><strong>${g.name}</strong><div class="muted">Target ${money(g.target)} · reserve ${money(g.monthly)}/mo</div></div><button class="smallbtn" onclick="rm('goals',${g.id})">Delete</button></div>`).join(''):'<div class="empty">No savings goals yet.</div>'}
$('exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify({version:VERSION,exported:new Date().toISOString(),data},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='budget-compass-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importFile').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!x.data)throw 0;data=x.data;save();alert('Backup restored.')}catch{alert('That backup file could not be read.')}};
$('clearBtn').onclick=()=>{if(confirm('Erase all Budget Compass data on this device?')){data=structuredClone(defaults);save()}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true};
async function setupServiceWorker(){
 if(!('serviceWorker' in navigator))return;
 let refreshing=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
 try{
  const reg=await navigator.serviceWorker.register('/Budget/sw.js?v='+VERSION,{scope:'/Budget/',updateViaCache:'none'});
  const showUpdate=worker=>{
   if(!worker)return;
   const notice=$('updateNotice'),btn=$('reloadUpdateBtn');
   if(notice)notice.hidden=false;
   if(btn)btn.onclick=()=>worker.postMessage({type:'SKIP_WAITING'});
  };
  if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;if(!worker)return;
   worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker)});
  });
  await reg.update();
 }catch(err){console.error(err)}
}
setupServiceWorker();render();
