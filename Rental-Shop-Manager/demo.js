'use strict';

// Fictional demonstration data.

function loadDemo(){
  if(db.shops.length&&!confirm('Demo data will REPLACE the current workspace. Download a backup first. Continue?'))return;
  transact(()=>{
    db=blank();
    db.demo=true;
    const yr=month().slice(0,4),m=month(),prev=monthsBetween(yr+'-01',m);
    let names=['Ahmed Traders','Al Noor Fashion','Farhan Electronics','Zainab Boutique','Usman Store','Bilal Bakers','Ayesha Grocery','Imran Pharmacy','Sana Collection','Asif General Store'];
    for(let i=0;
    i<12;
    i++){
      let sid=id();
      db.shops.push({
        id:sid,no:'S-'+String(i+1).padStart(3,'0'),name:i<10?names[i]:['Corner Store','Market Unit'][i-10],type:['General Store','Fashion','Electronics','Boutique','Grocery','Bakery','Grocery','Pharmacy','Clothing','General Store'][i%10],block:['A','B','C'][i%3],floor:i%3===0?'First':'Ground',notes:''
      });
      if(i<10){
        let tid=id(),cid=id(),r=22000+i*3000;
        db.tenants.push({
          id:tid,name:names[i],phone:'0300-0000000',email:'',cnic:'',address:'Demo Market'
        });
        let end=addDays(today(),10+i*7);
        if(end.slice(0,7)<m)end=m+'-28';
        db.contracts.push({
          id:cid,shopId:sid,tenantId:tid,start:yr+'-01-01',end,rent:r,deposit:r*2,dueDay:10,rates:[],notes:'Fictional sample agreement'
        });
        for(let [mi,bm] of prev.entries()){
          let got=bm===m?(i<7?r:i===7?r*.5:0):(i===9&&mi===prev.length-2?0:r);
          if(got)db.payments.push({
            id:id(),receipt:nextNumber('R',db.payments),contractId:cid,month:bm,date:bm+'-05',amount:got,payer:names[i],method:i%2?'Bank Transfer':'Cash',reference:'DEMO',void:false,snapshot:{
              shopNo:db.shops[i].no,shopName:names[i],tenant:names[i]
            }
          })
        }
      }
    }
    db.expenses.push({
      id:id(),date:m+'-03',category:'Maintenance',shopId:db.shops[1].id,description:'Shutter repair',vendor:'Demo Repairs',amount:12000,status:'Completed'
    },{
      id:id(),date:m+'-05',category:'Cleaning',shopId:'',description:'Market cleaning',vendor:'Demo Services',amount:8000,status:'Completed'
    });
    db.utilities.push({
      id:id(),number:'U-000001',shopId:db.shops[0].id,month:m,type:'Electricity',amount:5500,dueDate:m+'-20',description:'Sample electricity bill',paid:false
    });
    eventLog('Demo workspace loaded — fictional sample records');
    for(let c of db.contracts.slice(-2)){
      let n=makeNotice(c,m);
      if(n)db.notices.push(n)
    }
  },'Demo loaded. All records are fictional.');
  page='dashboard';
  render()
}
