/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    SimplePatient,
    SimpleNote,
    } ;
    
import {
    TitleBox,
    } from "./globals_mod.js" ;

import {
    Id,
    Id_pot,
    Id_note,
    } from "./id_mod.js" ;

class SimplePatient { // convenience class
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
		// Check patient existence
		db.query("Pid2Name",{key:pid})
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

class SimpleNote { // convenience class
    getAllIdDoc() {
        let doc = {
            startkey: Id_note.allStart(),
            endkey:   Id_note.allEnd(),
            include_docs: true,
            binary: false,
            attachments: false,
        };
        return db.allDocs(doc);
    }

    getRecordsId(pid=potId) {
        let doc = {
            startkey: Id_note.patStart(pid),
            endkey: Id_note.patEnd(pid),
        };
        return db.allDocs(doc) ;
    }

    getRecordsIdDoc(pid=potId) {
        let doc = {
            startkey: Id_note.patStart(pid),
            endkey: Id_note.patEnd(pid),
            include_docs: true,
        };
        return db.allDocs(doc) ;
    }

    getRecordsIdPix( pid = potId, binary=false) {
        // Base64 encoding by default (controled by "binary")
        let doc = {
            startkey: Id_note.patStart(pid),
            endkey: Id_note.patEnd(pid),
            include_docs: true,
            binary: binary,
            attachments: true,
        };
        return db.allDocs(doc) ;
    }

    dateFromDoc( doc ) {
        return ((doc["date"] ?? "") + Id_note.splitId(doc._id).key).substring(0,24) ;
    }
}
