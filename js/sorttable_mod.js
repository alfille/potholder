/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    PotTable,
    MultiTable,
    SearchTable,
    AssignTable,
} ;

class SortTable {
    constructor( collist, tableId, aliaslist=[] ) {
        this.tbl = document.getElementById(tableId);
        this.tbl.innerHTML = "";
        this.collist = collist;
        
        // alias-list is a list in form (list of lists):
        //[ [fieldname, aliasname, transformfunction],...]
        
        this.aliases={}; // Eventually will have an alias and function for all columns, either default, or specified
        this.collist.forEach( f => this.aliasAdd(f) ) ; // default aliases
        aliaslist.forEach( a => this.aliasAdd(a[0],a[1],a[2]) );

        // Table Head
        const header = this.tbl.createTHead();
        const row = header.insertRow(0);
        row.classList.add('head');
        this.collist.forEach( (f,i) => row.insertCell(i).outerHTML=`<th>${this.aliases[f].name}</th>` );

        // Table Body
        const tbody = document.createElement('tbody');
        this.tbl.appendChild(tbody);

        this.dir = 1;
        this.lastth = -1;
        this.tbl.onclick = this.allClick.bind(this);
    }

    aliasAdd( fieldname, aliasname=null, transformfunction=null ) {
        if ( !(fieldname in this.aliases) ) {
            // Add an entry (currently empty) for this column
            this.aliases[fieldname] = {} ;
        }
        this.aliases[fieldname]["name"] = aliasname ?? fieldname ;
        this.aliases[fieldname]["value"] = ((record)=>{
            try {
                if ( transformfunction==null ) {
                    return record[fieldname];
                } else {
                    return transformfunction(record) ;
                }
            } catch(e) {
				objectLog.err(e) ;
                return "";
            }
            }) ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        //let collist = this.collist;
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.setAttribute("data-id",record._id);
            /* Select and edit -- need to make sure selection is complete*/
            ['click']
            .forEach( (e) => row.addEventListener( e, () => this.selectandedit( record._id ) ) ) ;
            this.collist.forEach( (colname,i) => {
                const c = row.insertCell(i);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
        this.highlight();
    }
    
    selectandedit( id ) {
        this.selectFunc( id );
        this.editpage() ;
    }
  
    allClick(e) {
        if (e.target.tagName == 'TH') {
            return this.sortClick(e);
        }
    }

    resort() {
        if ( this.lastth < 0 ) {
            this.lastth = 0;
            this.dir = 1;
        }
        this.sortGrid(this.lastth);
    }

    sortClick(e) {
        const th = e.target;
        if ( th.cellIndex == this.lastth ) {
            this.dir = -this.dir;
        } else {
            this.dir = 1;
            this.lastth = th.cellIndex;
        }
        // if TH, then sort
        // cellIndex is the number of th:
        //   0 for the first column
        //   1 for the second column, etc
        this.sortGrid(th.cellIndex);
    }

    sortGrid(colNum) {
        const tbody = this.tbl.querySelector('tbody');
        if ( tbody == null ) {
            // empty table
            return;
        }

        const rowsArray = Array.from(tbody.rows);

        let type = "number";
        rowsArray.some( (r) => {
            const c = r.cells[colNum].innerText;
            if ( c == "" ) {
                //empty
            } else if ( isNaN( Number(r.cells[colNum].innerText) ) ) {
                type = "string";
                return true;
            } else {
                return true;
            }
        });

        // compare(a, b) compares two rows, need for sorting
        const dir = this.dir;
        let compare;

        switch (type) {
            case 'number':
                compare = (rowA, rowB) => (rowA.cells[colNum].innerText - rowB.cells[colNum].innerText) * dir;
                break;
            case 'string':
                compare = (rowA, rowB) => rowA.cells[colNum].innerText > rowB.cells[colNum].innerText ? dir : -dir;
                break;
        }

        // sort
        rowsArray.sort(compare);

        tbody.append(...rowsArray);
        this.highlight();
    }

    highlight() {
        const Rs = Array.from(this.tbl.rows);
        Rs.forEach( r => r.classList.remove('choice'));
        const id = this.selectId();
        if ( id ) {
            const sr = Rs.filter( r => r.getAttribute('data-id')==id );
            if ( sr.length > 0 ) {
                sr.forEach( r => r.classList.add('choice'));
                sr[0].scrollIntoView();
            }
        }
    }
}

class ThumbTable extends SortTable {
    constructor( collist, tableId, aliaslist=[] ) {
        collist.unshift("image");
        super( collist, tableId, aliaslist ) ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.setAttribute("data-id",record._id);
            /* Select and edit -- need to make sure selection is complete*/
            ['click']
            .forEach( (e) => row.addEventListener( e, () => this.selectandedit( record._id ) ) ) ;
            // thumb
            const img = document.createElement("img");
            objectThumb.display( img, record._id ) ;
            row.insertCell(-1).appendChild(img);
            // cells
            this.collist
            .slice(1)
            .forEach( colname => {
                const c = row.insertCell(-1);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
        this.highlight();
    }
    
}

class PotTable extends ThumbTable {
    constructor(
        collist=["type","series","start_date" ],
        tableId="AllPieces",
        aliaslist=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Type',null]
            ] ) {
        super( collist, tableId, aliaslist ) ;
    }

    selectId() {
        return potId;
    }

    selectFunc(id) {
        objectPot.select(id) ;
    }

    editpage() {
        objectPage.show("PotMenu");
    }
}

class MultiTable {
    constructor( cat_func, collist=["type","series","start_date" ], aliaslist=[] ) {
        // cat_func outputs a category array:
        // [] or  [category] or [category1, category2,...]
        // sort_func operates on a doc record

        /* Example:
         *  new MultiTable( "Artist", (doc)=>[doc.artist], "series",document.getElementById("MultiTableContent") );
        */

        // catagories
        this.cat_ob = {} ;

		// parent container
        const parent = document.getElementById("MultiTableContent") ;
        parent.innerHTML="";
        const fieldset = document.getElementById("templates").querySelector(".MultiFieldset");
        
        this.apply_cat( cat_func )
        .then( () => Object.keys(this.cat_ob).forEach( cat => {
			// fieldset holds a sorttable
            const fs = fieldset.cloneNode( true ) ;
            fs.querySelector(".multiCat").innerText = `${cat} (${this.cat_ob[cat].rows.length})` ;

			// setup table
            const tb = fs.querySelector("table");
            tb.id = `MT${cat}` ;
            tb.style.display="";
            parent.appendChild(fs) ;
            const cl = [...collist] ;
            this.cat_ob[cat].table=new PotTable( cl, tb.id ) ;

			// put data in it
            this.cat_ob[cat].table.fill(this.cat_ob[cat].rows)

			// fieldset open/close toggle
            this.cat_ob[cat].visible=true ;
            const plus = fs.querySelector(".triggerbutton") ;
            plus.onclick = () => {
                if ( this.cat_ob[cat].visible ) {
                    plus.innerHTML= "&#10133;" ;
                    tb.style.display = "none" ;
                    this.cat_ob[cat].visible = false ;
                } else {
                    plus.innerHTML= "&#10134;" ;
                    tb.style.display = "" ;
                    this.cat_ob[cat].visible = true ;
                }
            } ;                
        })) ;
    }
    
    // apply the function on all records to get categorized records
    apply_cat( cat_func ) {
        const a2a = [] ;
        return objectPot.getAllIdDoc()
        .then( docs => docs.rows
                        .forEach( r => (cat_func( r.doc )??['unknown'])
                            .forEach( c => a2a.push( [c,r] ))
                             ))
        .then( () => this.arrays2object( a2a ) );
    }
        
	// split into separate records per category
    arrays2object( arrays ) {
        arrays.forEach( ([k,v]) => {
            if ( k in this.cat_ob ) {
                this.cat_ob[k].rows.push(v) ;
            } else {
                this.cat_ob[k]={rows:[v]} ;
            }
        })
    }
}

class AssignTable extends ThumbTable {
    constructor(
        collist=["type","series","start_date" ],
        tableId="AssignPic",
        aliaslist=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Type',null]
            ] ) {
        super( collist, tableId, aliaslist ) ;
    }

    selectId() {
        return potId;
    }

    selectFunc(id) {
        objectPot.select(id) ;
    }

    editpage() {
        objectPot.AssignPhoto();
    }
}


class SearchTable extends ThumbTable {
    constructor() {
        super( 
        ["Field","Text"], 
        "SearchList"
        );
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.setAttribute("data-id",record._id);
            /* Select and edit -- need to make sure selection is complete*/
            ['click']
            .forEach( (e) => row.addEventListener( e, () => this.selectandedit( record._id, record.Link ) ) ) ;
            // thumb
            const img = document.createElement("img");
            objectThumb.display( img, record._id ) ;
            row.insertCell(-1).appendChild(img);
            // cells
            this.collist
            .slice(1)
            .forEach( colname => {
                const c = row.insertCell(-1);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
        this.highlight();
    }

    selectId() {
        return objectSearch.select_id;
    }

    selectFunc(id) {
        objectSearch.select_id = id ;
        objectTable.highlight();
    }
    
    // for search -- go to a result of search
    selectandedit( id, page ) {
		objectPot.select(id)
		.then( () => objectPage.show( page ) ) ;
    }
}
