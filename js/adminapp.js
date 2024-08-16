/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

import {
    cloneClass,
    setButtons,
    TitleBox,
    } from "./globals_mod.js" ;

import {
    ImageImbedded,
    } from "./image_mod.js" ;

import {
    Id,
    Id_pot,
    Id_note,
    } from "./id_mod.js";

import {
    } from "./cookie_mod.js" ;

import {
    SortTable,
    } from "./sorttable_mod.js" ;

import {
    PatientData,
    PatientDataEditMode,
    PatientDataRaw,
    } from "./patientdata_mod.js" ;

import {
    } from "./log_mod.js" ;

import {
    } from "./replicate_mod.js" ;

// used to generate data entry pages "PatientData" type
const structDatabase = [
    {
        name: "username",
        hint: "Your user name for access",
        type: "text",
    },
    {
        name: "password",
        hint: "Your password for access",
        type: "text",
    },    
    {
        name: "address",
        alias: "Remote database server address",
        hint: "emissionsystem.org -- don't include database name",
        type: "text",
    },
    {
        name: "raw",
        alias: "  process address",
        hint: "Fix URL with protocol and port",
        type: "radio",
        choices: ["fixed","raw"],
    },
    {
        name: "database",
        hint: 'Name of patient information database (e.g. "ukraine"',
        type: "text",
    },
];

const structDatabaseInfo = [
    {
        name: "db_name",
        alias: "Database name",
        hint: "Name of underlying database",
        type: "text",
    },
    {
        name: "doc_count",
        alias: "Document count",
        hint: "Total number of undeleted documents",
        type: "number",
    },
    {
        name: "update_seq",
        hint: "Sequence number",
        type: "number",
    },
    {
        name: "adapter",
        alias: "Database adapter",
        hint: "Actual database type used",
        type: "text",
    },
    {
        name: "auto_compaction",
        alias: "Automatic compaction",
        hint: "Database compaction done automaticslly?",
        type: "text",
    },
];

class DatabaseInfoData extends PatientData {
    savePatientData() {}
}

class DatabaseData extends PatientDataRaw {
    // starts with "EDIT" clicked
    constructor(...args) {
        if ( remoteCouch.database=="" ) {
            // First time
            super(true,...args); // clicked = true
            this.clickEditButtons() ;
        } else {
            super(false,...args); // clicked = false
        }
    }

    savePatientData() {
        if ( this.loadDocData()[0] ) {
            if ( this.doc[0].raw=="fixed" ) {
                this.doc[0].address=objectRemote.SecureURLparse(this.doc[0].address); // fix up URL
            }
            delete this.doc[0].raw ;
            objectCookie.set ( "remoteCouch", Object.assign({},this.doc[0]) );
        }
        objectPage.reset();
        location.reload(); // force reload
    }
}

class User { // convenience class
    constructor() {
		this.user_db = null ; // the special user couchdb database for access control
		this.id = null; // not cookie backed
    }
    simple_url() {
        let url = new URL( "/index.html", window.location.href ) ;
        if ( url.hostname == 'localhost' ) {
            url = new URL( "/index.html", remoteCouch.address ) ;
            url.port = '';
        }
        return url
    }

    make_url( user_dict ) {
        let url = objectUser.simple_url() ;
        credentialList.forEach( c => url.searchParams.append( c, user_dict[c] ) );
        return url ;
    }

    bodytext( user_dict ) {
        return `Welcome, ${user_dict.username}, to PotHolder.

  PotHolder: Ceramic Project Tracker

You have an account:

  web address: ${remoteCouch.address}
     username: ${user_dict.username}
     password: ${user_dict.password}
     database: ${remoteCouch.database}

Full link (paste into your browser address bar):
  ${objectUser.make_url( user_dict ).toString()}

Hope this augments your artistic creation.
`
        ;
    }

    send( doc ) {
        if ( 'quad' in doc ) {
            document.getElementById("SendUserMail").href = "";
            document.getElementById("SendUserPrint").onclick=null;
            let url = User.make_url(doc.quad);
            new QR(
                document.getElementById("SendUserQR"),
                url.toString(),
                200,200,
                4);
            document.getElementById("SendUserEmail").value = doc.email;
            document.getElementById("SendUserLink").value = url.toString();

            let mail_url = new URL( "mailto:" + doc.email );
            mail_url.searchParams.append( "subject", "Welcome to eMission" );
            mail_url.searchParams.append( "body", this.bodytext(doc.quad) );
            document.getElementById("SendUserMail").href = mail_url.toString();
            document.getElementById("SendUserPrint").onclick=()=>objectUser.printUserCard(doc.quad);
        }
    }

    printUserCard(user_dict) {
        let card = document.getElementById("printUser");
        let url = this.make_url(user_dict);
        card.querySelector("#printUserText").innerText=this.bodytext( user_dict ) ;
        new QR(
            card.querySelector(".qrUser"),
            url.toString(),
            300,300,
            4);

        objectPage.show_screen( "user" ) ;
    }
}
objectUser = new User() ;

