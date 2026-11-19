'use strict';

// Local workspace loading and display profile. No real authentication is implemented.

/** Local workspace bootstrap only. This offline app has no server login or access control. */
function loadLocalWorkspace() {
   try{
    const saved=localStorage.getItem(KEY);
    if(saved){
      const candidate=JSON.parse(saved);
      validate(candidate);
      db=candidate
    }
    else{
      let old=localStorage.getItem(LEGACY);
      if(old){
        let imported=migrate(JSON.parse(old));
        validate(imported);
        localStorage.setItem(KEY,JSON.stringify(imported));
        db=imported
      }
    }
  }
  catch(e){
    storageAvailable=false;
    $('storageWarning').textContent='Saved data could not be loaded. Existing storage has not been overwritten. Restore a valid JSON backup in Settings.'
  }
  
}

function getLocalProfile() {
   return {
     name: db.settings.admin, mode: 'local', authenticated: false
  };
  
}
