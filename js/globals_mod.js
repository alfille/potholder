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
globalThis. objectNote = null ;
globalThis. objectCookie = null ;

// Database handles
globalThis.db = null ; // will be Pouchdb local copy 

// app only
globalThis. objectSearch = null;
globalThis. objectThumb = null;

// download only
// singleton class instances
globalThis. objectPPTX = null;
globalThis. objectZIP = null;

// Commonly used function
export function cloneClass( fromClass, target ) {
    let c = document.getElementById("templates").querySelector(fromClass);
    target.innerHTML = "";
    c.childNodes.forEach( cc => target.appendChild(cc.cloneNode(true) ) );
}

export function setButtons() {
    // set Help buttons
    document.querySelectorAll(".Qmark").forEach( h => {
        h.title = "Open explanation in another tab" ;
        h.addEventListener("click",()=>objectPage.link());
        });

    // set Search buttons
    document.querySelectorAll(".Search").forEach( s => {
        s.title = "Search everywhere for a word or phrase" ;
        s.addEventListener("click",()=>objectPage.show('SearchList'));
        });

    // set edit details for PotData edit pages -- only for "top" portion
    document.querySelectorAll(".edit_data").forEach( e => {
        e.title = "Unlock record to allow changes" ;
        e.addEventListener("click",()=>objectPotData.edit_doc());
        });

    // set save details for PotData save pages
    document.querySelectorAll(".savedata").forEach( s => {
        s.title = "Save your changes to this record" ;
        s.addEventListener("click",()=>objectPotData.savePieceData());
        });
        
    // modal picture display
    document.getElementById("modal_close").onclick = 
		() => document.getElementById("modal_id").style.display="none";
        
    document.querySelectorAll(".headerboxlink")
    .forEach( q => q.addEventListener("click",() => {
            if ( objectPage && objectPage.current() != "MainMenu" ) {
                objectPage.show("MainMenu") ;
            } else {
                if ( objectPage ) {
                    objectPage.reset();
                }
                window.location.href="/index.html"; // force reload
            }
        })
        );
}

export function TitleBox( doc ) {
    if ( doc == null ) {
        document.getElementById( "titlebox" ).innerHTML = "" ;
    } else if ( typeof(doc)=='string' ) {
        document.getElementById( "titlebox" ).innerHTML = `<B>${doc}</B>` ;
    } else {
        document.getElementById( "titlebox" ).innerHTML = `<button type="button" onClick='objectPage.show("PotMenu")'>${[doc?.type,"from",doc?.series,"by",doc?.artist,doc?.start_date].join(" ")}</button>` ;
    }
}


