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
    ImageDrop,
    ImageImbedded,
    ImageNote,
    ImageQuick,
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
    PotData,
    PotDataEditMode,
    PotDataRaw,
    } from "./patientdata_mod.js" ;

import {
    } from "./log_mod.js" ;

import {
    SimplePatient,
    SimplePot,
    SimpleNote,
    } from "./simple_mod.js" ;
    
import {
    } from "./replicate_mod.js" ;

// other globals
const NoPhoto = "style/NoPhoto.png";

// used to generate data entry pages "PotData" type
const structTest = [
	{
		name:  "type",
		alias: "Type of piece",
		hint:  "What will the piece be used for?",
		type:  "text",
	},
];
const structNewPot = [
	{
		name:  "type",
		alias: "Type of piece",
		hint:  "What will the piece be used for?",
		type:  "list",
		salt:  ["bowl","plate","flowerpot"],
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
    
const structDemographics = [
    {
        name: "Photo",
        hint: "PatientPhoto",
        type: "image",
        none: NoPhoto,
    },
    {
        name: "LastName",
        hint: "Late name of patient",
        type: "text",
    },
    {
        name: "FirstName",
        hint: "First name of patient",
        type: "text",
    },
    {
        name: "DOB",
        hint: "Date of Birth",
        type: "date",
    },
    {
        name: "email",
        hint: "email address",
        type: "email",
    },
    {
        name: "phone",
        hint: "Contact phone number",
        type: "tel",
    },
    {
        name: "Address",
        hint: "Patient home address",
        type: "textarea",
    },
    {
        name: "Contact",
        hint: "Additional contact information (family member, local address,...)",
        type: "textarea",
    },
];

const structMedical = [
    {
        name: "Dx",
        hint: "Diagnosis",
        type: "textarea",
    } , 
    {
        name: "Sex",
        hint: "Patient gender",
        type: "radio",
        choices: ["?","M","F","X"],
    },
    {
        name: "Weight",
        hint: "Patient weight (kg)",
        type: "number",
    },
    {
        name: "Height",
        hint: "Patient height (cm?)",
        type: "number",
    },
    {
        name: "ASA",
        hint: "ASA classification",
        type: "radio",
        choices: ["I","II","III","IV"],
    },
    {
        name: "Allergies",
        hint: "Allergies and intolerances",
        type: "textarea",
    },
    {
        name: "Meds",
        hint: "Medicine and antibiotics",
        type: "textarea",
    },
];

const structOperation = [
    {
        name: "Complaint",
        hint: "Main complaint (patient's view of the problem)",
        type: "textarea",
    },
    {
        name: "Procedure",
        hint: "Surgical operation / procedure",
        type: "list",
        query: "byProcedure"
    },
    {
        name: "Surgeon",
        hint: "Surgeon(s) involved",
        type: "list",
        query: "bySurgeon"
    },
    {
        name: "Equipment",
        hint: "Special equipment",
        type: "list",
        query: "byEquipment"
    },
    {
        name: "Status",
        hint: "Status of operation planning",
        type: "radio",
        choices: ["none","unscheduled", "scheduled", "finished", "postponed", "cancelled"],
    },
    {
        name: "Date-Time",
        hint: "Scheduled date",
        type: "datetime",
    },
    {
        name: "Laterality",
        hint: "Is there a sidedness to the case?",
        type: "radio",
        choices: ["?", "L", "R", "L+R", "N/A"],
    },
];

const structMission = [
    {
        name: "Logo",
        hint: "logo for this organization/mission -- ~150x50 pixels",
        type: "image",
        none: "images/DCTOHC11.jpg",
    } , 
    {
        name: "Name",
        hint: "Name of Mission",
        type: "text",
    } , 
    {
        name: "Organization",
        hint: "Mission organization",
        type: "text",
    } , 
    {
        name: "Mission",
        hint: "Mission Name",
        type: "text",
    },
    {
        name: "Link",
        hint: "Web page of organization or mission",
        type: "url",
    } , 
    {
        name: "Location",
        hint: "Where is the mission?",
        type: "text",
    },
    {
        name: "StartDate",
        hint: "First day of mission",
        type: "date",
    },
    {
        name: "EndDate",
        hint: "Last day of mission",
        type: "date",
    },
    {
        name: "LocalContact",
        hint: "Who and how to contact local facility",
        type: "textarea",
    },
    {
        name: "Emergency",
        hint: "Emergency contact",
        type: "textarea",
    },
];

// Create pouchdb indexes.
// Used for links between records and getting list of choices
// change version number to force a new version
function createQueries() {
    let ddoclist = [
    {
        _id: "_design/bySurgeon" ,
        version: 2,
        views: {
            bySurgeon: {
                map: function( doc ) {
                    if ( doc.type=="operation" ) {
                        emit( doc.Surgeon );
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
        _id: "_design/byProcedure" ,
        version: 2,
        views: {
            byProcedure: {
                map: function( doc ) {
                    if ( doc.type=="operation" ) {
                        emit( doc.Procedure );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    }, 
    {
        _id: "_design/Doc2Pid" ,
        version: 0,
        views: {
            Doc2Pid: {
                map: function( doc ) {
                    if ( doc.type=="patient" || doc.type=="mission" ) {
                        emit( doc._id,doc._id );
                    } else {
                        emit( doc._id,doc.patient_id );
                    }
                }.toString(),
            },
        },
    }, 
    {
        _id: "_design/Pid2Name" ,
        version: 2,
        views: {
            Pid2Name: {
                map: function( doc ) {
                    if ( doc.type=="patient" ) {
                        emit( doc._id, [
                            `${doc.FirstName} ${doc.LastName}`,
                            `Patient: <B>${doc.FirstName} ${doc.LastName}</B> DOB: <B>${doc.DOB}</B>`
                            ]);
                    } else if ( doc.type=="mission" ) {
                        emit( doc._id, [
                            `${doc.Organization??""} ${doc.Name??doc._id}`,
                            `Mission: <B>${doc.Organization??""}: ${doc.Name??""}</B> to <B>${doc.Location??"?"}</B> on <B>${[doc.StartDate,doc.EndDate].join("-")}</B>`
                            ]);
                    }
                }.toString(),
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
        this.index={};
        this.fieldlist={
            note: ["text","title",],
            operation: ["Procedure","Complaint","Surgeon","Equipment"],
            patient: ["Dx","LastName","FirstName","email","address","contact","Allergies","Meds",],
            mission: ["Mission","Organization","Link","Location","LocalContact",],
        };
        this.types = Object.keys(this.fieldlist);
        this.types.forEach( ty => this.makeIndex(ty) ) ;
        this.result=[];
        this.select_id = null ;
    }

    makeIndex(type) {
        let fl = this.fieldlist[type] ;
        this.index[type] = elasticlunr( function() {
            this.setRef("_id");
            fl.forEach( f => this.addField(f) ) ;
        }) ;
    }

    addDoc( doc ) {
        if ( doc?.type in this.fieldlist ) {
            this.index[doc.type].addDoc(
                this.fieldlist[doc.type]
                .concat("_id")
                .reduce( (o,k) => {o[k]=doc[k]??"";return o;}, {})
                );
        }
    }

    removeDocById( doc_id ) {
        // we don't have full doc. Could figure type from ID, but easier (and more general) to remove from all.
		this.types.forEach( ty => this.index[ty].removeDocByRef( doc_id ) );
    }

    fill() {
		// adds docs to index
		return db.allDocs( { include_docs: true, } )
		.then( docs => docs.rows.forEach( r => this.addDoc( r.doc ) ));
    }

    search( text="" ) {
        return [].concat( ... this.types.map(ty => this.index[ty].search(text)) );
    }

    resetTable () {
        if ( this.result.length > 0 ) {
            this.reselect_id = null ;
            this.result = [];
            this.setTable();
        }
    } 

    select(id) {
        this.select_id = id;
    }

    toTable() {
        let result = [] ;
        let value = document.getElementById("searchtext").value;

        if ( value.length == 0 ) {
            return this.resetTable();
        }
        
        db.allDocs( { // get docs from search
            include_docs: true,
            keys: this.search(value).map( s => s.ref ),
        })
        .then( docs => { // add _id, Text, Type fields to result
            docs.rows.forEach( (r,i)=> result[i]=({_id:r.id,Type:r.doc.type,Text:r.doc[this.fieldlist[r.doc.type][0]]}) );
            return db.query("Doc2Pid", { keys: docs.rows.map( r=>r.id), } );
            })
        .then( docs => db.query("Pid2Name", {keys: docs.rows.map(r=>r.value),} )) // associated patient Id for each
        .then( docs => docs.rows.forEach( (r,i) => result[i].Name = r.value[0] )) // associate patient name
        .then( () => this.result = result.map( r=>({doc:r}))) // encode as list of doc objects
        .then( ()=>this.setTable()) // fill the table
        .catch(err=> {
            objectLog.err(err);
            this.resetTable();
            });
    }

    setTable() {
        objectTable.fill(this.result);
    }
}

class PotNewData extends PotDataEditMode {
    savePatientData() {
        this.loadDocData();
        
		// create new pot record
		this.doc[0]._id = Id_pot.makeId( this.doc[0] );
		db.put( this.doc[0] )
		.then( (response) => {
			objectPot.select(response.id);
			objectPage.show( "PotMenu" );
			})
		.catch( (err) => objectLog.err(err) );
    }
}

class PotEditData extends PotDataEditMode {
    savePatientData() {
        this.loadDocData();
        
		// edit pot record
		this.doc[0]._id = Id_pot.makeId( this.doc[0] );
		db.put( this.doc[0] )
		.then( (response) => {
			objectPot.select(response.id);
			objectPage.show( "PotMenu" );
			})
		.catch( (err) => objectLog.err(err) );
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

class Patient extends SimplePatient { // convenience class
    del() {
        if ( this.isSelected() ) {        
            let pdoc;
            let ndocs;
            let odocs;
            this.getRecordIdPix(potId)
            .then( (doc) => pdoc = doc ) // patient
            .then( _ => objectNote.getRecordsIdDoc(potId) ) // notes
            .then( (docs) => ndocs = docs.rows ) // get notes
            .then( _ => {
                // Confirm question
                let c = `Delete patient \n   ${pdoc.FirstName} ${pdoc.LastName} DOB: ${pdoc.DOB}\n    `;
                if (ndocs.length == 0 ) {
                    c += "(no associated notes on this patient) \n   ";
                } else {
                    c += `also delete ${ndocs.length} associated notes\n   `;
                }
                c += "Are you sure?";
                if ( confirm(c) ) {
                    return true;
                } else {
                    throw "No delete";
                }           
                })
            .then( _ => Promise.all(ndocs.map( (doc) => db.remove(doc.doc._id,doc.doc._rev) ) ) )
            .then( _ => db.remove(pdoc) )
            .then( _ => this.unselect() )
            .catch( (err) => objectLog.err(err) ) 
            .finally( _ => objectPage.show( "back" ) );
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
        if ( potId != pid ) {
            // change patient -- notes dont apply
            objectNote.unselect();
            objectNoteList.category = 'Uncategorized' ;
        }

        potId = pid ;
		objectCookie.set( "potId", pid );
		// Check patient existence
		db.query("Pid2Name",{key:pid})
		.then( (doc) => {
			// highlight the list row
			if ( objectPage.test('AllPatients') ) {
				objectTable.highlight();
			}
			TitleBox([doc.rows[0].value[1]]);
			})
		.catch( (err) => {
			objectLog.err(err,"patient select");
			this.unselect();
			});
    }

    unselect() {
        potId = null;
        objectCookie.del ( "potId" );
        objectNote.unselect();
        objectNoteList.category = 'Uncategorized' ;
        if ( objectPage.test("AllPatients") ) {
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

    menu( doc, notelist, onum=0 ) {
        let d = document.getElementById("PatientPhotoContent2");
        let inp = new ImageImbedded( d, doc, NoPhoto );

        cloneClass( ".imagetemplate", d );
        inp.display_image();
        this.buttonSub( "nOps", onum );
        NoteLister.categorize(notelist);
        this.buttonSub( "nAll", notelist.rows.length );
        this.buttonCalcSub( "nPreOp",      "Pre Op",     notelist ) ;
        this.buttonCalcSub( "nAnesthesia", "Anesthesia", notelist ) ;
        this.buttonCalcSub( "nOpNote",     "Op Note",    notelist ) ;
        this.buttonCalcSub( "nPostOp",     "Post Op",    notelist ) ;
        this.buttonCalcSub( "nFollowup",   "Followup",   notelist ) ;
    }

    buttonCalcSub( id, cat, notelist ) {
        this.buttonSub( id, notelist.rows.filter( r=>r.doc.category==cat ).length );
    }

    buttonSub( id, num ) {
        let d=document.getElementById(id);
        d.innerText=d.innerText.replace( /\(.*\)/ , `(${num})` );
    }
    
    printCard() {
        objectPage.next("PrintCard"); // fake page
        if ( potId == null ) {
            objectLog.err("No patient to print");
            return objectPage.show( "back" );
        }
        let card = document.getElementById("printCard");
        let t = card.getElementsByTagName("table");
        this.getRecordIdPix(potId,true)
        .then( (doc) => {
            let img = new ImageImbedded( card, doc, NoPhoto ) ;
            img.display_image();
            let link = new URL(window.location.href);
            link.searchParams.append( "potId", potId );
            link.searchParams.append( "database", remoteCouch.database );

            new QR(
                card.querySelector(".qrCard"),
                link.href,
                195,195,
                4);
            // patient parameters
            t[0].rows[0].cells[1].innerText = ""; // name
            t[0].rows[1].cells[1].innerText = ""; // procedure
            t[0].rows[2].cells[1].innerText = ""; // surgeon
            t[0].rows[3].cells[1].innerText = DateMath.age(doc.DOB); 
            t[0].rows[4].cells[1].innerText = doc.Sex??""; 
            t[0].rows[5].cells[1].innerText = doc.Weight+" kg"??"";
            t[0].rows[6].cells[1].innerText = ""; // equipment
            }) 
        .then( _ => db.query("Pid2Name",{key:potId}) )
        .then( (doc) => t[0].rows[0].cells[1].innerText = doc.rows[0].value[0] )
        .then( _ => {
            document.getElementById("printCardButtons").style.display="block";
            objectPage.show_screen( "patient" ); // Also prints
            })
        .catch( (err) => {
            objectLog.err(err);
            objectPage.show( "back" );
            });
    }
    
    ActuallyPrint() {
        Mission.getRecordId()
        .then( doc => printJS({
            printable:"printCard",
            type:"html",
            ignoreElements:["printCardButtons"],
            documentTitle:[doc.Name,doc.Location,doc.Organization].join(" "),
            onPrintDialogClose: ()=>objectPage.show("PotMenu"),
            })
        );
    }
}
class Pot extends SimplePot { // convenience class
	potname( doc ) {
		return (doc?.Name)?doc.Name:`${doc?.type} ${Id_pot.splitId(doc._id).rand}`;
	}
    del() {
        if ( this.isSelected() ) {        
            this.getRecordIdPix(potId)
            .then( (doc) => {
                // Confirm question
                let c = `Delete pot ${this.potname(doc)}?\n`;
                c += "Are you sure?";
                if ( confirm(c) ) {
					return db.remove(pdoc) ;
                } else {
                    throw "No delete";
                }           
                })
            .then( _ => this.unselect() )
            .catch( (err) => objectLog.err(err) ) 
            .finally( _ => objectPage.show( "back" ) );
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
			// highlight the list row
			if ( objectPage.test('AllPieces') ) {
				objectTable.highlight();
			}
			TitleBox([this.potname(doc)]);
			})
		.catch( (err) => {
			objectLog.err(err,"pot select");
			this.unselect();
			});
    }

    unselect() {
        potId = null;
        objectCookie.del ( "potId" );
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

    menu( doc, notelist, onum=0 ) {
        let d = document.getElementById("PatientPhotoContent2");
        let inp = new ImageImbedded( d, doc, NoPhoto );

        cloneClass( ".imagetemplate", d );
        inp.display_image();
        this.buttonSub( "nOps", onum );
        NoteLister.categorize(notelist);
        this.buttonSub( "nAll", notelist.rows.length );
        this.buttonCalcSub( "nPreOp",      "Pre Op",     notelist ) ;
        this.buttonCalcSub( "nAnesthesia", "Anesthesia", notelist ) ;
        this.buttonCalcSub( "nOpNote",     "Op Note",    notelist ) ;
        this.buttonCalcSub( "nPostOp",     "Post Op",    notelist ) ;
        this.buttonCalcSub( "nFollowup",   "Followup",   notelist ) ;
    }

    buttonCalcSub( id, cat, notelist ) {
        this.buttonSub( id, notelist.rows.filter( r=>r.doc.category==cat ).length );
    }

    buttonSub( id, num ) {
        let d=document.getElementById(id);
        d.innerText=d.innerText.replace( /\(.*\)/ , `(${num})` );
    }
    
    printCard() {
        objectPage.next("PrintCard"); // fake page
        if ( potId == null ) {
            objectLog.err("No patient to print");
            return objectPage.show( "back" );
        }
        let card = document.getElementById("printCard");
        let t = card.getElementsByTagName("table");
        this.getRecordIdPix(potId,true)
        .then( (doc) => {
            let img = new ImageImbedded( card, doc, NoPhoto ) ;
            img.display_image();
            let link = new URL(window.location.href);
            link.searchParams.append( "potId", potId );
            link.searchParams.append( "database", remoteCouch.database );

            new QR(
                card.querySelector(".qrCard"),
                link.href,
                195,195,
                4);
            // patient parameters
            t[0].rows[0].cells[1].innerText = ""; // name
            t[0].rows[1].cells[1].innerText = ""; // procedure
            t[0].rows[2].cells[1].innerText = ""; // surgeon
            t[0].rows[3].cells[1].innerText = DateMath.age(doc.DOB); 
            t[0].rows[4].cells[1].innerText = doc.Sex??""; 
            t[0].rows[5].cells[1].innerText = doc.Weight+" kg"??"";
            t[0].rows[6].cells[1].innerText = ""; // equipment
            }) 
        .then( _ => db.query("Pid2Name",{key:potId}) )
        .then( (doc) => t[0].rows[0].cells[1].innerText = doc.rows[0].value[0] )
        .then( _ => {
            document.getElementById("printCardButtons").style.display="block";
            objectPage.show_screen( "patient" ); // Also prints
            })
        .catch( (err) => {
            objectLog.err(err);
            objectPage.show( "back" );
            });
    }
    
    ActuallyPrint() {
        Mission.getRecordId()
        .then( doc => printJS({
            printable:"printCard",
            type:"html",
            ignoreElements:["printCardButtons"],
            documentTitle:[doc.Name,doc.Location,doc.Organization].join(" "),
            onPrintDialogClose: ()=>objectPage.show("PotMenu"),
            })
        );
    }
}
objectPot = new Pot() ;

class Note extends SimpleNote { // convenience class
    select( nid=noteId ) {
        // Check patient existence
        db.get(nid)
        .then( doc => {
            objectCookie.set( "noteId", nid );
            if ( objectPage.test("NoteList") || objectPage.test("NoteListCategory")) {
                objectNoteList.select() ;
            }
            })
        .catch( err => objectLog.err(err,"note select"));
    }

    unselect() {
        objectCookie.del ( "noteId" );
        if ( objectPage.test("NoteList") || objectPage.test("NoteListCategory")) {
            document.getElementById("NoteListContent").querySelectorAll("li")
            .forEach( l => l.classList.remove('choice') );
        }
    }

    create() { // new note, not class
        let d = document.getElementById("NoteNewContent");
        cloneClass ( ".newnotetemplate_edit", d );
        objectPage.forget() ;
        let doc = this.template();
        let img = new ImageNote( d, doc );
        img.edit();
    }

    dropPictureinNote( target ) {
            // Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
        target.addEventListener('dragover', e => {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            });

        // Get file data on drop
        target.addEventListener('drop', e => {
            e.stopPropagation();
            e.preventDefault();
            // Array of files
            Promise.all(
                Array.from(e.dataTransfer.files)
                .filter( file => file.type.match(/image.*/) )
                .map( file => {
                    let reader = new FileReader();
                    reader.onload = e2 =>
                        fetch(e2.target.result)
                        .then( b64 => b64.blob() )
                        .then( blb => {
                            let doc = this.template();
                            new ImageDrop(blb).save(doc);
                            return db.put(doc);
                            });
                    reader.readAsDataURL(file); // start reading the file data.
                    }))
                    .then( () => this.getRecordsId(potId) ) // refresh the list
                    .catch( err => objectLog.err(err,"Photo drop") )
                    .finally( () => {
                        if (objectNoteList.category=='Uncategorized') {
                            objectPage.show( "NoteList" );
                        } else {
                            objectPage.show( "NoteListCategory",objectNoteList.category );
                        }
                        });
            });
    }

    template(category=objectNoteList.category) {
        if ( category=='' ) {
            category = 'Uncategorized' ;
        }
        return {
            _id: Id_note.makeId(),
            text: "",
            title: "",
            author: remoteCouch.username,
            type: "note",
            category: category,
            date: new Date().toISOString(),
        };
    }

    quickPhoto() {
        let inp = document.getElementById("QuickPhotoContent");
        cloneClass( ".imagetemplate_quick", inp );
        let doc = this.template();
        let img = new ImageQuick( inp, doc );
        function handleImage() {
            img.handleImage();
            img.save(doc);
            db.put(doc)
            .then( () => this.getRecordsId(potId) ) // to try to prime the list
            .catch( err => objectLog.err(err) )
            .finally( objectPage.show( null ) );
        }
        img.display_image();
        img.addListen(handleImage);
        img.getImage();
    }
}
objectNote = new Note() ;

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
            // bad entry -- fix by going back
            objectPage.back() ;
            return objectPage.current() ;
        }
    } 
}

class Administration extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        window.location.href="/admin.html" ;
    }
}
class DatabaseInfo extends Administration {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class PrintYourself extends Administration {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class RemoteDatabaseInput extends Administration {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class SendUser extends Administration {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class Help extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        objectPage.show("back");
    }
}

class AllPatients extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectTable = new PotTable();
        let o2pid = {} ; // oplist
        objectPot.getAllIdDoc(true)
        .then( (docs) => {
            docs.rows.forEach( r => Object.assign( r.doc, o2pid[r.id]) );
            objectTable.fill(docs.rows );
            if ( objectPot.isSelected() ) {
                objectPot.select( potId );
            } else {
                objectPot.unselect();
            }
            })
        .catch( (err) => objectLog.err(err) );
    }
}

class AllPieces extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectTable = new PotTable();
        objectPot.getAllIdDoc(true)
        .then( (docs) => {
            objectTable.fill(docs.rows );
            if ( objectPot.isSelected() ) {
                objectPot.select( potId );
            } else {
                objectPot.unselect();
            }
            })
        .catch( (err) => objectLog.err(err) );
    }
}

class Download extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        window.location.href="/download.html" ;
    }
}
class DownloadCSV extends Download {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class DownloadJSON extends Download {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class DownloadPPTX extends Download {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}
class DownloadZIP extends Download {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}

class ErrorLog extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectLog.show() ;
    }
}

class FirstTime extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( db !== null ) {
            objectPage.show("MainMenu");
        }
    }
}

class InvalidPatient extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static safeLanding  = false ; // don't return here

    static subshow(extra="") {
        objectPot.unselect();
    }
}

class MainMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}

class ListMenu extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
}

class NoteListCategory extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectNote.getRecordsIdPix(potId,true)
            .then( notelist => objectNoteList = new NoteLister(notelist,extra) )
            .catch( (err) => {
                objectLog.err(err,`Notelist (${extra})`);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
    }
}

class NoteList extends NoteListCategory {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            super.subshow('Uncategorized');
        } else {
            objectNote.unselect();
            objectPage.show( "back" );
        }
    }
}

class NoteNew extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            // New note only
            objectNote.unselect();
            objectNote.create();
        } else {
            objectPage.show( "back" );
        }
    }
}

