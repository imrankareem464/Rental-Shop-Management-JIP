'use strict';

// Dashboard cards, charts and summaries.

function metric(label,value,note,color,ico,isMoney=false){
  return `<div class="stat ${color}"><div class="round">${icon(ico)}</div><h3>${label}</h3><strong class="${isMoney?'amount':''}">${value}</strong><small>${note}</small></div>`
}

function daysLeft(c){
  return Math.round((Date.parse(c.end+'T00:00:00Z')-Date.parse(today()+'T00:00:00Z'))/86400000)
}

function chart(){
  const months=monthsBetween(month().slice(0,4)+'-01',month()).slice(-10),vals=months.map(m=>({
    m,got:collected(m),due:Math.max(0,expected(m)-collected(m))
  })),max=Math.max(...vals.map(v=>v.got+v.due),1);
  const ticks=Array.from({
    length:5
  },(_,i)=>{
    let y=160-i*35,n=max*i/4;
    return `<line x1="43" y1="${y}" x2="435" y2="${y}" stroke="#e9eef6"/><text x="36" y="${y+3}" text-anchor="end">${n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?(n/1000).toFixed(0)+'K':Math.round(n)}</text>`
  }).join('');
  let w=370/vals.length;
  return `<div class="chart"><svg viewBox="0 0 450 190" role="img" aria-label="Rent collection chart, green collected and red pending">${ticks}${vals.map((v,i)=>{
    let x=52+i*w,h=v.got/max*140,d=v.due/max*140;
    return `<g><title>${monthName(v.m)}: collected ${money(v.got)}, pending ${money(v.due)}</title><rect x="${x}" y="${160-h}" width="${Math.min(w*.55,28)}" height="${h}" fill="#28b185"/><rect x="${x}" y="${160-h-d}" width="${Math.min(w*.55,28)}" height="${d}" fill="#f25c73"/><text x="${x+Math.min(w*.55,28)/2}" y="180" text-anchor="middle">${new Date(v.m+'-01T12:00:00').toLocaleDateString('en',{
      month:'short'
    })}</text></g>`
  }).join('')}</svg></div>`
}

function topOutstanding(){
  const groups=[];
  for(const t of db.tenants){
    const lines=outstanding().filter(x=>x.contract.tenantId===t.id);
    if(lines.length)groups.push({
      t,lines,amount:total(lines,'balance')
    })
  }
  return groups.sort((a,b)=>b.amount-a.amount)
}

