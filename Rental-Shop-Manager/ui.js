'use strict';

// Reusable table, panel, field and printable document components.

function badge(text,type=''){
  return `<span class="badge ${type}">${esc(text)}</span>`
}

function button(text,fn,cls=''){
  return `<button class="btn ${cls}" onclick="${fn}">${text}</button>`
}

function empty(text='No records yet. Add your first record to get started.'){
  return `<div class="empty">${icon('file')}${esc(text)}</div>`
}

function table(headers,rows,full=false){
  return `<div class="scroll"><table class="${full?'page-table':''}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${!rows.length?empty('No matching records.'):''}`
}

function panel(title,ico,content,link='',target=''){
  return `<section class="panel"><div class="panel-head"><h2>${icon(ico)}${title}</h2>${link?`<button class="text-btn" onclick="go('${target}')">${link}</button>`:''}</div><div class="panel-body">${content}</div></section>`
}

function toolbar(filters=[],extra=''){
  return `<div class="page-toolbar">${filters.length?`<div class="pill-tabs">${filters.map(f=>`<button class="${statusFilter===f?'selected':''}" onclick="statusFilter='${f}';render()">${f}</button>`).join('')}</div>`:''}${extra}<span class="count">${monthName(month())}</span></div>`
}

function miniMetric(label,v){
  return `<div class="panel"><small>${label}</small><strong>${v}</strong></div>`
}

function field(name,label,type='text',value='',opts={
}){
  let attr=`name="${name}" id="f_${name}" ${opts.required===false?'':'required'} ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.max!==undefined?`max="${opts.max}"`:''} ${type==='number'?`step="${opts.step||'0.01'}"`:''} ${opts.readonly?'readonly':''}`;
  let control=type==='select'?`<select ${attr}>${(opts.options||[]).map(o=>{
    let v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;
    return `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`
  }).join('')}</select>`:type==='textarea'?`<textarea ${attr}>${esc(value)}</textarea>`:`<input type="${type}" ${attr} value="${esc(value)}">`;
  return `<label class="${opts.full?'full':''}">${label}${control}</label>`
}

function closeForm(){
  $('formDialog').close()
}

function paperTitle(){
  return `${db.settings.organization}\n${[db.settings.address,db.settings.contact].filter(Boolean).join('\n')}\n${'─'.repeat(55)}\n`
}

function showPaper(title,text,noticeId=''){
  $('paperTitle').textContent=title;
  $('paper').textContent=text;
  $('saveNotice').hidden=!noticeId;
  $('saveNotice').onclick=()=>{
    const text=$('paper').textContent;
    transact(()=>{
      const n=db.notices.find(n=>n.id===noticeId);
      n.text=text;
      n.manuallyEdited=true
    },'Draft saved.')
  };
  $('paperDialog').showModal()
}