class PatientDemographics extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structDemographics ) )
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
    }
}

class PatientMedical extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            let args;
            objectPot.getRecordId()
            .then( (doc) => args = [doc,structMedical] )
            .catch( (err) => {
                objectLog.err(err);
                objectPage.show( "back" );
                });
        } else {
            objectPage.show( "back" );
        }
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

class PotEdit extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.getRecordId(potId,true)
            .then( (doc) => objectPotData = new PotData( doc, structNewPot ) )
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

class PatientPhoto extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        if ( objectPot.isSelected() ) {
            objectPot.select( potId );
            let pdoc;
            let onum ;
            objectPot.getRecordIdPix(potId,true)
            .then( (doc) => pdoc = doc )
            .then( _ => objectNote.getRecordsIdDoc(potId) )
            .then ( (notelist) => objectPot.menu( pdoc, notelist, onum ) )
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
				// add number of pictures to picture button 
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

class QuickPhoto extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block
    static safeLanding  = false ; // don't return here

    static subshow(extra="") {
        objectPage.forget(); // don't return here!
        if ( potId ) { // patient or Mission!
            objectNote.quickPhoto(this.extra);
        } else {
            objectPage.show( "back" );
        }
    }
}

class SearchList extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        objectTable = new SearchTable() ;
        objectSearch.setTable();
    }
}

