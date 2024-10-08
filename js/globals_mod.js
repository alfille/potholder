/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */

// globals cookie backed
globalThis. potId = null ;
globalThis. displayState = null ;
globalThis. remoteCouch = null ;

// other globals
globalThis. credentialList = ["database", "username", "password", "address" ] ;

// singleton class instances
globalThis. objectPage = null ;
globalThis. objectPotData = null ;
globalThis. objectTable = null ;
globalThis. objectRemote = null ;
globalThis. objectLog = null ;
globalThis. objectPot = null ;
globalThis. objectCookie = null ;
globalThis. objectSearch = null;
globalThis. objectThumb = null;

// Database handles
globalThis.db = null ; // will be Pouchdb local copy 

// Commonly used function
export function cloneClass( fromClass, target ) {
    let c = document.getElementById("templates").querySelector(fromClass);
    target.innerHTML = "";
    c.childNodes.forEach( cc => target.appendChild(cc.cloneNode(true) ) );
}

export function setButtons() {
    // set Help buttons
    // set edit details for PotData edit pages -- only for "top" portion
//    document.querySelectorAll(".edit_data").forEach( e => {
//        e.title = "Unlock record to allow changes" ;
//        e.addEventListener("click",()=>objectPotData.edit_doc());
//        });

    // set save details for PotData save pages
    document.querySelectorAll(".savedata").forEach( s => {
        s.title = "Save your changes to this record" ;
        s.addEventListener("click",()=>objectPotData.savePieceData());
        });
        
}
