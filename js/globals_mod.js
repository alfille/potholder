/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */

// globals cookie backed
globalThis. potId = null ;
globalThis. noteId = null ;
globalThis. displayState = null ;
globalThis. remoteCouch = null ;

// other globals
globalThis. credentialList = ["database", "username", "password", "address" ] ;

// singleton class instances
globalThis. objectPage = null ;
globalThis. objectPotData = null ;
globalThis. objectNoteList = {
    category: 'Uncategorized',
    };
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

// admin only
globalThis. objectUser = null;

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
    // Add Extra buttons
    document.querySelector("#moreTop").querySelectorAll("button")
    .forEach( b => document.querySelectorAll(".topButtons").forEach(t=>t.appendChild(b.cloneNode(true))) );

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

    // set Quick Photo buttons
    document.querySelectorAll(".Qphoto").forEach( q => {
        q.title = "Quick photo using camera or from gallery" ;
        q.addEventListener("click",()=>objectPage.show('QuickPhoto'));
        });

    // set edit details for PotData edit pages -- only for "top" portion
    document.querySelectorAll(".edit_data").forEach( e => {
        e.title = "Unlock record to allow changes" ;
        e.addEventListener("click",()=>objectPotData.clickEdit());
        });

    // set save details for PotData save pages
    document.querySelectorAll(".savedata").forEach( s => {
        s.title = "Save your changes to this record" ;
        s.addEventListener("click",()=>objectPotData.savePatientData());
        });
    // remove redundant mission buttons
    [...document.querySelectorAll(".topButtons")]
    .filter(d => d.querySelector(".missionLogo"))
    .forEach( d => d.removeChild(d.querySelector(".missionButton")));

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

export function TitleBox( titlearray=null, show="PotMenu" ) {
    if ( titlearray == null ) {
        document.getElementById( "titlebox" ).innerHTML = "" ;
    } else {
        document.getElementById( "titlebox" ).innerHTML = `<button type="button" onClick='objectPage.show("${show}")'>${titlearray.join(" ")}</button>` ;
    }
}


