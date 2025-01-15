/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

import {
    StatBox,
    TextBox,
    ListBox,
} from "./titlebox.js" ;
    
// used to generate data entry pages "PotData" type
import {
    structDatabaseInfo,
    structData,
    structRemoteUser,
    structSettings,
} from "./doc_struct.js" ;

import {
    Query,
} from "./query.js" ;

import {
    PotImages,
} from "./image.js" ;

import {
    PotTable,
    MultiTable,
    SearchTable,
    AssignTable,
    OrphanTable,
} from "./sorttable.js" ;

import {
    PotData,
    PotDataEditMode,
    PotDataRaw,
    PotDataReadonly,
    PotDataPrint,
} from "./doc_data.js" ;

import {
    Pagelist
} from "./page.js" ;

class Advanced extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class Administration extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class Developer extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class StructMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class DatabaseInfo extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalDatabase.db.info()
        .then( doc => {
            globalPotData = new PotDataReadonly( doc, structDatabaseInfo );
            })
        .catch( err => globalLog.err(err) );
    }

}

class RemoteDatabaseInput extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        new TextBox("Your Credentials") ;
        const doc = {} ;
        ["username","password","database","address","local"].forEach( x => doc[x] = globalDatabase[x] ) ;
        doc.raw = "fixed";
        globalPotData = new DatabaseData( doc, structRemoteUser );
    }
}

class Settings extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        new TextBox("Display Settings") ;
        const doc = Object.assign( {}, globalSettings ) ;
        globalPotData = new SettingsData( doc, structSettings );
    }
}

class MakeURL extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        new StatBox() ;
        let url = new URL( "/index.html", window.location.href ) ;
        if ( url.hostname == "localhost" ) {
            url = new URL( "/index.html", globalDatabase.address ) ;
            url.port = '';
        }
        ["username","password","database","address","local"].forEach( x => url.searchParams.append( x, globalDatabase[x] ) );
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

    static show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( potId )
            .then( (doc) => globalPotData = new PotDataPrint( doc, structData.Data.concat(structData.Images) ) )
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });
        } else {
            globalPage.show( "back" );
        }
    }
}

class DatabaseData extends PotDataRaw {
    // starts with "EDIT" clicked
    constructor(doc,struct) {
        if ( globalDatabase.database=="" ) {
            // First time
            super(true,doc,struct); // clicked = true
        } else {
            super(false,doc,struct); // clicked = false
        }
    }

    savePieceData() {
        if ( this.loadDocData() ) {
            if ( this.doc.raw=="fixed" ) {
                this.doc.address=globalDatabase.SecureURLparse(this.doc.address); // fix up URL
            }
            ["username","password","database","address","local"].forEach( x => globalDatabase[x] = this.doc[x] ) ;
            globalDatabase.store() ;
        }
        globalPage.reset();
        location.reload(); // force reload
    }
}

class SettingsData extends PotData {
    savePieceData() {
        this.loadDocData() ;
        Object.assign ( globalSettings, this.doc ) ;
        globalStorage.set( "settings", globalSettings ) ;
		if (globalSettings.fullscreen=="always") {
			document.documentElement.requestFullscreen()
			.finally( _ => globalPage.show("back") ) ;
		} else {
			if ( document.fullscreenElement ) {
				document.exitFullscreen() ;
			}
			globalPage.show("back")
		}
    }
}

class Help extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        globalPage.show("back");
    }
}

class AllPieces extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new PotTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
    }
}

class Orphans extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new OrphanTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
    }
}

class AssignPic extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPage.forget(); // don't return here
        // Title adjusted to source and number
        if ( globalPot.pictureSource.files.length == 0 ) {
            // No pictures taken/chosen
            return ;
        } else if (globalPot.pictureSource.id=="HiddenPix") {
            new TextBox( `New Photo. Assign to which piece?` ) ;
        } else {
            if (globalPot.pictureSource.files.length == 1 ) {
                new TextBox( "1 image selected. Assign to which piece?" ) ;
            } else {
                new TextBox( `${globalPot.pictureSource.files.length} images selected. Assign to which piece?` ) ;
            }
        }
        // make table
        globalTable = new AssignTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
    }
}

class StructShow extends Pagelist {
    // static "struct_name" from derived classes
    // static "struct_title" from derived classes

    static show_content() {
        globalPot.unselect() ;
        new TextBox("Field Structure") ;
        document.getElementById("MainPhotos").style.display="block";
        document.getElementById("StructShowTitle").innerText=this.struct_title ?? "" ;
        document.getElementById("struct_json").innerText = JSON.stringify( this.struct_name, null, 2 ) ;
    }
}

