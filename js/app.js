/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

import {
	StatBox,
	TextBox,
} from "./titlebox.js" ;
    
// used to generate data entry pages "PotData" type
import {
	structDatabaseInfo,
	structGeneralPot,
	structImages,
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
    PotDataPrint,
    } from "./print_data_mod.js" ;

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

    static show_content(extra="") {
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

    static show_content(extra="") {
		new TextBox("Your Credentials") ;
        const doc = Object.assign({},remoteCouch) ;
        doc.raw = "fixed";
        objectPotData = new DatabaseData( doc, structRemoteUser );
    }
}

class MakeURL extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
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

class PotPrint extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotDataPrint( doc, structGeneralPot.concat(structProcess,structImages) ) )
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
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
        objectPage.reset();
        location.reload(); // force reload
    }
}

class Help extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        objectPage.show("back");
    }
}

class AllPieces extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new PotTable();
        objectPot.getAllIdDoc(false)
        .then( (docs) => objectTable.fill(docs.rows ) )
        .catch( (err) => objectLog.err(err) );
    }
}

class AssignPic extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
		objectPage.forget(); // don't return here
		// Title adjusted to source and number
		if ( pictureSource.files.length == 0 ) {
			// No pictures taken/chosen
			return ;
		} else if (pictureSource.id=="HiddenPix") {
			new TextBox( `New Photo. Assign to which piece?` ) ;
		} else {
			if (pictureSource.files.length == 1 ) {
				new TextBox( "1 image selected. Assign to which piece?" ) ;
			} else {
				new TextBox( `${pictureSource.files.length} images selected. Assign to which piece?` ) ;
			}
		}
		// make table
        objectTable = new AssignTable();
        objectPot.getAllIdDoc(false)
        .then( (docs) => objectTable.fill(docs.rows ) )
        .catch( (err) => objectLog.err(err) );
    }
}

class ListSeries extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("grouped by Series") ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( (doc)=>[doc?.series??"unknown"] ) ;
    }
}

class ListType extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("grouped by Type of Piece") ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( (doc)=>[doc?.type??"unknown"] ) ;
    }
}

class ListFiring extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("grouped by Firing") ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( (doc)=>[doc?.firing??"unknown"] ) ;
    }
}

class ListGlaze extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("grouped by Glaze") ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( (doc)=>{ if ("glaze" in doc) { return doc.glaze.map(x=>x.type); }} ) ;
    }
}

class ListClay extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("grouped by Clay") ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( (doc)=>{ if ("clay" in doc) { return doc.clay.map(x=>x.type); } } ) ;
    }
}

class ErrorLog extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
        new TextBox("Error Log");
        objectLog.show() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class FirstTime extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect() ;
		new TextBox("Welcome") ;
        if ( db !== null ) {
            objectPage.show("MainMenu");
        }
    }
}

class InvalidPiece extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
		objectPage.forget() ; // don't return here
        objectPot.unselect();
		new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class MainMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect();
		new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class ListMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        objectPot.unselect();
		new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class PotNew extends Pagelist {
	// record doesn't exist -- make one
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
		objectPage.forget();
		new TextBox("New Piece");
		if ( objectPot.isSelected() ) {
			// existing but "new"
			objectPot.getRecordIdPix(potId,true)
			.then( doc => objectPotData = new PotNewData( doc, structGeneralPot ) )
			.catch( err => objectLog.err(err) ) ;
		} else {
			objectPotData = new PotNewData( objectPot.create(), structGeneralPot ) ;
		}
    }
}

class PotNewData extends PotDataEditMode {
	constructor( ...args) {
		super(...args);
	}
	
    savePieceData() {
        this.loadDocData(this.struct,this.doc);
        db.put( this.doc )
        .then( (response) => {
            objectPot.select(response.id)
            .then( () => objectPage.show( "PotMenu" ) );
            })
		.then( () => objectThumb.getOne( this.doc._id ) )
        .catch( (err) => objectLog.err(err) )
        ;
    }
}

class PotEdit extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structGeneralPot ))
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

    static show_content(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structProcess ))
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

    static show_content(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structImages ))
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

    static show_content(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
				objectPot.select(potId) // update thumb
				.then( () => objectPot.showPictures(doc) ) ; // pictures on bottom
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

    static show_content(extra="") {
        objectPot.unselect() ;
		new StatBox() ;
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

function URLparse() {
    // need to establish remote db and credentials
    // first try the search field
    const qline = parseURL();
    objectRemote.start( qline ) ;
    
    // first try the search field
    if ( qline && ( "potId" in qline ) ) {
        objectPot.select( qline.potId )
        .then( () => objectPage.add("PotMenu") );
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
            if ( change?.deleted ) {
                objectThumb.remove( change.id ) ;
            } else {
                objectThumb.getOne( change.id ) ;
            }
            // update screen display
            if ( objectPage.isThis("AllPieces") ) {
                objectPage.show("AllPieces");
            }
            })
        .catch( err => objectLog.err(err,"Initial search database") );

        // start sync with remote database
        objectRemote.foreverSync();

        // now jump to proper page
        objectPage.show( null ) ;

        // Set piece -- need page shown first
        if ( objectPot.isSelected() ) { // mission too
            objectPot.select() ;
        }

    } else {
        db = null;
        objectPage.reset();
        objectPage.show("FirstTime");
    }
};

