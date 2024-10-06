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
    } from "./globals_mod.js" ;

import {
	StatBox,
	BlankBox,
} from "./titlebox.js" ;
    
// used to generate data entry pages "PotData" type
import {
	structDatabaseInfo,
	structGeneralPot,
	structImages,
	structNewPot,
	structProcess,
	structRemoteUser,
} from "./doc_struct.js" ;

import {
	createQueries,
} from "./query_mod.js" ;

import {
    PotImages,
    Thumb,
    } from "./image_mod.js" ;

import {
    Id_pot,
    } from "./id_mod.js";

import {
    } from "./cookie_mod.js" ;

import {
    PotTable,
    MultiTable,
    SearchTable,
    AssignTable,
    } from "./sorttable_mod.js" ;

import {
    PotData,
    PotDataEditMode,
    PotDataRaw,
    } from "./doc_data_mod.js" ;

import {
    } from "./log_mod.js" ;
    
import {
    Pagelist
    } from "./page_mod.js" ;
    
import {
    } from "./replicate_mod.js" ;

class Administration extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}

class DatabaseInfo extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        db.info()
        .then( doc => {
            objectPotData = new DatabaseInfoData( doc, structDatabaseInfo );
            })
        .catch( err => objectLog.err(err) );
    }
}

class RemoteDatabaseInput extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        const doc = Object.assign({},remoteCouch) ;
        doc.raw = "fixed";
        objectPotData = new DatabaseData( doc, structRemoteUser );
    }
}

class MakeURL extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        let url = new URL( "/index.html", window.location.href ) ;
        if ( url.hostname == 'localhost' ) {
            url = new URL( "/index.html", remoteCouch.address ) ;
            url.port = '';
        }
		Object.entries(remoteCouch)
		.forEach( ([k,v]) => url.searchParams.append( k, v ) );
		new QRious( {
			value: url.toString(),
			element: document.getElementById("qr"),
			size: 300,
		});
		document.getElementById("MakeURLtext").href = url.toString() ;
    }
}

class DatabaseInfoData extends PotData {
    savePieceData() {}
}

class DatabaseData extends PotDataRaw {
    // starts with "EDIT" clicked
    constructor(doc,struct) {
        if ( remoteCouch.database=="" ) {
            // First time
            super(true,doc,struct); // clicked = true
        } else {
            super(false,doc,struct); // clicked = false
        }
    }

    savePieceData() {
        if ( this.loadDocData(this.struct,this.doc) ) {
            if ( this.doc.raw=="fixed" ) {
                this.doc.address=objectRemote.SecureURLparse(this.doc.address); // fix up URL
            }
            delete this.doc.raw ;
            objectCookie.set ( "remoteCouch", Object.assign({},this.doc) );
        }
		new StatBox() ;
        objectPage.reset();
        location.reload(); // force reload
    }
}

class Help extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        objectPage.show("back");
    }
}

class AllPieces extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
		new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new PotTable();
        objectPot.getAllIdDoc(true)
        .then( (docs) => objectTable.fill(docs.rows ) )
        .catch( (err) => objectLog.err(err) );
    }
}

class AssignPic extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		objectPage.forget(); // don't return here
		new StatBox() ;
        objectPot.unselect() ; // Probably redundant
        objectTable = new AssignTable();
        objectPot.getAllIdDoc(true)
        .then( (docs) => objectTable.fill(docs.rows ) )
        .catch( (err) => objectLog.err(err) );
    }
}

class ListSeries extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Series", (doc)=>[doc?.series??"Unknown"] ) ;
    }
}

class ListFiring extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Firing", (doc)=>[doc?.firing??"Unknown"] ) ;
    }
}

class ListGlaze extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Glaze", (doc)=>{ if ("glaze" in doc) { return doc.glaze.map(x=>x.type); }} ) ;
    }
}

class ListClay extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Clay", (doc)=>{ if ("clay" in doc) { return doc.clay.map(x=>x.type); } } ) ;
    }
}

class ErrorLog extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        objectLog.show() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class FirstTime extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        if ( db !== null ) {
            objectPage.show("MainMenu");
        }
    }
}

class InvalidPiece extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static safeLanding  = false ; // don't return here

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class MainMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class ListMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class PotNew extends Pagelist {
	// record doesn't exist -- make one
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		objectPage.forget();
		if ( objectPot.isSelected() ) {
			// existing but "new"
			objectPot.getRecordIdPix(potId,true)
			.then( doc => objectPotData = new PotNewData( doc, structNewPot ) )
			.catch( err => objectLog.err(err) ) ;
		} else {
			objectPotData = new PotNewData( objectPot.create(), structNewPot ) ;
		}
    }
}

