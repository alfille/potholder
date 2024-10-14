/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export class CSV { // convenience class
	constructor() {
		this.columns = [
			"type", "series", "location", "start_date", "artist", "firing", "weight_start","weight_end", "construction", "clay.type", "glaze.type", "kilns.kiln"
			] ;
		this.make_table() ;
	}
	
    download( csv ) {
		const filename = `${remoteCouch.database}_${remoteCouch.username}.csv` ;
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
				} else {
					return "" ;
				}
			case 2:
				if ( com[0] in doc ) {
					return doc[com[0]].map( s => s[com[1]] ).join(", ") ;
				} else {
					return "" ;
				}
		}
	} 

	make_row( row ) {
		return row
		.map( r => (isNaN(r) || (r=="")) ? `"${r}"` : r )
		.join(",");
	}
	
	make_table() {
		objectPot.getAllIdDoc(false)
		.then( docs => docs.rows.map( r => this.make_row( this.columns.map( c => this.get_text( c, r.doc ) ) ) ) )
		.then( data => data.join("\n") )
		.then( data => [this.make_headings(), data].join("\n") )
		.then( csv => this.download( csv ) )
		.catch( err => objectLog.err(err) ) ;
	}
}