function dashboard(){
  const totalShops=db.shops.length,rented=new Set(monthlyContracts().map(c=>c.shopId)).size,vacant=totalShops-rented,exp=expected(),got=collected(),due=amount(exp-got),allDue=total(outstanding(),'balance'),expiry=db.contracts.filter(c=>daysLeft(c)>=0&&daysLeft(c)<=60).sort((a,b)=>a.end.localeCompare(b.end));
  let html=(!totalShops?`<div class="banner"><div><strong>Your rental workspace is ready.</strong>Add your shops, tenants and contracts to see live totals, or explore with clearly labeled sample data.</div>${button('Explore demo data','loadDemo()')}</div>`:'');
  if(db.demo)html+=`<div class="banner warning"><div><strong>Demo workspace — sample records only</strong>These records are fictional. Use Settings → Start empty workspace before entering real records.</div>${button('Manage demo data',"go('settings')")}</div>`;
  
html+=`<div class="stats">${metric('Total Shops',totalShops,'All properties','blue','shop')}${metric('Rented Shops',rented,`${totalShops?Math.round(rented/totalShops*100):0}% occupied`,'green','shop')}${metric('Vacant Shops',vacant,`${totalShops?Math.round(vacant/totalShops*100):0}% available`,'orange','shop')}${metric('Total Monthly Rent',money(exp),'Expected for '+monthName(month()),'purple','money',true)}${metric('Collected This Month',money(got),`${exp?Math.round(got/exp*100):0}% of expected rent`,'teal','money',true)}${metric('Outstanding Amount',money(due),'Selected month · rent only','red','alert',true)}</div>`;
  
html+=`<div class="top-grid">${panel('Rent Collection Overview','calendar',`<div class="legend" style="justify-content:flex-end;padding:0 4px 8px"><span><i class="dot"></i>Collected</span><span><i class="dot red-dot"></i>Pending</span></div>${chart()}`)}${panel('Shop Status','money',`<div class="donut-wrap"><div class="donut" style="--angle:${totalShops?rented/totalShops*360:0}deg;${!totalShops?'background:#e9eef6':''}"><div class="donut-center"><b>${totalShops}</b>Total Shops</div></div><div class="donut-key"><div><i class="dot"></i>Rented <b>${rented}</b></div><div><i class="dot orange-dot"></i>Vacant <b>${vacant}</b></div></div></div>`)}${panel('Upcoming Contract Expiry','calendar',table(['Shop No.','Tenant Name','Expiry Date','Days Left'],expiry.slice(0,5).map(c=>[esc(shop(c)?.no),esc(tenant(c)?.name),fmtDate(c.end),badge(daysLeft(c),daysLeft(c)<=14?'':'ok')])),'View All','renewal')}</div>`;
  
const tops=topOutstanding().slice(0,5),recent=validPayments().slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const notifications=[...expiry.slice(0,2).map(c=>({
    text:`Contract expires in ${daysLeft(c)} days (${shop(c)?.no})`,date:today(),ico:'calendar'
  })),...db.events.slice(0,4).map(e=>({
    ...e,ico:'bell'
  }))].slice(0,5);
  let blocks=[...new Set(db.shops.map(s=>s.block||'Unassigned'))].sort();
  
html+=`<div class="dashboard-grid">${panel('Top 5 Outstanding Tenants','alert',table(['Shop No.','Tenant Name','Outstanding','Months'],tops.map(x=>[[...new Set(x.lines.map(l=>shop(l.contract)?.no))].map(esc).join(', '),esc(x.t.name),`<b class="text-red money">${money(x.amount)}</b>`,badge(new Set(x.lines.map(l=>l.month)).size)])),'View All','outstanding')}${panel('Recent Payments','money',table(['Date','Shop No.','Tenant Name','Amount'],recent.map(p=>[fmtDate(p.date),esc(p.snapshot.shopNo),esc(p.snapshot.tenant),`<b class="text-green money">${money(p.amount)}</b>`])),'View All','receipts')}${panel('Recent Notifications','bell',notifications.length?notifications.map(n=>`<div class="notification"><span class="square">${icon(n.ico)}</span><span>${esc(n.text)}</span><time>${fmtDate(n.date)}</time></div>`).join(''):empty('Payment, contract and notice activity will appear here.'),'View All','notices')}${panel('Income vs Expenses (This Month)','chart',[['Total Rent (Expected)',exp],['Collected Rent',got],['Pending Rent',due],['Operating Expenses',expenses()],['Utilities Collected',total(db.utilities.filter(u=>u.paid&&u.paidDate?.slice(0,7)===month()),'amount')]].map(([k,v])=>`<div class="summary-row"><span>${k}</span><span class="money ${k.includes('Pending')||k.includes('Expenses')?'text-red':''}">${money(v)}</span></div>`).join('')+`<div class="summary-row net"><span>Net Rental Income</span><span class="money">${money(got-expenses())}</span></div><small style="color:var(--muted);font-size:9px">Rent is grouped by billing month; utility receipts are shown separately.</small>`)}${panel('Shops by Block / Floor','pin',table(['Block','Total Shops','Rented','Vacant'],blocks.map(b=>{
    let list=db.shops.filter(s=>(s.block||'Unassigned')===b),r=list.filter(s=>currentContract(s)).length;
    return [esc(b),list.length,r,list.length-r]
  })),'View All','shops')}${panel('Quick Actions','bolt',`<div class="quick-actions">${[['Add New Shop','shop','shop','blue'],['Add Tenant','tenant','users','green'],['Create Contract','contract','file','purple'],['Generate Rent Bill','bill','receipt','orange'],['Draft Notice','notice','send','red'],['View Reports','reports','chart','teal']].map(([t,f,i,c])=>`<button class="${c}" onclick="${f==='reports'?"go('reports')":`openForm('${f}')`}">${icon(i)}${t}</button>`).join('')}</div>`)}</div><div class="hint" style="margin-top:15px">Total rental arrears through ${esc(monthName(month()))}: <b>${money(allDue)}</b>. Unpaid utility bills: <b>${money(utilityDue())}</b>. Rent is charged for full contract months; deposits are recorded separately and are not rental income.</div>`;
  return html
}
