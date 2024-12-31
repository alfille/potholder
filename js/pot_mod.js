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
	PotBox,
	BlankBox,
} from "./titlebox.js" ;

import {
    Id_pot,
} from "./id_mod.js" ;

import {
    PotImages,
} from "./image_mod.js" ;

// used to generate data entry pages "PotData" type
import {
	structImages,
} from "./doc_struct.js" ;

class Pot { // convenience class
    constructor() {
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
		this.pictureSource = document.getElementById("HiddenPix");
    }
    
    potname( doc ) {
        return `piece type << ${doc?.type} >> of series << ${doc.series} >>`;
    }

	create() {
        // create new pot record
		return ({
			_id: Id_pot.makeId( this.doc ),
			type:"",
			series:"",
			author: objectDatabase.username,
			artist: objectDatabase.username,
			start_date: (new Date()).toISOString().split("T")[0],
			stage: "greenware",
			kiln: "none",
           });
	}
   
	del() {
		if ( this.isSelected() ) {        
            this.getRecordIdPix(potId)
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n ${this.potname(doc)}\nPress CANCEL to back out`)==true) {
                    return objectDatabase.db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => objectThumb.remove( potId ) )
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

    getRecordIdPix(id=potId, binary=false ) {
        return objectDatabase.db.get( id, { attachments:true, binary:binary } );
    }

    getRecordId(id=potId ) {
        return objectDatabase.db.get( id, { attachments:false} );
    }

    getAllIdDoc(binary=false) {
        const doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: binary,
            binary: binary,
        };
        return objectDatabase.db.allDocs(doc);
    }
        
    getAllIdDocPix() {
        const doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            binary: true,
            attachments: true,
        };
        return objectDatabase.db.allDocs(doc);
    }

    select( pid = potId ) {
		potId = pid ;
        // Check pot existence
        return objectPot.getRecordIdPix(pid)
        .then( (doc) => {
			//console.log("Select",doc);
            // Top left Logo
            objectThumb.displayThumb( this.TL, pid ) ;
            // highlight the list row
            if ( objectPage.isThis('AllPieces') ) {
                objectTable.highlight();
            }
            new PotBox(doc);
            return doc ;
            })
        .catch( (err) => {
            objectLog.err(err,"pot select");
            this.unselect();
            });
    }

    isSelected() {
        return ( potId != null ) ;
    }

    unselect() {
        potId = null;
        this.TL.src = this.LOGO.src;
        if ( objectPage.isThis("AllPieces") ) {
            const pt = document.getElementById("PotTable");
            if ( pt ) {
				pt.rows.forEach( r => r.classList.remove('choice'));
            }
        }
        new BlankBox();
    }

    pushPixButton() {
        this.pictureSource = document.getElementById("HiddenPix");
        this.pictureSource.click() ;
    }

    pushGalleryButton() {
        this.pictureSource=document.getElementById("HiddenGallery");
        this.pictureSource.click() ;
    }

    newPhoto() {
		if ( ! objectPot.isSelected() ) { 
			objectPage.show("AssignPic") ;
			return ;
		}
		if (this.pictureSource.files.length==0 ) {
			return ;
		}
		objectPage.show("PotPixLoading");
		objectPot.getRecordIdPix(potId,true)
		.then( (doc) => {
			// make sure basic structure is there
			if ( !("_attachments" in doc) ) {
				doc._attachments={} ;
			}
			if ( !("images" in doc) ) {
				doc.images=[] ;
			}
			//console.log("DOC",doc);
			
			// add number of pictures to picture button 
			[...this.pictureSource.files].forEach( f => {
				//console.log("File",f);
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
						date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
						} );
				} else {
					// keep comment and name
					doc.images[idx].date = (f?.lastModifiedDate ?? (new Date())).toISOString() ;
				}
				}) ;
				return objectDatabase.db.put(doc) ;
			})
		.then( () => objectThumb.getOne( potId ) )
		.then( () => objectPage.add( "PotMenu" ) )
		.then( () => objectPage.show("PotPix") )
		.catch( (err) => {
			objectLog.err(err);
			})
		.finally( () => this.pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
		const doc = this.create() ;
		//console.log("new",doc);
		objectDatabase.db.put( doc )
		.then( response => this.AssignPhoto( response.id ) )
		.catch( err => {
			objectLog(err);
			objectPage.show('MainMenu');
		}) ;
	}
		
    
    AssignPhoto(pid = potId) {
        if ( this.pictureSource.files.length == 0 ) {
            return ;
        }
        objectPage.show("PotPixLoading");
        const members = structImages.members ;
		objectPot.select( pid )
		.then ( () => objectPot.getRecordIdPix(pid,true) )
		.then( doc => {
			// make sure basic structure is there
			if ( !("_attachments" in doc) ) {
				doc._attachments={} ;
			}
			if ( !("images" in doc) ) {
				doc.images=[] ;
			}
			
			// add number of pictures to picture button 
			[...this.pictureSource.files].forEach( f => {
				//console.log("File",f);
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
						date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
						} );
				} else {
					// keep comment and name
					doc.images[idx].date = (f?.lastModifiedDate ?? (new Date())).toISOString() ;
				}
				}) ;
				return objectDatabase.db.put(doc) ;
			})
		.then( () => objectThumb.getOne( potId ) )
		.then( () => objectPage.add("PotMenu" ) )
		.then( () => objectPage.show("PotPix") )
		.catch( (err) => {
			objectLog.err(err);
			})
		.finally( () => this.pictureSource.value = "" ) ;
    }
    
	showPictures(doc) {
		// doc alreaady loaded
		const pix = document.getElementById("PotPhotos");
		const images = new PotImages(doc);
		pix.innerHTML="";
		images.displayAll().forEach( i => pix.appendChild(i) ) ;
	}
}

objectPot = new Pot() ;