class SelectPatient extends Pagelist {
    static dummy_var=this.AddPage(); // add the Pagelist.pages -- class initiatialization block

    static subshow(extra="") {
        document.getElementById("headerbox").style.display = "none"; // make less confusing
        document.getElementById("titlebox").style.display = "none"; // make less confusing
        document.getElementById("footerflex").style.display = "none"; // make less confusing
        objectTable = new SelectPatientTable();
        let nnum = {} ;
        objectNote.getAllIdDoc() // Notes
        .then( doclist => doclist.rows
            .forEach( d => {
                let p = d.doc.patient_id;
                if (p in nnum ) {
                    ++ nnum[p];
                } else {
                    nnum[p] = 1 ;
                }
                }))
        .then( _ => objectPot.getAllIdDoc(true) ) // Patients
        .then( (docs) => {
            docs.rows
            .forEach( d => {
                d.doc.Notes = nnum[d.id]??0 ;
            })
            objectTable.fill(docs.rows );
            })
        .catch( (err) => objectLog.err(err) );
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

        if ( this.current() == "SelectPatient" ) {
            this.show("MainMenu");
        }

        // clear display objects
        objectPotData = null;
        objectTable = null;

        // clear old image urls
        ImageImbedded.clearSrc() ;
        ImageImbedded.clearSrc() ;

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

function TitleBox( titlearray=null, show="PotMenu" ) {
    if ( titlearray == null ) {
        document.getElementById( "titlebox" ).innerHTML = "" ;
    } else {
        document.getElementById( "titlebox" ).innerHTML = `<button type="button" onClick='objectPage.show("${show}")'>${titlearray.join(" ")}</button>` ;
    }
}

class PotTable extends SortTable {
    constructor() {
        super( 
            ["Thumbnail", "Name","start_date","series" ], 
            "AllPieces",
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['Name','Name',(doc)=>objectPot.potname(doc)]
            ] 
            );
    }

    selectId() {
        return potId;
    }

    selectFunc(id) {
        objectPot.select(id) ;
    }

    editpage() {
        objectPage.show("PotMenu");
    }
}

class SelectPatientTable extends SortTable {
    constructor() {
        super( 
            ["LastName", "DOB","Notes" ], 
            "SelectPatient",
            [
                ["LastName","Name", (doc)=> `${doc.LastName}, ${doc.FirstName}`],
                ["Notes","Note",null],
            ] 
            );
        this.pid = "";
    }

