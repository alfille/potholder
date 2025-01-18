/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

export {
    BlankBox,
    PotBox,
} ;
    
// used to generate data entry pages "PotData" type
import {
    structDatabaseInfo,
    structData,
    structRemoteUser,
    structSettings,
} from "./doc_struct.js" ;

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
    PotDataReadonly,
    SettingsData,
    DatabaseData,
    PotNewData,
    PotDataPrint,
} from "./doc_data.js" ;

class Pagelist {
    // list of subclasses = displayed "pages"
	static pages = {} ;
    
	constructor() {
		Pagelist.pages[this.constructor.name] = this ;
	}

    show_page(name) {
        // reset buttons from edit mode
        document.querySelector(".potDataEdit").style.display="none"; 
        document.querySelectorAll(".topButtons")
            .forEach( tb => tb.style.display = "block" );

        // hide all but current page
        document.querySelectorAll(".pageOverlay")
            .forEach( po => po.style.display = po.classList.contains(name) ? "block" : "none" );

        // hide Thumbnails
        document.getElementById("MainPhotos").style.display="none";
        
        // hide Crop
        document.getElementById("crop_page").style.display="none" ;
        
        this.show_content();
    }
    
    show_content() {
        // default version, derived classes may overrule
        // Simple menu page
    }
}

class PagelistThumblist extends Pagelist {
    show_content() {
        document.getElementById("MainPhotos").style.display="block";
    }
}

new class Advanced extends PagelistThumblist {}() ;

new class Administration extends PagelistThumblist {}() ;

new class Developer extends PagelistThumblist {}() ;

new class StructMenu extends PagelistThumblist {}() ;

new class DatabaseInfo extends Pagelist {
    show_content() {
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalDatabase.db.info()
        .then( doc => {
            globalPotData = new PotDataReadonly( doc, structDatabaseInfo );
            })
        .catch( err => globalLog.err(err) );
    }

}() ;

new class RemoteDatabaseInput extends Pagelist {
    show_content() {
        new TextBox("Your Credentials") ;
        const doc = {} ;
        ["username","password","database","address","local"].forEach( x => doc[x] = globalDatabase[x] ) ;
        doc.raw = "fixed";
        globalPotData = new DatabaseData( doc, structRemoteUser );
    }
}() ;

new class Settings extends Pagelist {
	show_content() {
        new TextBox("Display Settings") ;
        const doc = Object.assign( {}, globalSettings ) ;
        globalPotData = new SettingsData( doc, structSettings );
    }
}() ;

new class MakeURL extends Pagelist {
    show_content() {
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
}() ;

new class PotPrint extends Pagelist {
    show_content() {
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
}() ;

new class Help extends Pagelist {
    show_content() {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        globalPage.show("back");
    }
}() ;

new class AllPieces extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new PotTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
    }
}() ;

new class Orphans extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new OrphanTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
    }
}() ;

new class AssignPic extends Pagelist {
    show_content() {
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
}() ;

class StructShow extends Pagelist {
    // "struct_name" from derived classes
    // "struct_title" from derived classes
    constructor( structname, structtitle ) {
		super() ;
		this.struct_name = structname ;
		this.struct_title = structtitle ;
	}

    show_content() {
        globalPot.unselect() ;
        new TextBox("Field Structure") ;
        document.getElementById("MainPhotos").style.display="block";
        document.getElementById("StructShowTitle").innerText=this.struct_title ?? "" ;
        document.getElementById("struct_json").innerText = JSON.stringify( this.struct_name, null, 2 ) ;
    }
}

new class StructGeneralPot extends StructShow {}( structData.Data, "Data Fields") ;
new class StructImages extends StructShow {}( structData.Images, "Image Fields") ;
new class StructDatabaseInfo extends StructShow {}( structDatabaseInfo, "Database Metadata") ;
new class StructRemoteUser extends StructShow {}( structRemoteUser, "User Credentials") ;
new class StructSettings extends StructShow {}( structSettings, "Display Settings") ;

class ListGroup extends Pagelist {
	constructor( fieldname ) {
		super() ;
		this.field_name = fieldname ;
	}
	
    // "field_name" from struct in derived classes
    show_content() {
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

new class ListSeries extends ListGroup {}("series") ;
new class ListForm extends ListGroup {}("type") ;
new class ListConstruction extends ListGroup {}("construction") ;
new class ListStage extends ListGroup {}("stage") ;
new class ListKiln extends ListGroup {}("kiln") ;
new class ListGlaze extends ListGroup {}("glaze") ;
new class ListClay extends ListGroup {}("clay") ;

new class ErrorLog extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new TextBox("Error Log");
        globalLog.show() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}() ;
new class FirstTime extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new TextBox("Welcome") ;
        if ( globalDatabase.db !== null ) {
            globalPage.show("MainMenu");
        }
    }
}() ;

