/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    Pot,
    } ;
    
import {
    TitleBox,
    } from "./globals_mod.js" ;

import {
    Id,
    Id_pot,
    } from "./id_mod.js" ;

class Pot { // convenience class
    constructor() {
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
    }
    
    potname( doc ) {
        return `piece type << ${doc?.type} >> of series << ${doc.series} >>`;
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

    getRecordIdPix(id=potId, binary=false ) {
        return db.get( id, { attachments:true, binary:binary } );
    }

    getAllIdDoc(binary=false) {
        let doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: true,
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


