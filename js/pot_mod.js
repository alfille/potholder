/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
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
	structGeneralPot,
	structImages,
	structProcess,
} from "./doc_struct.js" ;

class Pot { // convenience class
    constructor() {
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
    }
    
    potname( doc ) {
        return `piece type << ${doc?.type} >> of series << ${doc.series} >>`;
    }

	create() {
        // create new pot record
        const date = new Date() ;
		return ({
			_id: Id_pot.makeId( this.doc ),
			type:"",
			series:"",
			author: remoteCouch.username,
			artist: remoteCouch.username,
			start_date: [date.getFullYear(),date.getMonth()+1,date.getDate()].join("-"),
           });
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
        return db.get( id, { attachments:true, binary:binary } );
    }

    getRecordId(id=potId ) {
        return db.get( id, { attachments:false} );
    }

    getAllIdDoc(binary=false) {
        let doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: binary,
            binary: binary,
        };
        return db.allDocs(doc);
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
        return objectPot.getRecordIdPix(pid)
        .then( (doc) => {
			//console.log("Select",doc);
            // Top left Logo
            objectThumb.display( this.TL, pid ) ;
            // highlight the list row
            if ( objectPage.test('AllPieces') ) {
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
        new BlankBox();
    }

    pushPixButton() {
        pictureSource = document.getElementById("HiddenPix");
        pictureSource.click() ;
    }

    pushGalleryButton() {
        pictureSource=document.getElementById("HiddenGallery");
        pictureSource.click() ;
    }

    newPhoto() {
		if ( ! objectPot.isSelected() ) { 
			objectPage.show("AssignPic") ;
			return ;
		}
		if (pictureSource.files.length==0 ) {
			return ;
		}
        let members = structImages.members ;
		//objectPot.select( potId ); // seems redundant
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
			[...pictureSource.files].forEach( f => {
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
				})
				return db.put(doc) ;
			})
		.then( () => objectPot.select( potId ) ) // to show new thumbnail
		.then( () => objectPage.show("PotPix") )
		.catch( (err) => {
			objectLog.err(err);
			})
		.finally( () => pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
		const doc = this.create() ;
		db.put( doc )
		.then( response => this.AssignPhoto( response.id ) )
		.catch( err => {
			objectLog(err),
			objectPage.show('MainMenu');
		}) ;
	}
		
    
    AssignPhoto(pid = potId) {
        if ( pictureSource.files.length == 0 ) {
            return ;
        }
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
			[...pictureSource.files].forEach( f => {
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
				})
				return db.put(doc) ;
			})
		.then( () => objectPot.select( potId ) ) // to show new thumbnail
		.then( () => objectThumb.getOne( potId ) )
		.then( () => objectPage.show("PotPix") )
		.catch( (err) => {
			objectLog.err(err);
			})
		.finally( () => pictureSource.value = "" ) ;
    }
    
	showPictures(doc) {
		// doc alreaady loaded
		const pix = document.getElementById("PotPhotos");
		const images = new PotImages(doc);
		pix.innerHTML="";
		//console.log("IMAGES",images);
		//console.log("array",images.displayAll() ) ;
		images.displayAll().forEach( i => pix.appendChild(i) ) ;
	}
}

objectPot = new Pot() ;

