'use strict';

// Organization preferences, backups, imports and workspace reset.

function migrate(old){
  const n=blank();
  for(const s of old.shops){
    let tid=id(),cid=id();
    n.shops.push({
      id:s.id,no:s.no,name:s.name,type:s.type,block:s.block||'A',floor:s.floor||'Ground',notes:''
    });
    n.tenants.push({
      id:tid,name:s.tenant,phone:s.phone||'',email:'',cnic:'',address:''
    });
    n.contracts.push({
      id:cid,shopId:s.id,tenantId:tid,start:s.start,end:s.end,rent:Number(s.rent),deposit:0,dueDay:10,rates:[],notes:'Imported from Urdu version'
    });
    for(const p of old.payments.filter(p=>p.shopId===s.id)){
      n.payments.push({
        ...p,id:p.id||id(),contractId:cid,amount:Number(p.amount),payer:p.payer||s.tenant,method:p.method||'Cash',void:false,snapshot:{
          shopNo:p.snapshot?.no||s.no,shopName:p.snapshot?.name||s.name,tenant:p.snapshot?.tenant||s.tenant
        }
      })
    }
  }
  return n
}

function settingsView(){
  return `<div class="settings-grid">${panel('Organization & Preferences','settings',`<form id="settingsForm" onsubmit="saveSettings(event)"><label>Organization name<input name="organization" value="${esc(db.settings.organization)}" required maxlength="150"></label><label>Address<textarea name="address">${esc(db.settings.address)}</textarea></label><label>Contact number / email<input name="contact" value="${esc(db.settings.contact)}"></label><div class="form-grid"><label>Display name<input name="admin" value="${esc(db.settings.admin)}" required></label><label>Currency label<input name="currency" value="${esc(db.settings.currency)}" required maxlength="8"></label></div><label>Reminder payment period (days)<input type="number" min="1" max="90" name="noticeDays" value="${db.settings.noticeDays}" required></label><p>Organization details appear on agreements, bills, notices and receipts. Display name is a preference, not a login.</p><button class="btn primary">Save settings</button></form>`)}${panel('Data & Backups','file',`<h3>Keep a copy of your records</h3><p>This app works offline. Records are stored only in this browser profile at this file location. Moving the file, changing browsers or clearing browser data can make records unavailable. Export a backup regularly.</p>${button('Download JSON Backup','backup()','primary')}${button('Restore JSON Backup',"$('restoreFile').click()")}<p>Restore replaces this workspace after validation and confirmation. Download a backup first. Microsoft Access (.accdb / .mdb) files are not supported.</p><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><h3>Explore or start fresh</h3>${button('Load demo workspace','loadDemo()')}${button('Start empty workspace','resetWorkspace()','danger')}<p>Demo mode contains fictional records. Starting empty removes the current browser workspace after confirmation; downloaded backups remain available.</p><h3>Workspace information</h3><p>${db.shops.length} shops · ${db.tenants.length} tenants · ${db.contracts.length} contracts · ${db.payments.length} rent payments<br>Schema version 2 · ${db.demo?'Demo workspace':'Personal workspace'}</p>`)}</div>`
}

function backup(){
  download(JSON.stringify({
    ...db,exportedAt:new Date().toISOString()
  },null,2),`rental-backup-${today()}.json`,'application/json');
  toast('Backup downloaded. Keep it in a safe folder.')
}

function saveSettings(e){
  e.preventDefault();
  const values=Object.fromEntries(new FormData(e.target));
  for(let k in values)values[k]=values[k].trim();
  if(!values.organization||!values.admin||!values.currency){
    toast('Complete organization, display name and currency.');
    return
  }
  transact(()=>{
    db.settings={
      ...db.settings,...values,noticeDays:Number(values.noticeDays)
    }
  },'Settings saved.')
}

async function restoreBackup(e){
  const f=e.target.files[0];
  if(!f)return;
  try{
    if(f.size>25e6)throw Error('Backup file exceeds 25 MB.');
    let incoming=JSON.parse(await f.text());
    if(incoming.version!==2&&Array.isArray(incoming.shops)&&Array.isArray(incoming.payments))incoming=migrate(incoming);
    validate(incoming);
    if(!confirm(`Restore ${incoming.shops.length} shops, ${incoming.tenants.length} tenants and ${incoming.payments.length} payments? This replaces this browser's current workspace. Download a backup of the current workspace first.`))return;
    transact(()=>{
      db=incoming;
      eventLog('Workspace restored from JSON backup')
    },'Backup restored.');
  }
  catch(err){
    toast(err.message||'This is not a supported backup.')
  }
  e.target.value=''
}

function resetWorkspace(){
  if(!confirm('Download a backup first. This will remove all records from this browser workspace. Continue?'))return;
  if(prompt('Type RESET to confirm.')!=='RESET')return;
  transact(()=>{
    const settings=db.settings;
    db=blank();
    db.settings=settings
  },'Empty workspace ready.')
}