class Page { // singleton class
    constructor() {
        // get page history from cookies
        // much simplified from app.js -- no checking of entries or history
        // since any unrecognized entries send us back to app.js
        this.path = displayState;
        this.lastscreen = null ; // splash/screen/patient for show_screen
        if ( this.path == null ) {
            this.reset() ;
        }
    }
    
    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
        objectCookie.set ( "displayState", this.path ) ;
    }

    back() {
        // don't check entry -- 'app.js' will do that
        this.path.shift() ;
        if ( this.path.length == 0 ) {
            this.reset();
        }
    }

    current() {
        if ( this.path.length == 0 ) {
            this.reset();
        }
        return this.path[0];
    }

    next( page = null ) {
        if ( page == "back" ) {
            this.back();
        } else if ( page == null ) {
            return ;
        } else {
            let iop = this.path.indexOf( page ) ;
            if ( iop < 0 ) {
                // add to from of page list
                this.path.unshift( page ) ;
            } else {
                // trim page list back to prior occurence of this page (no loops, finite size)
                this.path = this.path.slice( iop ) ;
            }
            objectCookie.set ( "displayState", this.path ) ;
        }
    }

    test( page ) {
        return this.current()==page ;
    }

    forget() {
        this.back();
    }

    link() {
        window.open( new URL(`/book/${this.current()}.html`,location.href).toString(), '_blank' );
    } 
    
    show( page = "Administration", extra="" ) { // main routine for displaying different "pages" by hiding different elements
        if ( db == null || credentialList.some( c=> remoteCouch[c]=='' ) ) {
            if ( page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.next(page) ; // update reversal list

        // clear old image urls
        ImageImbedded.clearSrc() ;
        ImageImbedded.clearSrc() ;

        this.show_screen( "screen" ); // basic page display setup

        // send to page-specific code
        const page_class = Pagelist.subclass(objectPage.current()) ;
        if ( page_class ) {
            page_class.show(extra) ;
        } else {
            window.location.href="/index.html" ;
        }
    }

   show_screen( type ) { // switch between screen and print
        if ( type !== this.lastscreen ) {
            this.lastscreen == type ;
            document.getElementById("splash_screen").style.display = "none";
            let showscreen = {
                ".work_screen": type=="screen",
                ".print_user": type == "user",
            };
            for ( let cl in showscreen ) {
                document.querySelectorAll(cl)
                .forEach( (v)=> v.style.display=showscreen[cl]?"block":"none"
                );
            }
            if ( type!=="screen" ) {
                printJS({
                    printable:"printUser",
                    type:"html",
                    ignoreElements:["printCardButtons"],
                    documentTitle:"Name and Credentials",
                    onPrintDialogClose: ()=>objectPage.show("back"),
                });
            }
        }
    }    
}

class Pagelist {
    // list of subclasses = displayed "pages"
    // Note that these classes are never "instantiated -- only used statically
    static pages = {} ; // [pagetitle]->class -- pagetitle ise used by HTML to toggle display of "pages"
    // prototype to add to pages
    static AddPage() { Pagelist.pages[this.name]=this; }
    // safeLanding -- safe to resume on this page
    static safeLanding = true ; // default
    
    static show(extra="") {
        // set up display
        document.querySelector(".patientDataEdit").style.display="none"; 
        document.querySelectorAll(".topButtons")
            .forEach( tb => tb.style.display = "block" );

        document.querySelectorAll(".pageOverlay")
            .forEach( po => po.style.display = po.classList.contains(this.name) ? "block" : "none" );

        this.subshow(extra);
    }
    
    static subshow(extra="") {
        // default version, derived classes may overrule
        // Simple menu page
    }
    
    static subclass(pagetitle) {
        let cls = Pagelist.pages[pagetitle] ?? null ;
        if ( cls ) {
            return cls ;
        } else {
            // unrecognized entry -- will force return to main
            return null ;
        }
    } 
}

class RemoteDatabaseInput extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        const doc = Object.assign({},remoteCouch) ;
        doc.raw = "fixed";
        objectPatientData = new DatabaseData( doc, structDatabase );
    }
}

class Administration extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}

class DatabaseInfo extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        db.info()
        .then( doc => {
            objectPatientData = new DatabaseInfoData( doc, structDatabaseInfo );
            })
        .catch( err => objectLog.err(err) );
    }
}

class ErrorLog extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectLog.show() ;
    }
}

class PrintYourself extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="MainMenu") {
        objectUser.printUserCard(remoteCouch);
    }
}

class SendUser extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectUser.user_db == null ) {
            objectPage.show( "SendUser" );
        } else if ( objectUser.id == null ) {
            objectPage.show( "back" );
        } else {
            objectUser.user_db.get( objectUser.id )
            .then( doc => objectUser.send( doc ) )
            .catch( err => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        }
    }
}

function parseQuery() {
    // returns a dict of keys/values or null
    const url = new URL(location.href);
    let r = {};
    for ( let [n,v] of url.searchParams) {
        r[n] = v;
    }
    //location.search = "";
    return r;
}

function URLparse() {
    // need to establish remote db and credentials
    // first try the search field
    const qline = parseQuery();
    
    if ( Object.keys(qline).length > 0 ) {
        // non-empty search field -- send back to index.html
        let u = new URL(window.location.href) ;
        u.pathname = "/index.html" ;
        window.location.href = u.toString()
    }
    objectRemote.start() ;
}

// Application starting point
window.onload = () => {
    // Get Cookies
    objectCookie.initialGet() ;
    objectPage = new Page();
        
    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.pushState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => objectLog.err(err,"Service worker registration") );
    }
    
    setButtons() ;

    // set state from URL or cookies
    URLparse() ; // look for remoteCouch and exclude command line parameters

    // Start pouchdb database       
    if ( credentialList.every( c=> remoteCouch[c] !== "" ) ) {
        db = new PouchDB( remoteCouch.database, {auto_compaction: true} ); // open local copy
        document.querySelectorAll(".headerboxlink")
        .forEach( q => q.addEventListener("click",()=>objectPage.show("MainMenu")));

        // start sync with remote database
        objectRemote.foreverSync();

        // now jump to proper page
        objectPage.show( null ) ;

    } else if ( objectPage.current() == "RemoteDatabaseInput" ) {
        // now jump to proper page
        objectPage.show( null ) ;

    } else {
        db = null;
        objectPage.reset();
        objectPage.show("FirstTime");
    }
};
