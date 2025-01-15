/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

import {
    PotBox,
    BlankBox,
} from "./titlebox.js" ;

import {
    Id_pot,
} from "./id.js" ;

import {
    PotImages,
} from "./image.js" ;

// used to generate data entry pages "PotData" type
import {
    structData,
} from "./doc_struct.js" ;

class Pot { // convenience class
    constructor() {
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
        this.pictureSource = document.getElementById("HiddenPix");
    }
    
    create() {
        // create new pot record
        return ({
            _id: Id_pot.makeId( this.doc ),
            type:"",
            series:"",
            author: globalDatabase.username,
            artist: globalDatabase.username,
            start_date: (new Date()).toISOString().split("T")[0],
            stage: "greenware",
            kiln: "none",
           });
    }
   
    del() {
        if ( this.isSelected() ) {        
            globalDatabase.db.get( potId )
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n piece type << ${doc?.type} >> of series << ${doc.series} >>\nPress CANCEL to back out`)==true) {
                    return globalDatabase.db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => globalThumbs.remove( potId ) )
            .then( _ => this.unselect() )
            .then( _ => globalPage.show( "back" ) )
            .catch( (err) => {
                if (err != "Cancel" ) {
                    globalLog.err(err);
                    globalPage.show( "back" ) ;
                }
            });
        }
    }

    getAllIdDoc() {
        const doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: false,
        };
        return globalDatabase.db.allDocs(doc);
    }
        
    select( pid = potId ) {
        potId = pid ;
        // Check pot existence
        return globalDatabase.db.get( pid )
        .then( (doc) => {
            // Top left Logo
            globalThumbs.displayThumb( this.TL, pid ) ;
            new PotBox(doc);
            return doc ;
            })
        .catch( (err) => {
            globalLog.err(err,"pot select");
            this.unselect();
            });
    }

    isSelected() {
        return ( potId != null ) ;
    }

    unselect() {
        potId = null;
        this.TL.src = this.LOGO.src;
        if ( globalPage.isThis("AllPieces") ) {
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

    save_pic( pid=potId, i_list=[] ) {
        if ( i_list.length == 0 ) {
            return Promise.resolve(true) ;
        }
        const f = i_list.pop() ;
        return globalDatabase.db.get( pid )
        .then( doc => {
            if ( !("images" in doc ) ) {
                doc.images = [] ;
            }
            if ( doc.images.find( e => e.image == f.name ) ) {
                // exists, just update attachment
                return globalDatabase.db.putAttachment( pid, f.name, doc._rev, f, f.type )
                    .catch( err => globalLog(err)) ;
            } else {
                // doesn't exist, add images entry as well (to front)
                doc.images.unshift( {
                    image: f.name,
                    comment: "",
                    date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
                    } );
                return globalDatabase.db.put( doc )
                    .then( r => globalDatabase.db.putAttachment( r.id, f.name, r.rev, f, f.type ) ) ;
            }
            })
        .then( _ => this.save_pic( pid, i_list ) ) ; // recursive
    }
                  

    newPhoto() {
        if ( ! globalPot.isSelected() ) { 
            globalPage.show("AssignPic") ;
            return ;
        }
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        globalPage.show("PotPixLoading");

        this.save_pic( potId, i_list )
        .then( () => globalThumbs.getOne( potId ) )
        .then( () => globalPage.add( "PotMenu" ) )
        .then( () => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
        const doc = this.create() ;
        //console.log("new",doc);
        globalDatabase.db.put( doc )
        .then( response => this.AssignPhoto( response.id ) )
        .catch( err => {
            globalLog(err);
            globalPage.show('MainMenu');
        }) ;
    }
            
    AssignPhoto(pid = potId) {
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        globalPage.show("PotPixLoading");
        globalPot.select( pid )
        .then( _ => this.save_pic( pid, i_list ) )
        .then( _ => globalThumbs.getOne( potId ) )
        .then( _ => globalPage.add("PotMenu" ) )
        .then( _ => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
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

globalPot = new Pot() ;

