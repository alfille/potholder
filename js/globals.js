/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

// globals cookie backed
globalThis. potId = null ;

// singleton class instances
globalThis. globalPage = null ;
globalThis. globalPotData = null ;
globalThis. globalTable = null ;
globalThis. globalDatabase = null ;
globalThis. globalLog = null ;
globalThis. globalPot = null ;
globalThis. globalStorage = null ;
globalThis. globalSearch = null;
globalThis. globalThumbs = null;
globalThis. globalCropper = null ;
globalThis. globalSettings = {} ;

globalThis. rightSize = ( imgW, imgH, limitW, limitH ) => {
    const h = limitW * imgH / imgW ;
    if ( h <= limitH ) {
        return [ limitW, h ] ;
    } else {
        return [ limitH * imgW / imgH, limitH ] ;
    }
} ;

globalThis. cloneClass = ( fromClass, target ) => {
    document.getElementById("templates").
    querySelector(fromClass)
        .childNodes
        .forEach( cc => target.appendChild(cc.cloneNode(true) ) );
} ;

export class CSV { // convenience class
    constructor() {
        this.columns = [
            "type", "series", "location", "start_date", "artist", "firing", "weight_start","weight_end", "construction", "clay.type", "glaze.type", "kilns.kiln"
            ] ;
        this.make_table() ;
    }
    
    download( csv ) {
        const filename = `${globalDatabase.database}_${globalDatabase.username}.csv` ;
        const htype = "text/csv" ;
        //htype the file type i.e. text/csv
        const blub = new Blob([csv], {type: htype});
        const link = document.createElement("a");
        link.download = filename;
        link.href = window.URL.createObjectURL(blub);
        link.style.display = "none";

        document.body.appendChild(link);
        link.click(); // press invisible button
        
        // clean up
        // Add "delay" see: https://www.stefanjudis.com/snippets/how-trigger-file-downloads-with-javascript/
        setTimeout( () => {
            window.URL.revokeObjectURL(link.href) ;
            document.body.removeChild(link) ;
        });
    }

    make_headings() {
        return this.make_row( this.columns.map( c => c.split(".")[0] ) ) ;
    } 

    get_text( combined_field, doc ) {
        const com = combined_field.split(".") ;
        switch (com.length) {
            case 0:
                return "" ;
            case 1:
                if ( com[0] in doc ) {
                    return doc[com[0]] ;
                }
                return "" ;

            case 2:
                if ( com[0] in doc ) {
                    return doc[com[0]].map( s => s[com[1]] ).join(", ") ;
                }
                return "" ;

        }
    } 

    make_row( row ) {
        return row
        .map( r => (isNaN(r) || (r=="")) ? `"${r}"` : r )
        .join(",");
    }
    
    make_table() {
        globalPot.getAllIdDoc()
        .then( docs => docs.rows.map( r => this.make_row( this.columns.map( c => this.get_text( c, r.doc ) ) ) ) )
        .then( data => data.join("\n") )
        .then( data => [this.make_headings(), data].join("\n") )
        .then( csv => this.download( csv ) )
        .catch( err => globalLog.err(err) ) ;
    }
}

globalThis.csv = () => new CSV() ;

class Log{
    constructor() {
        this.list = [];
    }
    
    err( err, title=null ) {
        // generic console.log of error
        const ttl = title ?? globalPage.current() ;
        const msg = err.message ?? err ;
        this.list.push(`${ttl}: ${msg}`);
        if ( globalSettings?.console == "true" ) {
            console.group() ;
            console.log( ttl, msg ) ;
            console.trace();
            console.groupEnd();
        }
        if ( globalPage.current() == "ErrorLog" ) {
            // update
            this.show();
        }
    }
    
    clear() {
        this.list = ["Error log cleared"] ;
        this.show();
    }
    
    show() {
        const cont = document.getElementById("ErrorLogContent") ;
        cont.innerHTML="";
        const ul = document.createElement('ul');
        cont.appendChild(ul);
        this.list
        .forEach( e => {
            const l = document.createElement('li');
            l.innerText=e;
            //l.appendChild( document.createTextNode(e) ) ;
            ul.appendChild(l) ;
        });
    }
}
globalLog = new Log() ;

