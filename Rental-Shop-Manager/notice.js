'use strict';

// Automatic rent reminder drafts and delivery tracking.

function noticesView(){
  return `<div class="hint">Reminders are drafted automatically from outstanding balances when you open this page. Select “Generate pending reminders” to check again. Review and print the letter, then deliver it yourself. No email or SMS is sent by this offline app.</div>`+toolbar(['All','Draft','Delivered','Cancelled'],button('Generate pending reminders','generateReminders()','primary'))+`<section class="panel">${table(['Created','Tenant / Shop','Subject','Through Month','Status','Actions'],db.notices.slice().reverse().filter(n=>matches(n.tenantName,n.shopNo,n.subject)).filter(n=>statusFilter==='All'||n.status===statusFilter).map(n=>[fmtDate(n.date),`${esc(n.tenantName)}<small>${esc(n.shopNo)}</small>`,esc(n.subject),monthName(n.month),badge(n.status,n.status==='Delivered'?'ok':''),`<div class="action-group">${button('View / Print',`viewNotice('${n.id}')`)}${n.status==='Draft'?button('Mark delivered',`deliverNotice('${n.id}')`):esc(fmtDate(n.deliveredDate))}</div>`]),true)}</section>`
}

function makeNotice(c,m){
  let lines=arrears(c,m);
  if(!lines.length)return null;
  let s=shop(c),t=tenant(c),n={
    id:id(),contractId:c.id,tenantName:t.name,shopNo:s.no,date:today(),month:m,status:'Draft',subject:'Outstanding rent reminder'
  };
  n.text=paperTitle()+`\nRENT PAYMENT REMINDER\n\nDate: ${fmtDate(today())}\nTo: ${t.name}\nShop: ${s.name} — ${s.no}\n\nDear ${t.name},\n\nOur records show that rent for the following billing months remains unpaid or partly paid under your agreement (${fmtDate(c.start)} to ${fmtDate(c.end)}):\n\n${lines.map(l=>`${monthName(l.month)}: ${money(l.balance)} outstanding`).join('\n')}\n\nTotal Outstanding Rent: ${money(total(lines,'balance'))}\n\nPlease arrange payment within ${db.settings.noticeDays} days of receiving this reminder. If you have already paid, kindly share your receipt or transaction reference so we can reconcile the records.\n\nThank you for your cooperation.\n\nFor ${db.settings.organization}\nAuthorized Signature: ___________________`;
  return n
}

function draftNotice(cid){
  let n=makeNotice(db.contracts.find(c=>c.id===cid),month());
  if(!n){
    toast('No unpaid rent to include.');
    return
  }
  let existing=db.notices.find(x=>x.contractId===cid&&x.month===month()&&x.date===today()&&x.status==='Draft');
  if(existing){
    viewNotice(existing.id);
    return
  }
  if(transact(()=>{
    db.notices.push(n);
    eventLog(`Reminder drafted for ${n.shopNo}`)
  },'Reminder drafted.'))viewNotice(n.id)
}

function generateReminders(){
  let added=0;
  transact(()=>{
    for(let c of db.contracts){
      const existing=db.notices.find(n=>n.contractId===c.id&&n.month===month()&&n.status==='Draft');
      let n=makeNotice(c,month());
      if(existing){
        if(!n){
          existing.status='Cancelled';
          existing.cancelledDate=today()
        }
        else if(!existing.manuallyEdited){
          existing.text=n.text;
          existing.date=n.date
        }
        continue
      }
      if(n){
        db.notices.push(n);
        added++
      }
    }
    if(added)eventLog(`${added} rent reminder draft(s) prepared`)
  },'Reminder drafts checked against current balances.');
  page='notices';
  render()
}

function viewNotice(nid){
  let n=db.notices.find(n=>n.id===nid);
  if(n)showPaper('Rent reminder draft',n.text,nid)
}

function deliverNotice(nid){
  if(!confirm('Confirm that you delivered this notice yourself. This button does not send it.'))return;
  transact(()=>{
    let n=db.notices.find(n=>n.id===nid);
    n.status='Delivered';
    n.deliveredDate=today();
    eventLog(`Notice marked delivered (${n.shopNo})`)
  },'Delivery recorded.')
}
