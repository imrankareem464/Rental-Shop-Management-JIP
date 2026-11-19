'use strict';

// Shared data model, storage, dates, calculations and backup validation.

const $=id=>document.getElementById(id), KEY='rental-shop-manager-en-v2', LEGACY='dukan-rent-v1';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}
[c]));

const id=()=>crypto.randomUUID(), today=()=>{
  const p=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-')
}, month=()=>$('month').value||today().slice(0,7), fmtDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('en-GB',{
  day:'2-digit',month:'short',year:'numeric'
}):'—', monthName=m=>new Date(m+'-01T12:00:00').toLocaleDateString('en-GB',{
  month:'long',year:'numeric'
}), money=n=>`${db.settings.currency} ${Number(n||0).toLocaleString('en-PK',{
  maximumFractionDigits:2
})}`, amount=n=>Math.round((Number(n)||0)*100)/100, dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;

const blank=()=>({
  version:2,settings:{
    organization:'Majlis Ihya-e-Islam',address:'',contact:'',admin:'Admin',currency:'PKR',noticeDays:7
  },shops:[],tenants:[],contracts:[],payments:[],expenses:[],utilities:[],notices:[],events:[]
});

let db=blank(), page='dashboard', statusFilter='All', reportType='Rent status', toastTimer, storageAvailable=true;

function toast(t){
  $('toast').textContent=t;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4000)
}

function transact(fn,message){
  let before=JSON.stringify(db);
  try{
    fn()
  }
  catch(e){
    db=JSON.parse(before);
    toast(e.message||'Check the record details.');
    return false
  }
  try{
    localStorage.setItem(KEY,JSON.stringify(db));
    storageAvailable=true;
    if(message)toast(message);
    render();
    return true
  }
  catch(e){
    db=JSON.parse(before);
    storageAvailable=false;
    $('storageWarning').textContent='Changes could not be saved. Browser storage may be full or unavailable. Download a backup before closing this window.';
    toast('Could not save changes. Please download a backup.');
    return false
  }
}

function eventLog(text){
  db.events.unshift({
    id:id(),text,date:today()
  });
  db.events=db.events.slice(0,150)
}

function shop(c){
  return db.shops.find(s=>s.id===(c?.shopId||c))
}

function tenant(c){
  return db.tenants.find(t=>t.id===(c?.tenantId||c))
}

function active(c,m=month()){
  return c.start.slice(0,7)<=m&&c.end.slice(0,7)>=m
}

function rate(c,m){
  let r=c.rent;
  for(const v of [...(c.rates||[])].sort((a,b)=>a.from.localeCompare(b.from)))if(v.from<=m)r=v.rent;
  return r
}

function paid(c,m){
  return amount(db.payments.filter(p=>!p.void&&p.contractId===c.id&&p.month===m).reduce((v,p)=>v+p.amount,0))
}

function balance(c,m){
  return amount(Math.max(0,rate(c,m)-paid(c,m)))
}

function monthsBetween(start,end){
  let out=[],[y,m]=start.slice(0,7).split('-').map(Number);
  for(let i=0;
  i<1200;
  i++){
    let str=y+'-'+String(m).padStart(2,'0');
    if(str>end.slice(0,7))break;
    out.push(str);
    if(++m===13){
      m=1;
      y++
    }
  }
  return out
}

function arrears(c,through=month()){
  if(c.start.slice(0,7)>through)return [];
  return monthsBetween(c.start,c.end.slice(0,7)<through?c.end:through).map(m=>({
    month:m,balance:balance(c,m),contract:c
  })).filter(x=>x.balance>.009)
}

function outstanding(through=month()){
  return db.contracts.flatMap(c=>arrears(c,through))
}

function monthlyContracts(m=month()){
  return db.contracts.filter(c=>active(c,m))
}

function validPayments(m=month()){
  return db.payments.filter(p=>!p.void&&p.month===m)
}

function total(list,key){
  return amount(list.reduce((s,v)=>s+Number(typeof key==='function'?key(v):v[key]||0),0))
}

function collected(m=month()){
  return total(validPayments(m),'amount')
}

function expected(m=month()){
  return total(monthlyContracts(m),c=>rate(c,m))
}

function expenses(m=month()){
  return total(db.expenses.filter(e=>e.date.slice(0,7)===m),'amount')
}

function utilityDue(){
  return total(db.utilities.filter(u=>u.month<=month()&&!u.paid),'amount')
}

function currentContract(s,m=month()){
  return monthlyContracts(m).find(c=>c.shopId===s.id)
}

function matches(...v){
  const q=$('search').value.toLowerCase().trim();
  return !q||v.join(' ').toLowerCase().includes(q)
}

function upsert(collection,recordId,value){
  if(recordId){
    const i=db[collection].findIndex(r=>r.id===recordId);
    if(i<0)throw Error('Record not found.');
    db[collection][i]=value
  }
  else db[collection].push(value)
}

function nextMonthStart(d){
  let dt=new Date(d+'T00:00:00Z');
  dt.setUTCDate(1);
  dt.setUTCMonth(dt.getUTCMonth()+1);
  return dt.toISOString().slice(0,10)
}

function addDays(d,n){
  return new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10)
}