class StructGeneralPot extends StructShow {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static struct_name = structData.Data ;
    static struct_title = "Data Fields";

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class StructImages extends StructShow {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static struct_name = structData.Images ;
    static struct_title = "Image Fields";

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class StructDatabaseInfo extends StructShow {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static struct_name = structDatabaseInfo ;
    static struct_title = "Database Metadata" ;

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class StructRemoteUser extends StructShow {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static struct_name = structRemoteUser ;
    static struct_title = "User Credentials" ;

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class StructSettings extends StructShow {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static struct_name = structSettings ;
    static struct_title = "Display Settings" ;

    static show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

class ListGroup extends Pagelist {
    // static "field_name" from struct in derived classes

    static show_content() {
        globalPot.unselect() ;
        const item = structData.Data.find( i => i.name == this.field_name ) ;
        if ( item ) {
            new ListBox(`grouped by ${item?.alias ?? item.name}`) ;
            document.getElementById("MainPhotos").style.display="block";
            switch (item.type) {
                case "radio":
                case "list":
                case "text":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name]!=="") ) {
                            return [doc[item.name] ] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "checkbox":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length > 0) ) {
                            return doc[item.name] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "array":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length>0) ) {
                            return doc[item.name].map( t => t.type ) ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
            }
        } else {
            globalPage.show("ListMenu");
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

class ListConstruction extends ListGroup {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static field_name = "construction" ;
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

    static show_content() {
        globalPot.unselect() ;
        new TextBox("Error Log");
        globalLog.show() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class FirstTime extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect() ;
        new TextBox("Welcome") ;
        if ( globalDatabase.db !== null ) {
            globalPage.show("MainMenu");
        }
    }
}

class InvalidPiece extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPage.forget() ; // don't return here
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class MainMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class ListMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}

class PotNew extends Pagelist {
    // record doesn't exist -- make one
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPage.forget();
        new TextBox("New Piece");
        if ( globalPot.isSelected() ) {
            // existing but "new"
            globalDatabase.db.get( potId )
            .then( doc => globalPotData = new PotNewData( doc, structData.Data ) )
            .catch( err => globalLog.err(err) ) ;
        } else {
            globalPotData = new PotNewData( globalPot.create(), structData.Data ) ;
        }
    }
}

class PotNewData extends PotDataEditMode {
    constructor( ...args) {
        super(...args);
    }
    
    savePieceData() {
        this.loadDocData();
        globalDatabase.db.put( this.doc )
        .then( (response) => {
            globalPot.select(response.id)
            .then( () => globalPage.show( "PotMenu" ) );
            })
        .then( () => globalThumbs.getOne( this.doc._id ) )
        .catch( (err) => globalLog.err(err) )
        ;
    }
}

class PotEdit extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Data ))
             .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });

        } else {
            globalPage.show( "back" );
        }
    }
}

class PotPix extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });

        } else {
            globalPage.show( "back" );
        }
    }
}

class PotPixLoading extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        document.querySelector(".ContentTitleHidden").style.display = "block";
        globalPage.forget() ;
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });
        } else {
            globalPage.show( "back" );
        }
    }
}

class PotMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( potId )
            .then( (doc) => {
                globalPot.select(potId) // update thumb
                .then( () => globalPot.showPictures(doc) ) ; // pictures on bottom
            })
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                })
                ;
        } else {
            globalPage.show( "back" );
        }
    }
}

class SearchList extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new SearchTable() ;
        globalSearch.setTable();
    }
}

// Application starting point
window.onload = () => {
    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.replaceState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
		new URL('/sw.js', import.meta.url) ;
		/*
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => globalLog.err(err,"Service worker registration") );
        * */
    }

    // Settings
    globalSettings = Object.assign( {
        console:"true",
        img_format:"webp",
        fullscreen: "big_picture",
        }, globalStorage.get("settings") ) ;
    
    // set Credentials from Storage / URL
    globalDatabase.acquire_and_listen() ; // look for database

    if ( new URL(location.href).searchParams.size > 0 ) {
        // reload without search params -- placed in Cookies
        window.location.href = "/index.html" ;
    }

    // Start pouchdb database
    globalDatabase.open() ;       
    if ( globalDatabase.db ) {
        // Thumbnails
        globalThumbs.setup() ; // just getting canvas from doc

        // Secondary indexes (create, prune and clean up views)
        const q = new Query();
        q.create( structData.Data.concat(structData.Images) )
        .then( () => globalThumbs.getAll() ) // create thumbs
        .catch( err => globalLog.err(err,"Query cleanup") )
        ;

        // now start listening for any changes to the database
        globalDatabase.db.changes({ 
            since: 'now', 
            live: true, 
            include_docs: false 
            })
        .on('change', (change) => {
            if ( change?.deleted ) {
                globalThumbs.remove( change.id ) ;
            } else {
                globalThumbs.getOne( change.id ) ;
            }
            // update screen display
            if ( globalPage.isThis("AllPieces") ) {
                globalPage.show("AllPieces");
            }
            })
        .catch( err => globalLog.err(err,"Initial search database") );

        // start sync with remote database
        globalDatabase.foreverSync();

		// Show screen
		((globalSettings.fullscreen=="always") ?
			document.documentElement.requestFullscreen()
			: Promise.resolve())
		.finally( _ => globalPage.show("MainMenu") ) ;
        
    } else {
        globalPage.reset();
        globalPage.show("FirstTime");
    }
};

