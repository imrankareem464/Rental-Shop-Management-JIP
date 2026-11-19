'use strict';

// Navigation, page rendering and final startup.

const navItems=[['dashboard','Dashboard','home'],['shops','Shops','shop'],['tenants','Tenants','users'],['contracts','Contracts','file'],['collection','Rent Collection','money'],['receipts','Receipts','receipt'],['outstanding','Outstanding','alert'],['notices','Notices & Reminders','bell'],['renewal','Renewal & Increase','calendar'],['expenses','Expenses & Maintenance','wrench'],['utilities','Utilities','bolt'],['reports','Reports','chart'],['settings','Settings','settings']];

const descriptions={
  dashboard:"Welcome back! Here's an overview of your rental properties.",shops:'Manage shops, business types, blocks and floors.',tenants:'Keep your tenant directory and contact details up to date.',contracts:'Manage rental agreements, dates, deposits and payment terms.',collection:'Record full or partial rent payments for a billing month.',receipts:'Find, print and review your payment receipts.',outstanding:'All unpaid rental months through the selected reporting month.',notices:'Draft reminders and track delivery manually.',renewal:'Track expiries, renew agreements and schedule rent increases.',expenses:'Record property expenses and maintenance work.',utilities:'Track electricity, water and other shop utility charges.',reports:'Review monthly collection, outstanding balances and operating income.',settings:'Organization details, backups and local workspace settings.'
};

const primary={
  dashboard:['Add New Shop','shop'],shops:['Add Shop','shop'],tenants:['Add Tenant','tenant'],contracts:['Create Contract','contract'],collection:['Record Payment','payment'],receipts:['Record Payment','payment'],outstanding:['Record Payment','payment'],notices:['New Notice','notice'],renewal:['Create Contract','contract'],expenses:['Add Expense','expense'],utilities:['Add Utility Bill','utility'],reports:['Record Payment','payment'],settings:['Backup Data','backup']
};

function go(p){
  page=p;
  statusFilter='All';
  $('search').value='';
  document.body.classList.remove('menu-open');
  if(p==='notices'){
    generateReminders();
    window.scrollTo?.(0,0);
    return
  }
  render();
  window.scrollTo?.(0,0)
}

function render(){
  if(!/^\d{4}-\d{2}$/.test(month()))return;
  $('nav').innerHTML=navItems.map(([p,n,i])=>`<button class="${page===p?'active':''}" onclick="go('${p}')">${icon(i)}${n}</button>`).join('');
  $('pageTitle').textContent=navItems.find(n=>n[0]===page)[1];
  $('subtitle').textContent=descriptions[page];
  $('org').textContent=db.settings.organization;
  $('adminLabel').textContent=getLocalProfile().name;
  $('today').innerHTML=icon('calendar')+`<div><small>Today</small>${fmtDate(today())}</div>`;
  let alerts=db.contracts.filter(c=>daysLeft(c)>=0&&daysLeft(c)<=30).length+outstanding().length;
  $('bell').innerHTML=icon('bell')+(alerts?`<i>${alerts>99?'99+':alerts}</i>`:'');
  const [text,type]=primary[page];
  $('primaryAction').textContent='＋ '+text;
  $('primaryAction').onclick=()=>type==='backup'?backup():openForm(type);
  $('primaryAction').hidden = page === 'dashboard';
  const views={
    dashboard:dashboard,shops:shopsView,tenants:tenantsView,contracts:contractsView,collection:collectionView,receipts:receiptsView,outstanding:outstandingView,notices:noticesView,renewal:renewalView,expenses:expensesView,utilities:utilitiesView,reports:reportsView,settings:settingsView
  };
  $('main').innerHTML=views[page]();
}

// Initialization runs only after every classic script has loaded.
loadLocalWorkspace();

$('month').value=today().slice(0,7);

$('brandIcon').innerHTML=icon('shop');

render();

