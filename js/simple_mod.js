/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    SimplePatient,
    } ;
    
import {
    TitleBox,
    } from "./globals_mod.js" ;

import {
    Id,
    Id_patient,
    Id_mission,
    Id_note,
    Id_operation,
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
            startkey: Id_patient.allStart(),
            endkey:   Id_patient.allEnd(),
        };

        return db.allDocs(doc);
    }
        
    getAllIdDoc(binary=false) {
        let doc = {
            startkey: Id_patient.allStart(),
            endkey:   Id_patient.allEnd(),
            include_docs: true,
            attachments: true,
            binary: binary,
        };

        return db.allDocs(doc);
    }
        
    getAllIdDocPix(binary=false) {
        // Note: using base64 here
        let doc = {
            startkey: Id_patient.allStart(),
            endkey:   Id_patient.allEnd(),
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

