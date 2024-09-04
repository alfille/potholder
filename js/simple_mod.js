/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    SimplePot,
    } ;
    
import {
    TitleBox,
    } from "./globals_mod.js" ;

import {
    Id,
    Id_pot,
    } from "./id_mod.js" ;

class SimplePot { // convenience class
    getRecordId(id=potId ) {
        return db.get( id );
    }

    getRecordIdPix(id=potId, binary=false ) {
        return db.get( id, { attachments:true, binary:binary } );
    }

    getAllId() {
        let doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
        };

        return db.allDocs(doc);
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
        
    getAllIdDocPix(binary=false) {
        // Note: using base64 here
        let doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            binary: binary,
            attachments: true,
        };

        return db.allDocs(doc);
    }

    select( pid = potId ) {
        potId = pid ;
		Cookie.set( "potId", pid );
		this.getRecordIdPix( pid )
		.then( (doc) => {
			// highlight the list row
			TitleBox([doc.rows[0].value[1]]) ;
			})
		.catch( (err) => {
			objectLog.err(err,"patient select");
			});
	}

    isSelected() {
        return ( potId != null ) ;
    }
}

