'use strict';

// Contracts, renewals, rate increases and agreement printing.

function contractStatus(c){
  return today()<c.start?'Upcoming':today()>c.end?'Expired':'Active'
}

function contractsView(){
  return toolbar(['All','Active','Upcoming','Expired'])+`<section class="panel">${table(['Shop / Tenant','Contract Period','Monthly Rent','Deposit / Due Day','Status Today','Actions'],db.contracts.filter(c=>matches(shop(c)?.no,shop(c)?.name,tenant(c)?.name)).filter(c=>statusFilter==='All'||contractStatus(c)===statusFilter).map(c=>[`${esc(shop(c)?.no)} · ${esc(shop(c)?.name)}<small>${esc(tenant(c)?.name)}</small>`,`${fmtDate(c.start)}<small>to ${fmtDate(c.end)}</small>`,money(rate(c,month())),`${money(c.deposit)}<small>Due on day ${c.dueDay} of each month</small>`,badge(contractStatus(c),contractStatus(c)==='Active'?'ok':'neutral'),`<div class="action-group">${button('Agreement',`agreement('${c.id}')`)}${button('Edit',`openForm('contract','${c.id}')`)}${!db.payments.some(p=>p.contractId===c.id)&&!db.notices.some(n=>n.contractId===c.id)?button('Delete',`removeRecord('contracts','${c.id}')`,'danger'):''}</div>`]),true)}</section><p class="hint" style="margin-top:14px">Contract statuses use today's date. Monthly rent reports use the reporting month. Security deposits are reference records, not proof of deposit collection.</p>`
}

function renewalView(){
  return `<div class="hint">Renewal creates a new contract starting after the existing one ends. A rent increase starts on the first day of the chosen month; previously paid months keep their original rates.</div>`+toolbar(['All','Expiring in 60 days','Expired'])+`<section class="panel">${table(['Shop / Tenant','Contract Ends','Days Left','Rent at Expiry','Scheduled Increases','Actions'],db.contracts.filter(c=>matches(shop(c)?.no,tenant(c)?.name)).filter(c=>statusFilter==='All'||(statusFilter==='Expired'?daysLeft(c)<0:daysLeft(c)>=0&&daysLeft(c)<=60)).sort((a,b)=>a.end.localeCompare(b.end)).map(c=>[`${esc(shop(c)?.no)} · ${esc(tenant(c)?.name)}`,fmtDate(c.end),badge(daysLeft(c)<0?'Expired':daysLeft(c)+' days',daysLeft(c)<0?'bad':daysLeft(c)<=14?'':'ok'),money(rate(c,c.end.slice(0,7))),(c.rates||[]).map(r=>`${monthName(r.from)}: ${money(r.rent)}`).join('<br>')||'—',`<div class="action-group">${button('Renew',`openForm('renew','','${c.id}')`,'primary')}${button('Rent Increase',`openForm('increase','','${c.id}')`)}</div>`]),true)}</section>`
}

function agreement(cid){
  let c=db.contracts.find(c=>c.id===cid),s=shop(c),t=tenant(c);
  showPaper('Rental agreement',paperTitle()+`\nRENTAL AGREEMENT — RECORD SUMMARY\n\nShop Number: ${s.no}\nShop Name: ${s.name}\nBusiness Type: ${s.type}\nBlock / Floor: ${s.block} / ${s.floor}\n\nTenant: ${t.name}\nPhone: ${t.phone||'—'}\nID / CNIC: ${t.cnic||'—'}\nAddress: ${t.address||'—'}\n\nContract Starts: ${fmtDate(c.start)}\nContract Ends: ${fmtDate(c.end)}\nBase Monthly Rent: ${money(c.rent)}\nSecurity Deposit (record only): ${money(c.deposit)}\nRent Due: Day ${c.dueDay} of each month\n\nScheduled Rates:\n${c.rates.length?c.rates.map(r=>`${monthName(r.from)} onward: ${money(r.rent)}`).join('\n'):'No increases scheduled.'}\n\nNotes / Agreed Terms:\n${c.notes||'—'}\n\nThis is a summary of the agreement entered in the system.\n\nTenant Signature: _____________________\nLandlord Signature: ___________________\nDate: ________________________________`)
}

function contractFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    if (!db.shops.length) {
  toast("Add at least one shop first.");
  return;
}
  record=type==='renew'?db.contracts.find(c=>c.id===related):db.contracts.find(c=>c.id===recordId);
  let r=record||{
  },start=type==='renew'?nextMonthStart(r.end):r.start||today(),end=type==='renew'?addDays(addYear(start),-1):r.end||addDays(addYear(start),-1);
  title=type==='renew'?'Renew rental contract':recordId?'Edit contract':'Create rental contract';
  description='Full rent is charged for the first and last contract months.';
  fields=field('shopId','Shop','select',r.shopId||related,{
    options:shopOptions()
  })+field('tenantId','Tenant','select',r.tenantId||'',{
    options:tenantOptions()
  })+field('start','Start date','date',start)+field('end','End date','date',end)+field('rent','Monthly rent','number',record?(type==='renew'?rate(r,r.end.slice(0,7)):r.rent):'',{
    min:1
  })+field('deposit','Security deposit (reference only)','number',r.deposit||0,{
    min:0
  })+field('dueDay','Rent due day each month','number',r.dueDay||10,{
    min:1,max:28,step:1
  })+field('notes','Agreement notes','textarea',r.notes||'',optional)+note('Contracts for the same shop cannot overlap within a billing month. Keep old contracts for payment history. Use Renewal & Increase for rent changes.');
  submit=v=>{
    v.rent=amount(v.rent);
    v.deposit=amount(v.deposit);
    v.dueDay=Number(v.dueDay);
    if(!dateOK(v.start)||!dateOK(v.end)||v.end<v.start)throw Error('Choose a valid start and end date.');
    if(monthsBetween(v.start,v.end).length>=1200)throw Error('Contract is too long.');
    if(!shop(v.shopId)||!tenant(v.tenantId))throw Error('Choose a valid shop and tenant.');
    if(db.contracts.some(c=>c.id!==recordId&&c.shopId===v.shopId&&c.start.slice(0,7)<=v.end.slice(0,7)&&c.end.slice(0,7)>=v.start.slice(0,7)))throw Error('Another contract occupies this shop during one or more of these months. Start the new contract in a later billing month.');
    if(recordId&&db.payments.some(p=>p.contractId===recordId)&&['shopId','tenantId','start','end','rent'].some(k=>String(record[k])!==String(v[k])))throw Error('This contract has payments. Shop, tenant, dates and base rent are locked. Use a scheduled increase or a new renewal.');
    upsert('contracts',recordId,{
      ...v,id:recordId||id(),rates:recordId?record.rates||[]:[]
    });
    eventLog(`Contract ${type==='renew'?'renewed':'saved'} for ${shop(v.shopId).no}`)
  }
  
    return {
    fields,title,description,record,submit
  };

}

function increaseFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    record=db.contracts.find(c=>c.id===related);
  if(!record)return;
  title='Schedule rent increase';
  fields=note(`Shop ${esc(shop(record).no)} · Base rent ${money(record.rent)}. Increases apply to the whole selected billing month.`)+field('from','Effective month','month',month())+field('rent','New monthly rent','number',rate(record,month()),{
    min:1
  });
  submit=v=>{
    record=db.contracts.find(c=>c.id===related);
    v.rent=amount(v.rent);
    if(!active(record,v.from))throw Error('Effective month must fall within this contract.');
    if((record.rates||[]).some(r=>r.from===v.from))throw Error('An increase is already scheduled for this month.');
    if(db.payments.some(p=>p.contractId===record.id&&p.month>=v.from))throw Error('Payments already exist from this month onward. Choose a later unpaid month.');
    if(v.rent<=rate(record,v.from))throw Error('The new rent must exceed the current rate.');
    let later=(record.rates||[]).filter(r=>r.from>v.from);
    if(later.some(r=>r.rent<v.rent))throw Error('This exceeds a later scheduled rate. Choose a later month.');
    record.rates.push({
      from:v.from,rent:v.rent
    });
    record.rates.sort((a,b)=>a.from.localeCompare(b.from));
    eventLog(`Rent increase scheduled (${shop(record).no})`)
  }
  
    return {
    fields,title,description,record,submit
  };

}
