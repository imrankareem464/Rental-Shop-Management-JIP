'use strict';

// Rent collection, arrears, bills, receipts and payment forms.

// Amounts are allocated to billing months; future payments are never deducted twice.
function rentCollectionSummary(c,m=month()){
  const previous=total(arrears(c,m).filter(x=>x.month<m),'balance');
  const received=paid(c,m),remaining=balance(c,m);
  const advance=total(db.payments.filter(p=>!p.void&&p.contractId===c.id&&p.month>m),'amount');
  return {monthly:rate(c,m),received,previous,remaining,total:amount(previous+remaining),advance,
    status:remaining<=.009?'Received':received>.009?'Partially Paid':'Pending'};
}

function collectionRows(){
  return monthlyContracts().filter(c=>matches(shop(c)?.no,shop(c)?.name,tenant(c)?.name))
    .filter(c=>statusFilter==='All'||rentCollectionSummary(c).status===statusFilter);
}

function collectionReceipt(cid,m=month()){
  const p=db.payments.filter(p=>!p.void&&p.contractId===cid&&p.month===m).slice(-1)[0];
  if(p)printReceipt(p.id);else toast('No valid payment receipt for this billing month.');
}

function collectPreviousRent(cid){
  const c=db.contracts.find(c=>c.id===cid);
  const first=arrears(c,month()).find(x=>x.month<month());
  if(first)openForm('payment','',cid,first.month);
  else toast('No previous balance for this contract.');
}

function collectAdvanceRent(cid){
  const c=db.contracts.find(c=>c.id===cid);
  const next=monthsBetween(c.start,c.end).find(m=>m>month()&&balance(c,m)>.009);
  if(next)openForm('payment','',cid,next);
  else toast('No unpaid future month within this contract.');
}

function collectionView(){
  return toolbar(['All','Pending','Partially Paid','Received'],button('Export CSV',"exportReport('Rent status')"))+
    '<section class="panel">'+table(['Shop / Tenant','Business','Monthly Rent','Received','Previous Balance','Total Remaining','Advance','Status','Actions'],collectionRows().map(c=>{
      const x=rentCollectionSummary(c);
      const future=monthsBetween(c.start,c.end).some(m=>m>month()&&balance(c,m)>.009);
      return [esc(shop(c)?.no)+' · '+esc(shop(c)?.name)+'<small>'+esc(tenant(c)?.name)+'</small>',
        esc(shop(c)?.type),money(x.monthly),'<span class="text-green money">'+money(x.received)+'</span>',
        money(x.previous),'<span class="text-red money">'+money(x.total)+'</span>',money(x.advance),
        badge(x.status,x.status==='Received'?'ok':''),
        '<div class="action-group">'+
        (x.total>.009||future?button('Rent Collect',"openForm('payment','','"+c.id+"')",'primary'):'')+
        (x.received>.009?button('Rent Receipt',"collectionReceipt('"+c.id+"')"):'')+
        (x.total>.009?button('Reminder',"draftNotice('"+c.id+"')"):'')+'</div>'];
    }),true)+'</section><p class="hint" style="margin-top:14px">Status applies to the selected month. Total Remaining includes previous unpaid months of this contract. One rent collection covers previous dues and this month, with optional advance. All receipts remain available in Receipts.</p>';
}

function receiptsView(){
  return toolbar(['All','Valid','Voided'],button('Export CSV',"exportReport('Payments')"))+`<section class="panel">${table(['Receipt No.','Payment Date / Month','Shop / Tenant','Paid By','Amount / Method','Status','Actions'],db.payments.slice().reverse().filter(p=>p.month===month()&&matches(p.receipt,p.snapshot.tenant,p.snapshot.shopNo,p.payer)).filter(p=>statusFilter==='All'||(p.void?'Voided':'Valid')===statusFilter).map(p=>[esc(p.receipt),`${fmtDate(p.date)}<small>${monthName(p.month)}</small>`,`${esc(p.snapshot.shopNo)} · ${esc(p.snapshot.shopName)}<small>${esc(p.snapshot.tenant)}</small>`,esc(p.payer),`${money(p.amount)}<small>${esc(p.method)}</small>`,badge(p.void?'Voided':'Valid',p.void?'bad':'ok'),`<div class="action-group">${button('Print',`printReceipt('${p.id}')`)}${!p.void?button('Cancel Receipt',`voidPayment('${p.id}')`,'danger') : ''}</div>`]),true)}</section><p class="hint" style="margin-top:14px">Filter receipts by billing month above. Voiding retains the original receipt for audit and restores the amount to the outstanding balance.</p>`
}

