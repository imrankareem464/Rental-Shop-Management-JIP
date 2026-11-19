'use strict';

// Utility bills, collection and receipts.

function utilitiesView(){
  let list=db.utilities.filter(u=>u.month===month()&&matches(u.type,shop(u.shopId)?.no,u.payer,u.description)).filter(u=>statusFilter==='All'||(u.paid?'Received':'Pending')===statusFilter);
  return toolbar(['All','Received','Pending'],button('Export CSV',"exportReport('Utilities')"))+`<section class="panel">${table(['Shop','Utility / Description','Month','Amount','Status','Actions'],list.map(u=>[esc(shop(u.shopId)?.no),`${esc(u.type)}<small>${esc(u.description)}</small>`,monthName(u.month),money(u.amount),badge(u.paid?'Received':'Pending',u.paid?'ok':''),`<div class="action-group">${button('Bill',`utilityDocument('${u.id}')`)}${u.paid?button('Receipt',`utilityDocument('${u.id}',true)`):button('Collect',`openForm('utilityPayment','${u.id}')`,'primary')}${!u.paid?button('Delete',`removeRecord('utilities','${u.id}')`,'danger'):''}</div>`]),true)}</section><p class="hint" style="margin-top:14px">Utilities are tenant charges, separate from rent. Record supplier payments in Expenses if you need them included in operating costs. Utility collection records full bill payment.</p>`
}

function utilityDocument(uid,isReceipt=false){
  let u=db.utilities.find(u=>u.id===uid),s=shop(u.shopId);
  showPaper(isReceipt?'Utility receipt':'Utility bill',paperTitle()+`\nUTILITY ${isReceipt?'PAYMENT RECEIPT':'BILL'}\n\nReference: ${u.number}\nShop: ${s.no} — ${s.name}\nUtility: ${u.type}\nMonth: ${monthName(u.month)}\nDescription: ${u.description||'—'}\nAmount: ${money(u.amount)}\nDue Date: ${fmtDate(u.dueDate)}\n\n${isReceipt?`Payment Date: ${fmtDate(u.paidDate)}\nPaid / Deposited By: ${u.payer}\nPayment Method: ${u.method}\nStatus: Received`:'Status: '+(u.paid?'Received':'Pending')}\n\nReceived by / Signature: _____________________`)
}

function utilityFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    if(!db.shops.length){
    toast('Add a shop first.');
    return
  }
  title='Add utility bill';
  fields=field('shopId','Shop','select','',{
    options:shopOptions()
  })+field('month','Billing month','month',month())+field('type','Utility','select','Electricity',{
    options:['Electricity','Water','Gas','Service Charge','Other']
  })+field('amount','Bill amount','number','',{
    min:.01
  })+field('dueDate','Due date','date',today())+field('description','Meter / Bill reference','text','',optional);
  submit=v=>{
    v.amount=amount(v.amount);
    if(!shop(v.shopId)||!dateOK(v.dueDate)||v.amount<=0)throw Error('Enter a valid shop, due date and positive amount.');
    db.utilities.push({
      ...v,id:id(),number:nextNumber('U',db.utilities),paid:false
    });
    eventLog(`Utility bill added (${shop(v.shopId).no})`)
  }
  
    return {
    fields,title,description,record,submit
  };

}

function utilityPaymentFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    record=db.utilities.find(u=>u.id===recordId);
  if(!record||record.paid)return;
  title='Collect utility payment';
  fields=note(`Shop ${esc(shop(record.shopId).no)} · ${esc(record.type)} · ${money(record.amount)}`)+field('payer','Paid / deposited by','text','')+field('paidDate','Payment date','date',today())+field('method','Payment method','select','Cash',{
    options:['Cash','Bank Transfer','Online','Cheque']
  });
  submit=v=>{
    record=db.utilities.find(u=>u.id===recordId);
    if(!dateOK(v.paidDate)||v.paidDate>today())throw Error('Payment date cannot be invalid or in the future.');
    Object.assign(record,v,{
      paid:true
    });
    eventLog(`Utility payment received (${shop(record.shopId).no})`);
    return ()=>utilityDocument(record.id,true)
  }
  
    return {
    fields,title,description,record,submit
  };

}
