'use strict';

// Report tables, CSV export and printable reports.

function reportsView(){
  let rent=expected(),got=collected();
  return `<div class="metric-strip">${miniMetric('Expected Rent',money(rent))}${miniMetric('Collected Rent',money(got))}${miniMetric('Expenses',money(expenses()))}${miniMetric('Net Rental Income',money(got-expenses()))}</div><div class="page-toolbar"><label>Report<select onchange="reportType=this.value;render()">${['Rent status','Payments','Outstanding','Expenses','Utilities'].map(v=>`<option ${reportType===v?'selected':''}>${v}</option>`).join('')}</select></label>${button('Download CSV','exportReport(reportType)','primary')}${button('Print Report','printReport()')}<span class="count">${monthName(month())}</span></div><section class="panel">${table(reportData(reportType).headers,reportData(reportType).rows.map(row=>row.map(esc)),true)}</section><div class="hint" style="margin-top:15px">Rental reports group payments by their billing month, including payments recorded later. Expense reports use expense dates. Net rental income = collected rent − operating expenses; deposits and utility collections are excluded. “Outstanding” includes every unpaid contract month through the selected month.</div>`
}

function reportData(type){
  let headers,rows;
  switch(type){
    case 'Payments':headers=['Receipt','Shop No.','Shop Name','Tenant','Billing Month','Payment Date','Paid By','Amount','Method','Status'];
    rows=db.payments.filter(p=>p.month===month()&&matches(p.receipt,p.snapshot.tenant,p.snapshot.shopNo,p.payer)).map(p=>[p.receipt,p.snapshot.shopNo,p.snapshot.shopName,p.snapshot.tenant,p.month,p.date,p.payer,p.amount,p.method,p.void?'Voided':'Valid']);
    break;
    case 'Outstanding':headers=['Shop No.','Tenant','Billing Month','Rent','Received','Outstanding'];
    rows=outstanding().filter(x=>matches(shop(x.contract)?.no,tenant(x.contract)?.name,x.month)).map(x=>[shop(x.contract).no,tenant(x.contract).name,x.month,rate(x.contract,x.month),paid(x.contract,x.month),x.balance]);
    break;
    case 'Expenses':headers=['Date','Category','Shop No.','Description','Vendor','Amount','Job Status'];
    rows=db.expenses.filter(e=>e.date.slice(0,7)===month()&&matches(e.description,e.category,e.vendor,shop(e.shopId)?.no)).map(e=>[e.date,e.category,shop(e.shopId)?.no||'Property',e.description,e.vendor,e.amount,e.status]);
    break;
    case 'Utilities':headers=['Reference','Shop No.','Utility','Month','Amount','Status','Paid Date','Paid By'];
    rows=db.utilities.filter(u=>u.month===month()&&matches(u.type,shop(u.shopId)?.no,u.payer,u.description)&&(statusFilter==='All'||(u.paid?'Received':'Pending')===statusFilter)).map(u=>[u.number,shop(u.shopId).no,u.type,u.month,u.amount,u.paid?'Received':'Pending',u.paidDate||'',u.payer||'']);
    break;
    default:headers=['Shop No.','Shop Name','Tenant','Business','Billing Month','Monthly Rent','Received','Previous Balance','Total Remaining','Advance','Status'];
    rows=collectionRows().map(c=>{
      const x=rentCollectionSummary(c);
      return [shop(c).no,shop(c).name,tenant(c).name,shop(c).type,month(),x.monthly,x.received,x.previous,x.total,x.advance,x.status];
    })
  }
  return {
    headers,rows
  }
}

function download(text,name,type){
  let url=URL.createObjectURL(new Blob([text],{
    type
  })),a=document.createElement('a');
  a.href=url;
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),5000)
}

function exportReport(type){
  let r=reportData(type);
  download('\uFEFF'+[r.headers,...r.rows].map(row=>row.map(v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n'),`rental-${type.toLowerCase().replaceAll(' ','-')}-${month()}.csv`,'text/csv;charset=utf-8')
}

function printReport(){
  let r=reportData(reportType);
  showPaper(reportType+' report',paperTitle()+`\n${reportType.toUpperCase()} REPORT\nReporting Month: ${monthName(month())}\nGenerated: ${fmtDate(today())}\nCurrency: ${db.settings.currency}\n\n`+r.rows.map(row=>r.headers.map((h,i)=>`${h}: ${row[i]??''}`).join('\n')).join('\n\n────────────────────────\n\n')+`\n\nTotal Records: ${r.rows.length}`)
}