function outstandingView(){
  return toolbar([],button('Export CSV',"exportReport('Outstanding')")+button('Draft all reminders','generateReminders()'))+`<div class="metric-strip">${miniMetric('Rental Arrears',money(total(outstanding(),'balance')))}${miniMetric('Tenants with Arrears',topOutstanding().length)}${miniMetric('Unpaid Rental Months',outstanding().length)}${miniMetric('Unpaid Utilities',money(utilityDue()))}</div><section class="panel">${table(['Shop / Tenant','Unpaid Month','Monthly Rent','Received','Outstanding','Actions'],outstanding().filter(x=>matches(shop(x.contract)?.no,tenant(x.contract)?.name,x.month)).sort((a,b)=>a.month.localeCompare(b.month)).map(x=>{
    let c=x.contract;
    return [`${esc(shop(c)?.no)} · ${esc(shop(c)?.name)}<small>${esc(tenant(c)?.name)}</small>`,monthName(x.month),money(rate(c,x.month)),money(paid(c,x.month)),`<b class="text-red money">${money(x.balance)}</b>`,`<div class="action-group">${button('Rent Collect',`openForm('payment','','${c.id}')`,'primary')}${button('Notice',`draftNotice('${c.id}')`)}</div>`]
  }),true)}</section>`
}

function voidPayment(recordId){
  const reason=prompt('Void this receipt? Enter a reason. The payment will be reversed, but its history will remain.');
  if(!reason?.trim())return;
  transact(()=>{
    let p=db.payments.find(p=>p.id===recordId);
    p.void=true;
    p.voidReason=reason.trim();
    p.voidDate=today();
    eventLog(`Receipt ${p.receipt} voided`)
  },'Receipt voided; balance restored.')
}

function printReceipt(recordId){
  const p=db.payments.find(p=>p.id===recordId);
  if(!p)return;
  const allocations=p.allocations||[{month:p.month,amount:p.amount}];
  const allocationText=allocations.map(a=>`  ${monthName(a.month)}: ${money(a.amount)}`).join('\n');
  showPaper('Rent receipt',paperTitle()+`\nRENT PAYMENT RECEIPT${db.demo?' — SAMPLE':''}${p.void?' — VOIDED':''}\n\nReceipt No: ${p.receipt}\nPayment Date: ${fmtDate(p.date)}\nBilling Month: ${monthName(p.month)}\n\nTenant Name: ${p.snapshot.tenant}\nShop Name: ${p.snapshot.shopName}\nShop Number: ${p.snapshot.shopNo}\n\nAmount Received: ${money(p.amount)}\nAllocation:\n${allocationText}\n${p.advanceAmount>.009?`Advance paid: ${money(p.advanceAmount)}\n`:''}Paid / Deposited By: ${p.payer}\nPayment Method: ${p.method}\nTransaction Reference: ${p.reference||'—'}\n${p.void?`\nVOIDED on ${fmtDate(p.voidDate)}\nReason: ${p.voidReason}\nThis receipt is no longer proof of payment.\n`:'\nThis receipt acknowledges the payment shown above.\n'}\nReceived by: __________________________\nSignature / Stamp: _____________________`)
}

function rentBill(cid,m){
  const c=db.contracts.find(c=>c.id===cid),s=shop(c),t=tenant(c);
  showPaper('Rent bill',paperTitle()+`\nRENT BILL${db.demo?' — SAMPLE':''}\n\nIssued: ${fmtDate(today())}\nBilling Month: ${monthName(m)}\nDue Date: ${fmtDate(m+'-'+String(c.dueDay).padStart(2,'0'))}\n\nTenant: ${t.name}\nShop: ${s.name}\nShop Number: ${s.no}\nBusiness: ${s.type}\n\nMonthly Rent: ${money(rate(c,m))}\nReceived for this Month: ${money(paid(c,m))}\nBalance for this Month: ${money(balance(c,m))}\n\nPlease quote your shop number and billing month when paying.\n\nAdministration: _______________________`)
}

function paymentFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    if(!db.contracts.length){
    toast('Create a rental contract first.');
    return
  }
  title=type==='payment'?'Record rent payment':type==='bill'?'Generate rent bill':'Draft rent reminder';
  let c=db.contracts.find(c=>c.id===related)||monthlyContracts()[0]||db.contracts[0],bm=billingMonth||month();
  fields=field('contractId','Shop / Contract','select',c.id,{
    options:contractOptions(),full:true
  })+field('month',type==='notice'?'Include arrears through month':'Billing month','month',bm);
  if(type==='payment'){
    const due=total(arrears(c,bm),'balance');
    const previous=Math.max(0,due-(active(c,bm)?balance(c,bm):0));
    const futureMonths=monthsBetween(c.start,c.end).filter(m=>m>bm&&balance(c,m)>.009);
    fields+=field('date','Payment date','date',today())+formNote(`Previous pending: ${money(previous)} � Selected month due: ${money(active(c,bm)?balance(c,bm):0)} � Total due: ${money(due)}${futureMonths.length?` � Next advance month: ${monthName(futureMonths[0])}`:''}`)+field('amount','Amount received','number',due||'',{min:0.01})+field('advanceAmount','Advance amount (optional)','number','',{min:0})+field('payer','Deposited / paid by','text',tenant(c)?.name||'')+field('method','Payment method','select','Cash',{options:['Cash','Bank Transfer','Cheque','Online']})+field('reference','Transaction / cheque reference','text','',optional);
  }
  fields+=note(type==='notice'?'The reminder includes every unpaid contract month through your chosen month. It is a draft and will not be sent automatically.':'Rent received is applied oldest pending month first, then to the selected month. Partial payments are supported; remaining amount stays due. Add any advance in the optional field; the receipt shows the month allocation.');
  submit=v=>{
    let c=db.contracts.find(c=>c.id===v.contractId);
    if(!c)throw Error('Select a valid contract.');
    if(type==='notice'){
      const n=makeNotice(c,v.month);
      if(!n)throw Error('There is no unpaid rent through this month.');
      db.notices.push(n);
      eventLog(`Reminder drafted for ${shop(c).no}`);
      return ()=>viewNotice(n.id)
    }
    if(!active(c,v.month))throw Error('The contract is not active in this billing month.');
    if(type==='bill')return ()=>rentBill(c.id,v.month);
    let a=amount(v.amount),advanceAmount=amount(v.advanceAmount||0),dues=arrears(c,v.month).map(x=>({month:x.month,balance:x.balance}));
    const totalDue=total(dues,'balance');
    if(a<=0)throw Error('Amount received must be positive.');
    const futureMonths=monthsBetween(c.start,c.end).filter(m=>m>v.month&&balance(c,m)>.009);
    if(advanceAmount>0&&(!futureMonths.length||advanceAmount>rate(c,futureMonths[0])+.001))throw Error(`Advance cannot exceed the next future month's rent (${money(futureMonths.length?rate(c,futureMonths[0]):0)}).`);
    if(advanceAmount>0){const advanceMonth=futureMonths[0],advanceDue=rate(c,advanceMonth);dues.push({month:advanceMonth,balance:advanceDue})}
    if(a>totalDue+advanceAmount+.001)throw Error(`Amount exceeds pending rent plus advance (${money(totalDue+advanceAmount)}).`);
    if(!dateOK(v.date)||v.date>today())throw Error('Payment date cannot be invalid or in the future.');
    let p={
      ...v,id:id(),receipt:nextNumber('R',db.payments),amount:a+advanceAmount,advanceAmount,allocations:(()=>{let left=a+advanceAmount,out=[];for(const d of dues){let part=Math.min(left,d.balance);if(part>.009)out.push({month:d.month,amount:amount(part)});left=amount(left-part);if(left<=.009)break}return out})(),void:false,snapshot:{
        shopNo:shop(c).no,shopName:shop(c).name,tenant:tenant(c).name
      }
    };
    db.payments.push(p);
    eventLog(`Payment received (${shop(c).no}) — ${money(a+advanceAmount)}`);
    return ()=>printReceipt(p.id)
  }
  
    return {
    fields,title,description,record,submit
  };

}