    selectId() {
        return this.pid;
    }

    selectFunc(id) {
        this.pid = id
    }

    editpage() {
        //objectPage.show("PatientPhoto");
    }
}

class SearchTable extends SortTable {
    constructor() {
        super( 
        ["Name","Type","Text"], 
        "SearchList"
        );
    }

    selectId() {
        return objectSearch.select_id;
    }

    selectFunc(id) {
        objectSearch.select_id = id ;
        objectTable.highlight();
    }
    
    // for search -- go to a result of search
    editpage() {
        let id = objectSearch.select_id;
        if ( id == null ) {
            objectPage.show( null );
        } else {
            db.get( id )
            .then( doc => {
				objectPot.select( id );
				objectPage.show( 'PotMenu' ) ;
            })
            .catch( err => {
                objectLog.err(err);
                objectPage.show(null);
                });
        }
    }
}

class NoteLister {
    constructor( notelist, category="Uncategorized" ) {
        this.category = category;
        if ( category == "" ) {
            this.category = "Uncategorized" ;
        }
        NoteLister.categorize(notelist);

        let parent = document.getElementById("NoteListContent") ;
        parent.innerHTML = "" ;

        // Filter or sort
        if ( this.category !== 'Uncategorized' ) {
            // category selected, must filter
            notelist.rows = notelist.rows.filter( r=>r.doc.category == this.category ) ;
        }

        // Separate rows into groups by year (and "Undated")
        this.year={};
        notelist.rows
        .forEach( r => {
            let y = this.yearTitle(r);
            if ( y in this.year ) {
                this.year[y].rows.push(r);
            } else {
                this.year[y] = { open:false, rows:[r] } ;
            }
        });
        this.yearKeys = Object.keys(this.year).sort() ;
        
        let fieldset = document.getElementById("templates").querySelector(".noteFieldset");
        
        // show notes
        if ( notelist.rows.length == 0 ) {
            parent.appendChild( document.querySelector(".emptynotelist").cloneNode(true) );
        } else {
            this.yearKeys.forEach( y => {
                let fs = fieldset.cloneNode( true ) ;
                fs.querySelector(".yearspan").innerText = y ;
                fs.querySelector(".yearnumber").innerText = `(${this.year[y].rows.length})` ;
                parent.appendChild(fs);
                let ul = document.createElement('ul');
                fs.appendChild(ul);
                this.year[y].rows.forEach( note => {
                    let li1 = this.liLabel(note);
                    ul.appendChild( li1 );
                    let li2 = this.liNote(note,li1);
                    ul.appendChild( li2 );
                    });
                this.close(fs);
                });
        }

        // Highlight (and open fieldset) selected note
        // this includes recently edited or created
        this.select() ;
        
        // if only one year open fieldset
        if ( this.yearKeys.length == 1 ) {
            this.open(parent.querySelector("fieldset"));
        }
        
        
        objectNote.dropPictureinNote( parent );        
    }
    
