/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
"use strict";

/* jshint esversion: 11 */

export {
    PotData,
    PotDataEditMode,
    PotDataRaw,
} ;

import {
    PotImages,
} from "./image_mod.js" ;
    
import {
    EntryList,
} from "./field_mod.js" ;
    
// data entry page type
class PotDataRaw { // singleton class
    constructor(click,doc,struct) {
        //console.log("DOC",doc);
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);
        
        this.doc = doc;
        
        // Add dummy entries for extra images
        this.match_image_list() ;

        // Create (recursively) objects to mirror the structure
        this.list = new EntryList( struct, this.Images ) ;
        
        // Load the objects with doc data 
        this.list.load_from_doc( doc ) ;

        // jump to edit mode?
        if ( click ) {
            this.edit_doc() ;
        } else {
            this.list.show_doc() ;
        }
    }

    edit_doc() {
        this.list.edit_doc();
        document.querySelectorAll(".savedata").forEach( s => s.disabled = true ) ;
    }
    
    loadDocData() {
        this.list.form2value() ; // make sure data is loaded
        if ( this.list.changed() ) {
            const doc = this.list.get_doc() ;
            //console.log("Gathered DOC",doc);
            Object.assign( this.doc, doc ) ;
            //console.log("Final DOC",this.doc);
            return true ;
        }
        return false ;
    }

    saveChanged ( state ) {
        const deleted_images = this.list.get_deletes() ;

        const data_change = this.loadDocData() ; // also sets this.doc
        if ( data_change ) {
            // doc is changed
            objectDatabase.db.put( this.doc )
            .then( r => new Detachment( r.id, r.rev ) )
            .then( D => D.remove( deleted_images) )
            .then( _ => objectThumb.getOne( this.doc._id ) )
            .catch( (err) => objectLog.err(err) )
            .finally( () => objectPage.show( state ) );
        } else {
            objectPage.show( state ) ;
        }
    }
    
    savePieceData() {
        //console.log( "Deleted pictures", this.list.get_deletes().join(", ") )
        this.saveChanged( "PotMenu" );
    }
    
    back() {
        if ( this.list.changed() ) {
            if ( confirm("WARNING: Unsaved changes.\nPress OK to discard your new data.\nPress CANCEL to NOT DISCARD yet.") ) {
                objectPage.show("back");
            } else {
                document.querySelectorAll(".savedata").forEach(s=>s.disabled = false);
            }
        } else {
            objectPage.show("back");
        }
    }    

    match_image_list() {
        // makes changes to this.doc, but doesn't store until later save (if needed)
        
        // attachments
        const a_list = [] ;
        // Add dummy entries for extra images
        if ( "_attachments" in this.doc ) {
            Object.keys(this.doc._attachments).forEach( a => a_list.push(a) );
        }
        
        // image entries
        const i_list = [] ;
        if ( "images" in this.doc ) {
            this.doc.images.forEach( i => i_list.push(i.image) ) ;
        }
        
        // image entry for each attachment
        a_list
            .filter( a => ! i_list.includes(a) )
            .forEach( a=> this.doc.images
                .push( {
                    image: a,
                    comment: "<Restored>",
                    date: new Date().toISOString()
                    })
                );

        // remove references to non-existent images
        i_list
            .filter( i => ! a_list.includes(i) )
            .forEach( i => delete this.doc.images[i] ) ;
    }
}

class PotData extends PotDataRaw {
    constructor(doc,struct) {
        super(false,doc,struct); // clicked = false
    }
}

class PotDataEditMode extends PotDataRaw {
    // starts with "EDIT" clicked
    constructor(doc,struct) {
        super(true,doc,struct); // clicked = true
    }
}

class Detachment {
    constructor( pid, rev ) {
        this.pid = pid ;
        this.rev = rev ;
    }

    remove( i_list ) {
        if ( i_list && i_list.length>0 ) {
            const name = i_list.pop() ;
            return objectDatabase.db.removeAttachment( this.pid, name, this.rev )
                .then( r => {
                    this.rev = r.rev ;
                    return this.remove( i_list ) ;
                    })
                .catch( err => console.log("remove error") );
        } else {
            return Promise.resolve(true) ;
        }
    }
}