new class InvalidPiece extends Pagelist {
    show_content() {
        globalPage.forget() ; // don't return here
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}() ;

new class MainMenu extends Pagelist {
    show_content() {
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}() ;

new class ListMenu extends Pagelist {
    show_content() {
        globalPot.unselect();
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
    }
}() ;

new class PotNew extends Pagelist {
    // record doesn't exist -- make one
    show_content() {
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
}() ;

new class PotEdit extends Pagelist {
    show_content() {
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
}() ;

new class PotPix extends Pagelist {
    show_content() {
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
}() ;

new class PotPixLoading extends Pagelist {
    show_content() {
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
}() ;

new class PotMenu extends Pagelist {
    show_content() {
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
}() ;

new class SearchList extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        document.getElementById("MainPhotos").style.display="block";
        globalTable = new SearchTable() ;
        globalSearch.setTable();
    }
}() ;

class Page { // singleton class
    constructor() {
        this.normal_screen = false ; // splash/screen/print for show_screen
        this.path = [];
    }
    
    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
    }

    back() {
        // return to previous page (if any exist)
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

    add( page = null ) {
        if ( page == "back" ) {
            this.back();
        } else if ( page == null ) {
            return ;
        } else {
            const iop = this.path.indexOf( page ) ;
            if ( iop < 0 ) {
                // add to from of page list
                this.path.unshift( page ) ;
            } else {
                // trim page list back to prior occurence of this page (no loops, finite size)
                this.path = this.path.slice( iop ) ;
            }
        }
    }

    isThis( page ) {
        return this.current()==page ;
    }

    forget() {
        // remove this page from the "back" list -- but don't actually go there
        this.back();
    }

    helpLink(help=null) {
        const helpLoc = "https://alfille.github.io/" ;
        const helpDir = "/potholder/" ;
        const helpTopic = help ?? this.current() ;
        window.open( new URL(`${helpDir}${helpTopic}.html`,helpLoc).toString(), '_blank' );
    } 
    
    show( page ) { // main routine for displaying different "pages" by hiding different elements
        if ( globalSettings?.console == "true" ) {
            console.log("SHOW",page,"STATE",this.path);
        }
        // test that database is selected
        if ( globalDatabase.db == null || globalDatabase.database == null ) {
            // can't bypass this! test if database exists
            if ( page != "FirstTime" && page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.add(page) ; // place in reversal list

        // clear display objects
        globalPotData = null;
        globalTable = null;
        document.querySelector(".ContentTitleHidden").style.display = "none";

        this.show_normal(); // basic page display setup

        // send to page-specific code
        const target_name = this.current() ;
        if ( target_name in Pagelist.pages ) {
			Pagelist.pages[target_name].show_page(target_name) ;
		} else {
			this.back() ;
		}
    }
    
    show_normal() { // switch between screen and print
        if ( this.normal_screen ) {
            return ;
        }
        this.normal_screen = true ;
        // Clear Splash once really.
        document.getElementById("splash_screen").style.display = "none";
        
        document.querySelectorAll(".work_screen").forEach( v => v.style.display="block" ) ;
        document.querySelectorAll(".picture_screen").forEach( v => v.style.display="block" ) ;
        document.querySelectorAll(".print_screen").forEach( v => v.style.display="none" ) ;
    }    

    show_print() { // switch between screen and print
        if ( !this.normal_screen ) {
            return ;
        }
        this.normal_screen = false ;
        // Clear Splash once really.
        document.getElementById("splash_screen").style.display = "none";
        
        document.querySelectorAll(".work_screen").forEach( v => v.style.display="none" ) ;
        document.querySelectorAll(".picture_screen").forEach( v => v.style.display="none" ) ;
        document.querySelectorAll(".print_screen").forEach( v => v.style.display="block" ) ;
    }    

    headerLink() {
        if ( globalPage.current() != "MainMenu" ) {
            globalPage.show("MainMenu") ;
        } else {
            if ( globalPage ) {
                globalPage.reset();
            }
            window.location.href="/index.html"; // force reload
        }
    }

    copy_to_clip() {
        navigator.clipboard.writeText( document.getElementById("MakeURLtext").href )
        .catch( err => globalLog.err(err) );
    }
    
}

globalPage = new Page();

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

class TitleBox {
    show(html) {
        //console.log("TITLEBOX",html);
        document.getElementById( "titlebox" ).innerHTML = html ;
    }
}

class BlankBox extends TitleBox {
    constructor() {
        super();
        this.show("") ;
    }
}

class PotBox extends TitleBox {
    constructor( doc ) {
        super();
        this.show(`<button type="button" onClick='globalPage.show("PotMenu")'>${[doc?.type,"from",doc?.series,"by",doc?.artist,doc?.start_date].join(" ")}</button>` ) ;
    }
}

class TextBox extends TitleBox {
    constructor( text ) {
        super();
        this.show( `<B>${text}</B>` ) ;
    }
}

class ListBox extends TitleBox {
    constructor( text ) {
        super();
        this.show( `<B><button type="button" class="allGroup" onclick="globalTable.close_all()">&#10134;</button>&nbsp;&nbsp;<button type="button" class="allGroup" onclick="globalTable.open_all()">&#10133;</button>&nbsp;&nbsp;${text}</B>` ) ;
    }
}

class StatBox extends TitleBox {
    constructor() {
        super();
        globalDatabase.db.query("qPictures", { reduce:true, group: false })
        .then( stat => this.show( `Pieces: ${stat.rows[0].value.count}, Pictures: ${stat.rows[0].value.sum}` ) )
        .catch( err => globalLog.err(err) );
    }
}

class Query {
    static version = 2 ; // change to force renewal (value is arbitrary)
    constructor() {
        this.version = `${Query.version}` ;
    }
    
    create(struct) {
        const queries = this.struct_parse(struct) ; // query entries
        // add image statistics
        queries.push( ({
            _id: "_design/qPictures",
            views: {
                qPictures: {
                    map: function(doc) { 
                        emit( doc._id, ('images' in doc) ? doc.images.length : 0 ); 
                    }.toString(), 
                    reduce: '_stats',
                },
            },
        }) );
        return Promise.all( queries.map( (ddoc) => {
            globalDatabase.db.get( ddoc._id )
            .then( doc => {
                // update if version number has changed
                if ( this.version !== doc.version ) {
                    ddoc._rev = doc._rev;
                    ddoc.version = this.version ;
                    return globalDatabase.db.put( ddoc );
                } else {
                    return Promise.resolve(true);
                }
                })
            .catch( () => {
                // assume because this is first time and cannot "get"
                return globalDatabase.db.put( ddoc );
                });
            }))
        .then( _ => this.prune_queries() )
        .then( _ => globalDatabase.db.viewCleanup() )
        .catch( (err) => globalLog.err(err) );
    }
    
    struct_parse(struct) {
        // create query definision (_design document) by parsing structure and finding:
        // 1. Query strings
        // 2. Query strings buried in an array (members)
        // query gives the name of the search and it is grouped by name
        return struct.map( e => {
            if ( "query" in e ) { // primary query field
                const f = `(doc) => { if ( "${e.name}" in doc ) { emit(doc.${e.name}) ; }}`;
                return ({
                    _id: `_design/${e.query}`,
                    views: {
                        [e.query]: {
                            map: f,
                            reduce: "_count",
                        },
                    },
                }) ;
            } else if ("members" in e) { // query field in array (or ImageArray)
                return e.members.filter( m => "query" in m ).map( m => {
                    const f = `(doc) => { if ( "${e.name}" in doc ){doc.${e.name}.forEach(g=> { if ( "${m.name}" in g ) { emit(g.${m.name}); }});}};`;
                    return ({
                        _id: `_design/${m.query}`,
                        views: {
                            [m.query]: {
                                map: f,
                                reduce: "_count",
                            },
                        },
                    }) ; 
                    }) ;
            } else { // no query -- will filter out
                return null ;
            }}).flat().filter( x => x != null ) ;
    }
    
    prune_queries() {
        // remove old entries (don't match version string)
        return globalDatabase.db.allDocs( {
            startkey: "_design/",
            endkey:   "_design/\uffff",
            include_docs: true,
        } )
        .then( docs => docs.rows.filter( r=> r.doc.version !== this.version ) )
        .then( rows => Promise.all( rows.map( r => globalDatabase.db.remove(r.doc)) ) ) ;
    }
}
