'use strict';

// Shop directory and add/edit shop form.

const BUSINESS_TYPES = [
  'Bakery', 'General Store', 'Beauty Salon', 'Juice bar', 'Shoes and bags Shop', 'Pharmacy', 'Clothing Store', 'Electronics', 'Gift Shop', 'Grocery', 'Hardware Store', 'Mobile Shop',
  'Paint Store', 'Restaurant / Cafe', 'Stationery', 'Tailor', 'Medical Clinic', 'Other'
];

const FLOOR_OPTIONS = [
  'Basement', 'Lower Ground', 'Ground', 'Mezzanine',
  'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Roof'
];

function shopsView(){
  const list=db.shops.filter(s=>matches(s.no,s.name,s.type,s.block,s.floor));
  return toolbar(['All','Rented','Vacant'])+`<section class="panel">${table(['Shop No.','Shop / Business','Location / Floor','Current Tenant','Monthly Rent','Status','Actions'],list.filter(s=>statusFilter==='All'||(currentContract(s)?'Rented':'Vacant')===statusFilter).map(s=>{
    let c=currentContract(s);
    return [esc(s.no),`<strong>${esc(s.name)}</strong><small>${esc(s.type)}</small>`,`${esc(s.block)}<small>${esc(s.floor)}</small>`,esc(c?tenant(c)?.name:'—'),c?money(rate(c,month())):'—',badge(c?'Rented':'Vacant',c?'ok':''),`<div class="action-group">${button('Edit',`openForm('shop','${s.id}')`)}${!c?button('Rent out',`openForm('contract','','${s.id}')`):''}${!db.contracts.some(c=>c.shopId===s.id)&&!db.utilities.some(u=>u.shopId===s.id)?button('Delete',`removeRecord('shops','${s.id}')`,'danger'):''}</div>`]
  }),true)}</section>`
}

function shopFormConfig(type, recordId='', related='', billingMonth='') {
  let fields='', title='', description='', record, submit;
  const note=formNote;

  record=db.shops.find(s=>s.id===recordId)||{};
  title=recordId?'Edit shop':'Add new shop';
  fields=
    field('no','Shop number','text',record.no||'')+
    field('name','Shop name','text',record.name||'')+
    field('type','Business type','select',record.type||'',{
      options:[['','Select business type'],...BUSINESS_TYPES]
    })+
    field('block','Location','text',record.block||'A')+
    field('floor','Floor','select',record.floor||'Ground',{
      options:FLOOR_OPTIONS
    })+
    field('notes','Notes','textarea',record.notes||'',{...optional,full:true});
  submit=v=>{
    if(db.shops.some(s=>s.no.toLowerCase()===v.no.toLowerCase()&&s.id!==recordId))throw Error('This shop number already exists.');
    upsert('shops',recordId,{...v,id:recordId||id()});
    eventLog(`${recordId?'Updated':'Added'} shop ${v.no}`)
  };
  return {fields,title,description,record,submit};
}
