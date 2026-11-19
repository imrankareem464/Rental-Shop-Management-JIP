'use strict';

// Common dialog controller. Feature-specific form builders live in their feature files.

const optional={
  required:false
},shopOptions=()=>[['','Select shop'],...db.shops.map(s=>[s.id,s.no+' · '+s.name])],tenantOptions=()=>[['','Select tenant'],...db.tenants.map(t=>[t.id,t.name])],contractOptions=()=>[['','Select contract'],...db.contracts.map(c=>[c.id,`${shop(c)?.no} · ${tenant(c)?.name} (${c.start} → ${c.end})`])];

function formNote(text) {
   return '<div class="form-note">'+text+'</div>';
  
}

function openForm(type, recordId='', related='', billingMonth='') {
  
 const builders={
    shop:shopFormConfig,tenant:tenantFormConfig,contract:contractFormConfig,renew:contractFormConfig,payment:paymentFormConfig,bill:paymentFormConfig,notice:paymentFormConfig,expense:expenseFormConfig,utility:utilityFormConfig,utilityPayment:utilityPaymentFormConfig,increase:increaseFormConfig
  };
  
 const builder=builders[type];
   if(!builder) return;
  
 const config=builder(type,recordId,related,billingMonth);
   if(!config) return;
  
 const {
    fields,title,description,record,submit
  }
  =config;
  
 $('formTitle').textContent=title;
  $('formDescription').textContent=description;
  $('fields').innerHTML=fields;
  $('formError').textContent='';
  $('editor').onsubmit=e=>{
    e.preventDefault();
    let v=Object.fromEntries(new FormData(e.target));
    for(let k in v)v[k]=v[k].trim();
    if([...e.target.querySelectorAll('[required]')].some(el=>!el.value.trim())){
      $('formError').textContent='Complete all required fields.';
      return
    }
    let after;
    const ok=transact(()=>{
      after=submit(v)
    },type==='bill'?'Bill prepared.':'Record saved.');
    if(ok){
      closeForm();
      if(typeof after==='function')after()
    }
    else $('formError').textContent='The record could not be saved. Check the message below.'
  };
  $('formDialog').showModal();
  if(type==='payment'){
    $('f_contractId').onchange=$('f_month').onchange=()=>{
      let c=db.contracts.find(c=>c.id===$('f_contractId').value),m=$('f_month').value;
      if(c){
        $('f_amount').value=total(arrears(c,m),'balance')||'';
        const prev=Math.max(0,total(arrears(c,m),'balance')-(active(c,m)?balance(c,m):0));
        const future=monthsBetween(c.start,c.end).find(x=>x>m&&balance(c,x)>.009);
        const note=document.querySelector('#fields .form-note');
        if(note)note.textContent=`Previous pending: ${money(prev)} · Selected month due: ${money(active(c,m)?balance(c,m):0)} · Total due: ${money(total(arrears(c,m),'balance'))}${future?` · Next advance month: ${monthName(future)}`:''}`;
        $('f_payer').value=tenant(c)?.name||''
      }
    }
  }
}
// Add a new tenant directly from the contract dropdown.
const originalOpenForm = openForm;

openForm = function (...args) {
  originalOpenForm(...args);

  if (args[0] === "contract" || args[0] === "renew") {
    enableQuickTenant();
  }
};

function enableQuickTenant() {
  const dropdown = $("f_tenantId");

  if (!dropdown || !$("formDialog").open) return;

  const addOption = document.createElement("option");
  addOption.value = "__add_new_tenant__";
  addOption.textContent = "＋ Add New Tenant";
  dropdown.appendChild(addOption);

  let previousTenant = dropdown.value;

  dropdown.onchange = function () {
    if (this.value !== "__add_new_tenant__") {
      previousTenant = this.value;
      return;
    }

    this.value = previousTenant;
    openTenantFromContract();
  };
}

function openTenantFromContract() {
  const dialog = $("formDialog");
  const editor = $("editor");

  // Remember all information already entered in the contract.
  const contractDraft = {
    title: $("formTitle").textContent,
    description: $("formDescription").textContent,
    fields: $("fields").innerHTML,
    values: Object.fromEntries(new FormData(editor)),
    submitHandler: editor.onsubmit,
    error: $("formError").textContent
  };

  const existingTenantIds = new Set(
    db.tenants.map(tenant => tenant.id)
  );

  // Return to the contract after saving or cancelling the tenant.
  dialog.addEventListener("close", function () {
    const newTenant = db.tenants.find(
      tenant => !existingTenantIds.has(tenant.id)
    );

    $("formTitle").textContent = contractDraft.title;
    $("formDescription").textContent = contractDraft.description;
    $("fields").innerHTML = contractDraft.fields;
    $("formError").textContent = contractDraft.error;

    // Refresh the tenant list to include the newly saved tenant.
    $("f_tenantId").innerHTML = tenantOptions()
      .map(([value, label]) =>
        `<option value="${esc(value)}">${esc(label)}</option>`
      )
      .join("");

    // Restore shop, dates, rent, deposit and other entered values.
    for (const [name, value] of Object.entries(contractDraft.values)) {
      const input = editor.elements.namedItem(name);

      if (input) input.value = value;
    }

    if (newTenant) {
      $("f_tenantId").value = newTenant.id;
    }

    editor.onsubmit = contractDraft.submitHandler;

    dialog.showModal();
    enableQuickTenant();
  }, { once: true });

  // Reuse the existing dialog for the new tenant form.
  openForm("tenant");
}