function addYear(d){
  const dt=new Date(d+'T00:00:00Z');
  const mo=dt.getUTCMonth();
  dt.setUTCFullYear(dt.getUTCFullYear()+1);
  if(dt.getUTCMonth()!==mo)dt.setUTCDate(0);
  return dt.toISOString().slice(0,10)
}

function nextNumber(prefix,list){
  let n=list.reduce((max,p)=>Math.max(max,Number(String(p.receipt||p.number||'').split('-').pop())||0),0)+1;
  return prefix+'-'+String(n).padStart(6,'0')
}

function removeRecord(collection,recordId){
  if(!confirm('Delete this record permanently?'))return;
  transact(()=>{
    if(collection==='shops'&&(db.contracts.some(c=>c.shopId===recordId)||db.utilities.some(u=>u.shopId===recordId)))throw Error('This shop has linked records.');
    if(collection==='tenants'&&db.contracts.some(c=>c.tenantId===recordId))throw Error('This tenant has linked contracts.');
    if(collection==='contracts'&&(db.payments.some(p=>p.contractId===recordId)||db.notices.some(n=>n.contractId===recordId)))throw Error('This contract has linked records.');
    db[collection]=db[collection].filter(r=>r.id!==recordId)
  },'Record deleted.')
}

function validate(x){
  const fail=()=>{
    throw Error('Invalid or inconsistent backup file.')
  };
  const str=(v,max=10000)=>typeof v==='string'&&v.length<=max,num=v=>Number.isFinite(v)&&v>=0,has=(list,i)=>list.some(v=>v.id===i);
  if(!x||x.version!==2||!x.settings||!['shops','tenants','contracts','payments','expenses','utilities','notices','events'].every(k=>Array.isArray(x[k])&&x[k].length<=100000))fail();
  if(!['organization','address','contact','admin','currency'].every(k=>str(x.settings[k]))||!num(x.settings.noticeDays)||x.settings.noticeDays<1||x.settings.noticeDays>90)fail();
  for(let k of ['shops','tenants','contracts','payments','expenses','utilities','notices','events']){
    let ids=new Set();
    for(let r of x[k]){
      if(!r||!str(r.id,100)||!/^[a-zA-Z0-9_-]+$/.test(r.id)||ids.has(r.id))fail();
      ids.add(r.id)
    }
  }
  let nos=new Set();
  for(let s of x.shops){
    if(!['no','name','type','block','floor'].every(k=>str(s[k]))||!s.no||nos.has(s.no.toLowerCase()))fail();
    nos.add(s.no.toLowerCase())
  }
  for(let t of x.tenants)if(!['name','phone','email','cnic','address'].every(k=>str(t[k])))fail();
  for(let c of x.contracts){
    if(!has(x.shops,c.shopId)||!has(x.tenants,c.tenantId)||!dateOK(c.start)||!dateOK(c.end)||c.start>c.end||!num(c.rent)||c.rent<=0||!num(c.deposit)||!Number.isInteger(c.dueDay)||c.dueDay<1||c.dueDay>28||!Array.isArray(c.rates)||!str(c.notes))fail();
    if(x.contracts.some(o=>o.id!==c.id&&o.shopId===c.shopId&&o.start.slice(0,7)<=c.end.slice(0,7)&&o.end.slice(0,7)>=c.start.slice(0,7)))fail();
    let rateMonths=new Set;
    for(let r of c.rates){
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.from)||r.from<c.start.slice(0,7)||r.from>c.end.slice(0,7)||!num(r.rent)||r.rent<=0||rateMonths.has(r.from))fail();
      rateMonths.add(r.from)
    }
  }
  let receipts=new Set();
  for(let p of x.payments){
    let c=x.contracts.find(c=>c.id===p.contractId);
    if(!c||!num(p.amount)||p.amount<=0||!dateOK(p.date)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month)||p.month<c.start.slice(0,7)||p.month>c.end.slice(0,7)||!str(p.receipt)||receipts.has(p.receipt)||!str(p.payer)||!str(p.method)||typeof p.void!=='boolean'||!p.snapshot||!['shopNo','shopName','tenant'].every(k=>str(p.snapshot[k])))fail();
    receipts.add(p.receipt)
  }
  for(let c of x.contracts){
    let grouped={
    };
    for(let p of x.payments.filter(p=>p.contractId===c.id&&!p.void))grouped[p.month]=(grouped[p.month]||0)+p.amount;
    for(let m in grouped)if(grouped[m]>rate(c,m)+.01)fail()
  }
  for(let e of x.expenses)if(!dateOK(e.date)||!num(e.amount)||e.amount<=0||!['description','category','vendor','status'].every(k=>str(e[k]))||(e.shopId&&!has(x.shops,e.shopId)))fail();
  for(let u of x.utilities)if(!has(x.shops,u.shopId)||!num(u.amount)||u.amount<=0||!dateOK(u.dueDate)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(u.month)||!str(u.type)||!str(u.number)||typeof u.paid!=='boolean'||(u.paid&&(!dateOK(u.paidDate)||!str(u.payer)||!str(u.method))))fail();
  for(let n of x.notices)if(!has(x.contracts,n.contractId)||!str(n.text,500000)||!['Draft','Delivered','Cancelled'].includes(n.status)||!dateOK(n.date)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(n.month)||!['tenantName','shopNo','subject'].every(k=>str(n[k])))fail();
  for(let e of x.events)if(!str(e.text)||!dateOK(e.date))fail();
  return true
}