    open( fs ) {
        fs.querySelector("ul").style.display=""; // show
        fs.querySelector(".triggerbutton").innerHTML="&#10134;";
        fs.querySelector(".triggerbutton").onclick = () => this.close(fs) ;
    }
    
    close( fs ) {
        fs.querySelector("ul").style.display="none"; // show
        fs.querySelector(".triggerbutton").innerHTML="&#10133;";
        fs.querySelector(".triggerbutton").onclick = () => this.open(fs) ;
    }
    
    select() {
        // select noteId in list and highlight (if there)
        document.getElementById("NoteListContent")
        .querySelectorAll("fieldset")
        .forEach( fs => fs.querySelectorAll("li")
            .forEach(li=>{
                if ( li.getAttribute("data-id") == noteId ) {
                    li.classList.add('choice');
                    this.open(fs);
                    li.scrollIntoView();
                } else {
                    li.classList.remove('choice');
                }
                })
            ) ;
    }
    
    static categorize( notelist ) {
        // place categories (if none exist)
        notelist.rows.forEach(r=> r.doc.category = r.doc?.category ?? "Uncategorized" ); 
        notelist.rows.forEach(r=> { if (r.doc.category=='') r.doc.category = "Uncategorized" ; } ); 
    }

    yearTitle(row) {
        return objectNote.dateFromDoc(row.doc).substr(0,4);
    }
        
