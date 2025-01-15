/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

export {
    PotData,
    PotDataReadonly,
    PotDataPrint,
    PotNewData,
    SettingsData,
    DatabaseData,
} ;

import {
    PotImages,
} from "./image.js" ;
    
import {
    EntryList,
} from "./entry_field.js" ;
    
// data entry page type
class PotDataRaw { // singleton class
    constructor(click,doc,struct,readonly=false) {
        //console.log("Click",click,"DOC",doc, "Structure", struct);
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);

        this.doc = doc;
        
        // Add dummy entries for extra images
        this.match_image_list() ;

        // Create (recursively) objects to mirror the structure
        this.list = new EntryList( struct, this.Images, readonly ) ;
        
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
            Object.assign( this.doc, doc ) ;
            return true ;
        }
        return false ;
    }

    saveChanged ( state ) {
        const deleted_images = this.list.get_deletes() ;

        const data_change = this.loadDocData() ; // also sets this.doc
        if ( data_change ) {
            // doc is changed
            globalDatabase.db.put( this.doc )
            .then( r => new Detachment( r.id, r.rev ) )
            .then( D => D.remove( deleted_images) )
            .then( _ => globalThumbs.getOne( this.doc._id ) )
            .catch( (err) => globalLog.err(err) )
            .finally( () => globalPage.show( state ) );
        } else {
            globalPage.show( state ) ;
        }
    }
    
    savePieceData() {
        //console.log( "Deleted pictures", this.list.get_deletes().join(", ") )
        this.saveChanged( "PotMenu" );
    }
    
    back() {
        if ( this.list.changed() ) {
            if ( confirm("WARNING: Unsaved changes.\nPress OK to discard your new data.\nPress CANCEL to NOT DISCARD yet.") ) {
                globalPage.show("back");
            } else {
                document.querySelectorAll(".savedata").forEach(s=>s.disabled = false);
            }
        } else {
            globalPage.show("back");
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

class PotDataReadonly extends PotDataRaw {
    constructor(doc,struct) {
        super(false,doc,struct,true); // clicked = false, readonly=true
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

class Detachment {
    constructor( pid, rev ) {
        this.pid = pid ;
        this.rev = rev ;
    }

    remove( i_list ) {
        if ( i_list && i_list.length>0 ) {
            const name = i_list.pop() ;
            return globalDatabase.db.removeAttachment( this.pid, name, this.rev )
                .then( r => {
                    this.rev = r.rev ;
                    return this.remove( i_list ) ;
                    })
                .catch( err => globalLog(err,"Database") );
        } else {
            return Promise.resolve(true) ;
        }
    }
}

class PotDataPrint { // singleton class
    constructor(doc,struct) {
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);
        
        this.doc = doc;

        // Create (recursively) objects to mirror the structure
        this.list = new EntryList( struct, this.Images ) ;
        
        // Load the objects with doc data 
        this.list.load_from_doc( this.doc ) ;

        this.list.print_doc() ;
        globalPage.show_print();
        setTimeout( this.print, 1000 ) ;
    }

    print() {
            window.print() ;
    } 
    
}
