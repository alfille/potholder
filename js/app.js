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
    PotImages,
    Thumb,
    } from "./image_mod.js" ;

import {
    Id,
    Id_pot,
    } from "./id_mod.js";

import {
    } from "./cookie_mod.js" ;

import {
    SortTable,
    ThumbTable,
    PotTable,
    MultiTable,
    SearchTable,
    } from "./sorttable_mod.js" ;

import {
    PotData,
    PotDataEditMode,
    PotDataRaw,
    } from "./patientdata_mod.js" ;

import {
    } from "./log_mod.js" ;

import {
    SimplePot,
    } from "./simple_mod.js" ;
    
import {
    } from "./replicate_mod.js" ;

// used to generate data entry pages "PotData" type
const structRemoteUser = [
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

const structNewPot = [
    {
        name:  "type",
        alias: "Type of piece",
        hint:  "What will the piece be used for?",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "series",
        alias: "Series",    
        hint:  "Which creative wave?",
        type:  "list",
        query: "qSeries",
    },
    {
        name:  "Name",
        hint:  "Name of piece (optional)",
        type:  "text",
    },
    {
        name:  "start_date",
        alias: "Start date",
        type:  "date",
        hint:  "Date work started",
    },
    {
        name:  "artist",
        alias: "Artist",
        hint:  "Creator of this piece",
        type:  "list",
        query: "qArtist",
    },
    {
        name:  "general_comment",
        alias: "General comments",
        hint:  "Overall comments on piece",
        type:  "textarea",
    },
];
    
const structGeneralPot = [
    {
        name:  "type",
        alias: "Type of piece",
        hint:  "What will the piece be used for?",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "series",
        alias: "Series",    
        hint:  "Which creative wave?",
        type:  "list",
        query: "qSeries",
    },
    {
        name:  "Name",
        hint:  "Name of piece (optional)",
        type:  "text",
    },
    {
        name: "location",
        hint: "Current location",
        type: "list",
        query: "qLocation",
    },
    {
        name:  "start_date",
        alias: "Start date",
        type:  "date",
        hint:  "Date work started",
    },
    {
        name:  "artist",
        alias: "Artist",
        hint:  "Creator of this piece",
        type:  "list",
        query: "qArtist",
    },
    {
        name:  "general_comment",
        alias: "General comments",
        hint:  "Overall comments on piece",
        type:  "textarea",
    },
];

const structImages = [
    {
        name:  "images",
        alias: "Images",
        type:  "image_array",
        members: [
            {
                name:  "image",
                type:  "image",
            },
            {
                name:  "comment",
                alias: "Notes",
                hint:  "Notes about this photo",
                type:  "textarea",
            },
            {
                name:  "date",
                type:  "date",
                alias: "Date",
                hint:  "Date photo was taken",
            }
        ]
    }
];
        
const structProcess = [
    {
        name:  "firing",
        alias: "Firing",
        hint:  "Type of firing",
        type:  "radio",
        choices: ["greenware","bisque","oxidation","reduction","soda","raku","garbage","salt"],
    },
    {
        name:  "type",
        alias: "Type of piece",
        hint:  "What will the piece be used for?",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "construction",
        hint:  "techniques",
        type:  "checkbox",
        choices: ["wheel","slab","handbuilt","coil","pinch"],
    },
    {
        name:  "clay",
        alias: "Clays",
        type:  "array",
        members: [
            {
                name:  "type",
                alias: "Clay body",
                hint:  "Which clay type used?",
                type:  "list",
                query: "qClay",
            },
            {
                name:  "comment",
                hint:  "Clay comments",
                type:  "textarea",
            }
        ],
    },
    {
        name:  "glaze",
        alias: "Glazes",
        type:  "array",
        members: [
            {
                name:  "type",
                alias: "Glaze",
                type:  "list",
                query: "qGlaze",
            },
            {
                name:  "comment",
                alias: "Notes",
                type:  "textarea",
            }
        ],
    },
    {
        name: "kilns",
        type: "array",
        members: [
            {
                name: "kiln",
                hint: "Which kiln used?",
                type: "list",
                query: "qKiln",
            },
            {
                name: "cone",
                hint: "firing cone",
                type: "list",
                query: "qCone",
            },
            {
                name: "date",
                hint: "firing date",
                type: "date",
            },
            {
                name: "comment",
                hint: "Comments on firing",
                type: "textarea",
            },
        ],
    },
];

// Create pouchdb indexes.
// Used for links between records and getting list of choices
// change version number to force a new version
function createQueries() {
    let ddoclist = [
    {
        _id: "_design/qGlaze",
        version: 1,
        views: {
            qGlaze: {
                map: function (doc) {
                    if ("glaze" in doc) {
                        doc.glaze.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qClay",
        version: 1,
        views: {
            qClay: {
                map: function (doc) {
                    if ("clay" in doc) {
                        doc.clay.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qGlaze",
        version: 1,
        views: {
            qGlaze: {
                map: function (doc) {
                    if ("glaze" in doc) {
                        doc.glaze.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qKiln",
        version: 1,
        views: {
            qKiln: {
                map: function (doc) {
                    if ("kilns" in doc) {
                        doc.kilns.forEach( g => {
                            if ( "kiln" in g ) {
                                emit( g.kiln ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qCone",
        version: 1,
        views: {
            qCone: {
                map: function (doc) {
                    if ("kilns" in doc) {
                        doc.kilns.forEach( g => {
                            if ( "cone" in g ) {
                                emit( g.cone ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qProcess",
        version: 1,
        views: {
            qProcess: {
                map: function (doc) {
                    if ("process" in doc) {
                        doc.process.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        })
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qType" ,
        version: 1,
        views: {
            qType: {
                map: function( doc ) {
                    if ( "type" in doc ) {
                        emit( doc.type );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qSeries" ,
        version: 2,
        views: {
            qSeries: {
                map: function( doc ) {
                    if ( "series" in doc ) {
                        emit( doc.series );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qArtist" ,
        version: 2,
        views: {
            qArtist: {
                map: function( doc ) {
                    if ( "artist" in doc ) {
                        emit( doc.artist );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qLocation" ,
        version: 2,
        views: {
            qLocation: {
                map: function( doc ) {
                    if ( "location" in doc ) {
                        emit( doc.location );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    ];
    Promise.all( ddoclist.map( (ddoc) => {
        db.get( ddoc._id )
        .then( doc => {
            if ( ddoc.version !== doc.version ) {
                ddoc._rev = doc._rev;
                return db.put( ddoc );
            } else {
                return Promise.resolve(true);
            }
            })
        .catch( () => {
            // assume because this is first time and cannot "get"
            return db.put( ddoc );
            });
        }))
    .catch( (err) => objectLog.err(err) );
}

class Search { // singleton class
    constructor() {
        this.select_id = null ;

        this.field_alias={} ;
        this.field_link={} ;
		this.fields = [] ;

        this.structStructure= ({
			PotEdit:    structGeneralPot,
			PotPix:     structImages,
			PotProcess: structProcess,
			});

        // Extract fields fields
        Object.entries(this.structStructure).forEach( ([k,v]) =>
			this.structFields(v)
			.forEach( fn => {
				this.field_link[fn]=k ;
				this.fields.push(fn);
				})
			);
        console.log(this.field_link);
        console.log(this.fields);
    }

    resetTable () {
        this.setTable([]);
    } 

    select(id) {
        this.select_id = id;
    }

    toTable() {
        let needle = document.getElementById("searchtext").value;

        if ( needle.length == 0 ) {
            return this.resetTable();
        }
        db.search(
			{ 
				query: needle,
				fields: this.fields,
				highlighting: true,
				mm: "80%",
			})
		.then( x => x.rows.map( r =>
			Object.entries(r.highlighting)
			.map( ([k,v]) => ({
					_id:r.id,
					Field:this.field_alias[k],
					Text:v,
					Link:this.field_link[k],
				})
				)) 
			)
		.then( res => res.flat() )
        .then( res => res.map( r=>({doc:r}))) // encode as list of doc objects
        .then( res=>this.setTable(res)) // fill the table
        .catch(err=> {
            objectLog.err(err);
            this.resetTable();
            });
    }

    setTable(docs=[]) {
        objectTable.fill(docs);
    }

	structParse( struct ) {
		return struct
		.filter( e=>!(['date','image'].includes(e.type)))
		.map(e=>{
			const name=e.name;
			const alias=e?.alias??name;
			if ( ['array','image_array'].includes(e.type) ) {
				return this.structParse(e.members)
				.map(o=>({name:[name,o.name].join("."),alias:[alias,o.alias].join(".")})) ;
			} else {
				return ({name:name,alias:alias});
			}
			})
		.flat();
	}
	
	structFields( struct ) {
		const sP = this.structParse( struct ) ;
		sP.forEach( o => this.field_alias[o.name]=o.alias );
		return sP.map( o => o.name ) ;
	}
}

class DateMath { // convenience class
    static prettyInterval(msec) {
        let hours = msec / 1000 / 60 / 60;
        if ( hours < 24 ) {
            return `${hours.toFixed(1)} hours`;
        }
        let days = hours / 24 ;
        if ( days < 14 ) {
            return `${days.toFixed(1)} days`;
        }
        let weeks = days / 7;
        if ( weeks < 8 ) {
            return `${weeks.toFixed(1)} weeks`;
        }
        let months = days / 30.5;
        if ( months < 13 ) {
            return `${months.toFixed(1)} months`;
        }
        let years = days / 365.25;
        return `${years.toFixed(1)} years`;
    }

    static age( dob, current=null ) {
        let birthday = flatpickr.parseDate( dob, "Y-m-d") ;
        let ref = Date.now();
        if ( current ) {
            ref = flatpickr.parseDate( current, "Y-m-d") ;
        }
        return DateMath.prettyInterval( ref - birthday );
    }
}

class Pot extends SimplePot { // convenience class
    constructor() {
        super() ;
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
    }
    
    potname( doc ) {
        return (doc?.Name)?doc.Name:`${doc?.type} ${Id_pot.splitId(doc._id).rand}`;
    }
    
    del() {
        if ( this.isSelected() ) {        
            this.getRecordIdPix(potId)
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n ${this.potname(doc)}\nPress CANCEL to back out`)==true) {
                    return db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => this.unselect() )
            .then( _ => objectPage.show( "back" ) )
            .catch( (err) => {
                if (err != "Cancel" ) {
                    objectLog.err(err);
                    objectPage.show( "back" ) ;
                }
            });
        }
    }

    getAllIdDocPix() {
        let doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            binary: true,
            attachments: true,
        };
        return db.allDocs(doc);
    }

    select( pid = potId ) {
        potId = pid ;
        objectCookie.set( "potId", pid );
        // Check pot existence
        objectPot.getRecordIdPix(pid)
        .then( (doc) => {
            // Top left Logo
            objectThumb.display( this.TL, pid ) ;
            // highlight the list row
            if ( objectPage.test('AllPieces') ) {
                objectTable.highlight();
            }
            TitleBox(doc);
            })
        .catch( (err) => {
            objectLog.err(err,"pot select");
            this.unselect();
            });
    }

    unselect() {
        potId = null;
        objectCookie.del ( "potId" );
        this.TL.src = this.LOGO.src;
        if ( objectPage.test("AllPieces") ) {
            let pt = document.getElementById("PotTable");
            if ( pt ) {
                let rows = pt.rows;
                for ( let i = 0; i < rows.length; ++i ) {
                    rows[i].classList.remove('choice');
                }
            }
        }
        TitleBox();
    }

    pushPixButton() {
        document.getElementById("HiddenFile").click() ;
    }

    newPhoto() {
        let inp = document.getElementById("HiddenFile") ;
        if ( inp.files.length == 0 ) {
            return ;
        }
        let members = structImages.members ;
        if ( objectPot.isSelected() ) {
            objectPot.select( potId );
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
                // make sure basic structure is there
                if ( !("_attachments" in doc) ) {
                    doc._attachments={} ;
                }
                if ( !("images" in doc) ) {
                    doc.images=[] ;
                }
                console.log("DOC",doc);
                console.log("INP",inp.files);
                
                // add number of pictures to picture button 
                [...inp.files].forEach( f => {
                    console.log("File",f);
                    // Add to doc
                    doc._attachments[f.name]={
                        data: f,
                        content_type: f.type,
                    } ;
                    const idx = doc.images.findIndex( a => a.image==f.name ) ;
                    if ( idx == -1 ) {
                        // put newest one first
                        doc.images.unshift( {
                            image: f.name,
                            comment: "",
                            date: f.lastModifiedDate.toISOString(),
                            } );
                    } else {
                        // keep comment and name
                        doc.images[idx].date = f.lastModifiedDate.toISOString() ;
                    }
                    })
                    return db.put(doc) ;
                })
            .then( () => objectPot.select( potId ) )
            .then( () => objectPage.show("PotPix") )
            .catch( (err) => {
                objectLog.err(err);
                })
            .finally( () => inp.value = "" ) ;
        }
    }

}

objectPot = new Pot() ;

class Pagelist {
    // list of subclasses = displayed "pages"
    // Note that these classes are never "instantiated -- only used statically
    static pages = {} ; // [pagetitle]->class -- pagetitle is used by HTML to toggle display of "pages"
    // prototype to add to pages
    static AddPage() { Pagelist.pages[this.name]=this; }
    // safeLanding -- safe to resume on this page
    static safeLanding = true ; // default
    
    static show(extra="") {
        // set up specific page display
        document.querySelector(".potDataEdit").style.display="none"; 
        document.querySelectorAll(".topButtons")
            .forEach( tb => tb.style.display = "block" );

        document.querySelectorAll(".pageOverlay")
            .forEach( po => po.style.display = po.classList.contains(this.name) ? "block" : "none" );

        document.getElementById("MainPhotos").style.display="none";
        
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
            // bad entry -- fix by going back
            objectPage.back() ;
            return objectPage.current() ;
        }
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
            objectPotData = new DatabaseInfoData( doc, structDatabaseInfo );
            })
        .catch( err => objectLog.err(err) );
    }
}

class RemoteDatabaseInput extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        const doc = Object.assign({},remoteCouch) ;
        doc.raw = "fixed";
        objectPotData = new DatabaseData( doc, structRemoteUser );
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

    static subshow(extra="") {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        objectPage.show("back");
    }
}

class AllPieces extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new PotTable();
        objectPot.getAllIdDoc(true)
        .then( (docs) => objectTable.fill(docs.rows ) )
        .catch( (err) => objectLog.err(err) );
    }
}

class ListSeries extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Series", (doc)=>[doc?.series??"Unknown"] ) ;
    }
}

class ListFiring extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Firing", (doc)=>[doc?.firing??"Unknown"] ) ;
    }
}

class ListGlaze extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new MultiTable( "by Glaze", (doc)=>{ if ("glaze" in doc) { return doc.glaze.map(x=>x.type); }} ) ;
    }
}

class ListClay extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
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
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class MainMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class ListMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect();
        document.getElementById("MainPhotos").style.display="block";
    }
}

class PotNew extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect();
        objectPotData = new PotNewData(
            {
                author: remoteCouch.username,
                artist: remoteCouch.username,
                start_date: new Date().toISOString(),
            }, structNewPot );
    }
}

class PotNewData extends PotDataEditMode {
    savePieceData() {
        this.loadDocData(this.struct,this.doc);
        
        // create new pot record
        this.doc._id = Id_pot.makeId( this.doc );
        db.put( this.doc )
        .then( (response) => {
            objectPot.select(response.id);
            objectPage.show( "PotMenu" );
            })
        .catch( (err) => objectLog.err(err) );
    }
}

class PotEdit extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structGeneralPot ) )
            .then( _ => console.log("done") )
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
            .then( (doc) => objectPotData = new PotData( doc, structProcess ) )
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
            .then( (doc) => objectPotData = new PotData( doc, structImages ) )
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
            objectPot.select( potId );
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => {
                const pix = document.getElementById("PotPhotos");
                const images = new PotImages(doc);
                pix.innerHTML="";
                //console.log("IMAGES",images);
                //console.log("array",images.displayAll() ) ;
                images.displayAll().forEach( i => pix.appendChild(i) ) ;
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

class SearchList extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectPot.unselect() ;
        document.getElementById("MainPhotos").style.display="block";
        objectTable = new SearchTable() ;
        objectSearch.setTable();
    }
}

class Page { // singleton class
    constructor() {
        // get page history from cookies
        let path = [] ;
        this.lastscreen = null ; // splash/screen/patient for show_screen
        this.path = [];
        // stop at repeat of a page          
        for( const p of path ) {
            if ( this.path.includes(p) ) {
                break ;
            } else {
                this.path.push(p);
            }
        }
    }
    
    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
        objectCookie.set ( "displayState", this.path ) ;
    }

    back() {
        this.path.shift() ;
        if ( this.path.length == 0 ) {
            this.reset();
        }
        if ( Pagelist.subclass(this.path[0]).safeLanding ) {
            objectCookie.set ( "displayState", this.path ) ;
        } else {
            this.back() ;
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
    
    show( page, extra="" ) { // main routine for displaying different "pages" by hiding different elements
        console.log("SHOW",page,"STATE",displayState,this.path);
        // test that database is selected
        if ( db == null || credentialList.some( c => remoteCouch[c]=='' ) ) {
            // can't bypass this! test if database exists
            if ( page != "FirstTime" && page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.next(page) ; // place in reversal list

        // clear display objects
        objectPotData = null;
        objectTable = null;

        this.show_screen( "screen" ); // basic page display setup

        // send to page-specific code
        (Pagelist.subclass(objectPage.current())).show(extra);
    }
    
    show_screen( type ) { // switch between screen and print
        if ( type !== this.lastscreen ) {
            this.lastscreen == type ;
            document.getElementById("splash_screen").style.display = "none";
            let showscreen = {
                ".work_screen": type=="screen",
                ".print_patient": type == "patient",
            };
            for ( let cl in showscreen ) {
                document.querySelectorAll(cl)
                .forEach( (v)=> v.style.display=showscreen[cl]?"block":"none"
                );
            }
        }
    }    
}

function parseQuery() {
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
    const qline = parseQuery();
    objectRemote.start( qline ) ;
    
    // first try the search field
    if ( qline && ( "potId" in qline ) ) {
        objectPot.select( qline.potId );
        objectPage.next("PotMenu");
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
    objectPage = new Page();
    
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

        // Set up text search
        objectSearch = new Search();

        // now start listening for any changes to the database
        db.changes({ since: 'now', live: true, include_docs: true, })
        .on('change', (change) => {
            if ( change?.deleted ) {
                obJectThumb.remove( change.id ) ;
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