    fsclick( target ) {
        if ( this.yearKeys.length > 1 ) {
            let ul = target.parentNode.parentNode.querySelector("ul");
            if ( target.value === "show" ) {
                // hide
                target.innerHTML = "&#10133;";
                ul.style.display = "none";
                target.value = "hide";
            } else {
                // show
                target.innerHTML = "&#10134;"; 
                ul.style.display = "";
                target.value = "show";
            }
        }
    }
    
    liLabel( note ) {
        let li = document.createElement("li");
        li.setAttribute("data-id", note.id );

        li.appendChild( document.getElementById("templates").querySelector(".notelabel").cloneNode(true) );

        li.querySelector(".inly").appendChild( document.createTextNode( ` by ${this.noteAuthor(note)}` ));
        li.querySelector(".flatpickr").value = flatpickr.formatDate(new Date(objectNote.dateFromDoc(note.doc)),"Y-m-d h:i K");
        li.addEventListener( 'click', () => objectNote.select( note.id ) );

        return li;
    }

    liNote( note, label ) {
        let li = document.createElement("li");
        li.setAttribute("data-id", note.id );
        let img;
        if ( noteId == note.id ) {
            li.classList.add("choice");
        }
        if ( "doc" in note ) {
            cloneClass( ".notetemplate", li );
            img=new ImageNote(li,note.doc);
            img.display_all();
        }    
        
        let edit_note = () => {
            flatpickr( label.querySelector(".flatpickr"),
                {
                    time_24hr: false,
                    enableTime: true,
                    noCalendar: false,
                    dateFormat: "Y-m-d h:i K",
                    onChange: (d) => note.doc.date=d[0].toISOString(),
                });
            objectNote.select( note.id );
            cloneClass( ".notetemplate_edit", li );
            img.edit();
            } ;
        li.addEventListener( 'click', () => objectNote.select( note.id ) );
        ['dblclick','swiped-right','swiped-left'].forEach( ev =>
            [li, label].forEach( targ => targ.addEventListener( ev, edit_note )));
        label.querySelector(".edit_note").addEventListener( 'click', edit_note );

        return li;
    }

