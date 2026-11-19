'use strict';

// Expenses and maintenance records.

function expensesView(){
  let list=db.expenses.filter(e=>e.date.slice(0,7)===month()&&matches(e.description,e.category,e.vendor,shop(e.shopId)?.no));
  return toolbar([],button('Export CSV',"exportReport('Expenses')"))+`<div class="metric-strip">${miniMetric('Monthly Expenses',money(total(list,'amount')))}${miniMetric('Maintenance Jobs',list.filter(e=>e.category==='Maintenance').length)}${miniMetric('Open Jobs',list.filter(e=>e.status==='Open').length)}${miniMetric('Completed Jobs',list.filter(e=>e.status==='Completed').length)}</div><section class="panel">${table(['Date','Category / Property','Description / Vendor','Amount','Job Status','Actions'],list.slice().reverse().map(e=>[fmtDate(e.date),`${esc(e.category)}<small>${esc(shop(e.shopId)?.no||'Whole property')}</small>`,`${esc(e.description)}<small>${esc(e.vendor)}</small>`,money(e.amount),badge(e.status,e.status==='Completed'?'ok':''),`<div class="action-group">${button('Edit',`openForm('expense','${e.id}')`)}${button('Delete',`removeRecord('expenses','${e.id}')`,'danger')}</div>`]),true)}</section>`
}

function expenseFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    record=db.expenses.find(e=>e.id===recordId)||{
  };
  title=recordId?'Edit expense':'Add expense / maintenance';
  fields=field('date','Expense date','date',record.date||today())+field('category','Category','select',record.category||'Maintenance',{
    options:['Maintenance','Repairs','Cleaning','Security','Electricity','Water','Tax','Other']
  })+field('shopId','Shop (optional)','select',record.shopId||'',{
    ...optional,options:[['','Whole property'],...shopOptions().slice(1)]
  })+field('amount','Amount paid','number',record.amount||'',{
    min:0.01
  })+field('description','Description','text',record.description||'')+field('vendor','Vendor / Paid to','text',record.vendor||'',optional)+field('status','Job status','select',record.status||'Completed',{
    options:['Open','In Progress','Completed']
  });
  submit=v=>{
    v.amount=amount(v.amount);
    if(!dateOK(v.date)||v.amount<=0)throw Error('Enter a valid date and positive amount.');
    upsert('expenses',recordId,{
      ...v,id:recordId||id()
    });
    eventLog(`Expense recorded: ${v.description}`)
  }
  
    return {
    fields,title,description,record,submit
  };

}