class PotNewData extends PotDataEditMode {
	constructor( ...args) {
		super(...args);
	}
	
    savePieceData() {
        this.loadDocData(this.struct,this.doc);
        this.doc.new = false ; // no longer new
        db.put( this.doc )
        .then( (response) => {
            objectPot.select(response.id)
            .then( () => objectPage.show( "PotMenu" ) );
            })
        //.catch( (err) => objectLog.err(err) )
        ;
    }
}

class PotEdit extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
				if ( doc?.new == true ) {
					objectPage.forget();
					objectPage.show( "PotNew" ) ;
				}
				objectPotData = new PotData( doc, structGeneralPot ) ;
				})
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
    }
}

class PotProcess extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
				if ( doc?.new == true ) {
					objectPage.forget();
					objectPage.show( "PotNew" ) ;
				}
				objectPotData = new PotData( doc, structProcess ) ;
				})
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
    }
}

class PotPix extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => { 
				if ( doc?.new == true ) {
					objectPage.forget();
					objectPage.show( "PotNew" ) ;
				} else {
					objectPotData = new PotData( doc, structImages ) ; 
				}
				})
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
    }
}

class PotMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
				if ( doc?.new == true ) {
					objectPage.forget();
					objectPage.show( "PotNew" ) ;
				} else {
					objectPot.select(potId) // update thumb
					.then( () => objectPot.showPictures(doc) ) ; // pictures on bottom
				}
                })
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                })
                ;
        } else {
            objectPage.show( "back" );
        }
    }
}

class SearchList extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
		new StatBox() ;
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new SearchTable() ;
        objectSearch.setTable();
    }
}

function parseURL() {
    // returns a dict of keys/values or null
    let url = new URL(location.href);
    let r = {};
    for ( let [n,v] of url.searchParams) {
        r[n] = v;
    }
    return r;
}

function clearLocal() {
    const remove = confirm("Remove the eMission data and your credentials from this device?\nThe central database will not be affected.") ;
    if ( remove ) {
        objectCookie.clear();
        // clear (local) database
        db.destroy()
        .finally( _ => location.reload() ); // force reload
    } else {
        objectPage.show( "MainMenu" );
    }
}
globalThis. clearLocal = clearLocal ;

function URLparse() {
    // need to establish remote db and credentials
    // first try the search field
    const qline = parseURL();
    objectRemote.start( qline ) ;
    
    // first try the search field
    if ( qline && ( "potId" in qline ) ) {
        objectPot.select( qline.potId )
        .then( () => objectPage.next("PotMenu") );
    }

    if ( Object.keys(qline).length > 0 ) {
        // reload without search params -- placed in Cookies
        window.location.href = "/index.html" ;
    }
}

// Application starting point
window.onload = () => {
    // Get Cookies
    objectCookie.initialGet() ;
    
    setButtons(); // load some common html elements

    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.pushState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => objectLog.err(err,"Service worker registration") );
    }
    
    // set state from URL
    URLparse() ; // look for remoteCouch and other cookies

    // Start pouchdb database       
    if ( credentialList.every( c => remoteCouch[c] !== "" ) ) {
        db = new PouchDB( remoteCouch.database, {auto_compaction: true} ); // open local copy

        // Thumbnails
        objectThumb = new Thumb() ;

        // Secondary indexes
        createQueries();
        db.viewCleanup()
        .then( () => objectThumb.getAll() )
        .catch( err => objectLog.err(err,"Query cleanup") );

        // now start listening for any changes to the database
        db.changes({ 
			since: 'now', 
			live: true, 
			include_docs: false 
			})
        .on('change', (change) => {
			console.log("CHANGE",change);
            if ( change?.deleted ) {
                objectThumb.remove( change.id ) ;
            } else {
                objectThumb.getOne( change.id ) ;
            }
            // update screen display
            if ( objectPage.test("AllPieces") ) {
                objectPage.show("AllPieces");
            }
            })
        .catch( err => objectLog.err(err,"Initial search database") );

        // start sync with remote database
        objectRemote.foreverSync();

        // now jump to proper page
        objectPage.show( null ) ;

        // Set patient, operation and note -- need page shown first
        if ( objectPot.isSelected() ) { // mission too
            objectPot.select() ;
        }

    } else {
        db = null;
        objectPage.reset();
        objectPage.show("FirstTime");
    }
};