    noteAuthor( doc ) {
        let author = remoteCouch.username;
        if ( doc  && doc.id ) {
            if ( doc.doc && doc.doc.author ) {
                author = doc.doc.author;
            }
        }
        return author;
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

        // Set up text search
        objectSearch = new Search();
        objectSearch.fill()
        .then ( _ =>
            // now start listening for any changes to the database
            db.changes({ since: 'now', live: true, include_docs: true, })
            .on('change', (change) => {
                // update search index
                if ( change?.deleted ) {
                    objectSearch.removeDocById(change.id);
                } else {
                    objectSearch.addDoc(change.doc);
                }
                // update screen display
				if ( objectPage.test("AllPots") ) {
					objectPage.show("AllPots");
				}
                })
            )
        .catch( err => objectLog.err(err,"Initial search database") );

        // start sync with remote database
        objectRemote.foreverSync();

        // Secondary indexes
        createQueries();
        db.viewCleanup()
        .catch( err => objectLog.err(err,"Query cleanup") );

        // now jump to proper page
        objectPage.show( null ) ;

        // Set patient, operation and note -- need page shown first
        if ( objectPot.isSelected() ) { // mission too
            objectPot.select() ;
        }
        if ( noteId ) {
            objectNote.select() ;
        }

    } else {
        db = null;
        objectPage.reset();
        objectPage.show("FirstTime");
    }
};
