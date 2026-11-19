'use strict';

// Tenant directory and add/edit tenant form.

function tenantsView(){
  return toolbar()+`<section class="panel">${table(['Tenant','Phone / Email','ID / CNIC','Rented Shops','Actions'],db.tenants.filter(t=>matches(t.name,t.phone,t.email,t.cnic)).map(t=>[`${esc(t.name)}<small>${esc(t.address)}</small>`,`${esc(t.phone)}<small>${esc(t.email)}</small>`,esc(t.cnic),monthlyContracts().filter(c=>c.tenantId===t.id).map(c=>esc(shop(c)?.no)).join(', ')||'—',`<div class="action-group">${button('Edit',`openForm('tenant','${t.id}')`)}${!db.contracts.some(c=>c.tenantId===t.id)?button('Delete',`removeRecord('tenants','${t.id}')`,'danger'):''}</div>`]),true)}</section>`
}

function tenantFormConfig(type, recordId='', related='', billingMonth='') {
  
    let fields='', title='', description='', record, submit;
  
    const note=formNote;
  
    record=db.tenants.find(t=>t.id===recordId)||{
  };
  title=recordId?'Edit tenant':'Add tenant';
  fields=field('name','Tenant full name','text',record.name||'')+field('phone','Phone','tel',record.phone||'',optional)+field('email','Email','email',record.email||'',optional)+field('cnic','ID / CNIC','text',record.cnic||'',optional)+field('address','Address','textarea',record.address||'',{
    ...optional,full:true
  });
  submit=v=>upsert('tenants',recordId,{
    ...v,id:recordId||id()
  })
    return {
    fields,title,description,record,submit
  };

}
