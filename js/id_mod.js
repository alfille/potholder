/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    Id,
    Id_pot,
    Id_note,
} ;

class Id {
    static version = 0;
    static start="";
    static end="\\fff0";
    
    static splitId( id ) {
        if ( id ) {
            const spl = id.split(";");
            return {
                version: spl[0] ?? null, // 0 so far
                type:    spl[1] ?? null,
                artist:  spl[2] ?? null,
                date:    spl[3] ?? null,
                rand:    spl[4] ?? null, // really creation date
            };
        }
        return null;
    }
    
    static joinId( obj ) {
        return [
            obj.version,
            obj.type,
            obj.artist,
            obj.date,
            obj.rand
            ].join(";");
    }
    
    static makeIdKey( pid, key=null ) {
        let obj = this.splitId( pid ) ;
        if ( key==null ) {
            obj.date = new Date().toISOString();
            obj.rand = Math.floor( Math.random() * 1000 ) ;
        } else {
            obj.date = key;
        }
        obj.type = this.type;
        return this.joinId( obj );
    }
    
    static makeId( pid=potId ) { // Make a new Id for a note or operation using current time as the last field
        return this.makeIdKey(pid);
    }
    
    static allStart() { // Search entire database
        return [this.version, this.type, this.start].join(";");
    }
    
    static allEnd() { // Search entire database
        return [this.version, this.type, this.end].join(";");
    }

    static patStart( pid=potId ) { // Search just this patient's records
        return this.makeIdKey( pid, this.start ) ;
    }    

    static patEnd( pid=potId ) { // Search just this patient's records
        return this.makeIdKey( pid, this.end ) ;
    }    
}
      
class Id_pot extends Id{
    static type = "p";
    static makeId( doc ) {
        // remove any ';' in the name
        return [
            this.version,
            this.type,
            doc.artist??remoteCouch.username,
            new Date().toISOString(),
            Math.floor( Math.random() * 1000 ),
            ].join(";");
    }
    static splitId( id=potId ) {
        return super.splitId(id);
    }
}

class Id_note extends Id{
    static type = "c";        
    static splitId( id=noteId ) {
        return super.splitId(id);
    }
}
