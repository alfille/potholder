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
        objectDatabase.db.info()
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
        const doc = {} ;
		["username","password","database","address","local"].forEach( x => doc[x] = objectDatabase[x] ) ;
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
            url = new URL( "/index.html", objectDatabase.address ) ;
            url.port = '';
        }
		["username","password","database","address","local"].forEach( x => url.searchParams.append( x, objectDatabase[x] ) );
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
            .then( (doc) => objectPotData = new PotDataPrint( doc, structGeneralPot.concat(structImages) ) )
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
        if ( objectDatabase.database=="" ) {
            // First time
            super(true,doc,struct); // clicked = true
        } else {
            super(false,doc,struct); // clicked = false
        }
    }

    savePieceData() {
        if ( this.loadDocData(this.struct,this.doc) ) {
            if ( this.doc.raw=="fixed" ) {
                this.doc.address=objectDatabase.SecureURLparse(this.doc.address); // fix up URL
            }
			["username","password","database","address","local"].forEach( x => objectDatabase[x] = this.doc[x] ) ;
			objectDatabase.store() ;
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

class ListGroup extends Pagelist {
	// static "field_name" from struct in derived classes

    static show_content(extra="") {
        objectPot.unselect() ;
        const item = structGeneralPot.find( i => i.name == this.field_name ) ;
        if ( item ) {
			new TextBox(`grouped by ${item?.alias ?? item.name}`) ;
			document.getElementById("MainPhotos").style.display="block";
			switch (item.type) {
				case "radio":
				case "list":
				case "text":
					objectTable = new MultiTable( (doc)=> {
						if ( (item.name in doc) && (doc[item.name]!=="") ) {
							return [doc[item.name] ] ;
						} else {
							return ["unknown"] ;
						}
						});
					break ;
				case "checkbox":
					objectTable = new MultiTable( (doc)=> {
						if ( (item.name in doc) && (doc[item.name].length > 0) ) {
							return doc[item.name] ;
						} else {
							return ["unknown"] ;
						}
						});
					break ;
				case "array":
					objectTable = new MultiTable( (doc)=> {
						if ( (item.name in doc) && (doc[item.name].length>0) ) {
							return doc[item.name].map( t => t.type ) ;
						} else {
							return ["unknown"] ;
						}
						});
					break ;
			}
		} else {
			objectPage.show("ListMenu");
		}
	}
}

class ListSeries extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "series" ;
}

class ListForm extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "type" ;
}

class ListStage extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "stage" ;
}

class ListKiln extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "kiln" ;
}

class ListGlaze extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "glaze" ;
}

class ListClay extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "clay" ;
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
        if ( objectDatabase.db !== null ) {
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
        objectDatabase.db.put( this.doc )
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

class PotPixLoading extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content(extra="") {
		document.querySelector(".ContentTitleHidden").style.display = "block";
		objectPage.forget() ;
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

// Application starting point
window.onload = () => {
    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.pushState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => objectLog.err(err,"Service worker registration") );
    }
    
    // set Credentials from Storage / URL
    objectDatabase.acquire_and_listen() ; // look for database

    if ( new URL(location.href).searchParams.size > 0 ) {
        // reload without search params -- placed in Cookies
        window.location.href = "/index.html" ;
    }

    // Start pouchdb database
    objectDatabase.open() ;       
    if ( objectDatabase.db ) {
        // Thumbnails
        objectThumb = new Thumb() ;

        // Secondary indexes
        createQueries();
        objectDatabase.db.viewCleanup()
        .then( () => objectThumb.getAll() )
        .catch( err => objectLog.err(err,"Query cleanup") );

        // now start listening for any changes to the database
        objectDatabase.db.changes({ 
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
        objectDatabase.foreverSync();

		objectPage.show("MainMenu") ;
		
    } else {
        objectPage.reset();
        objectPage.show("FirstTime");
    }
};

