/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    EntryList,
} ;
    
class EntryList {
    constructor( struct_list, Images=null ) {
        this.double_tap = false ;
        //console.log("StructList",Array.isArray(struct_list),struct_list ) ;
        //console.log("StructList Images",Images ) ;
        this.members = struct_list.map( struct => {
            switch (struct.type) {
                case "text":
                    return new TextEntry( struct ) ;
                case "image":
                    return new ImageEntry( struct, Images ) ;
                case "textarea":
                    return new TextAreaEntry( struct ) ;
                case "radio":
                    return new RadioEntry( struct ) ;
                case "checkbox":
                    return new CheckboxEntry( struct ) ;
                case "date":
                    return new DateEntry( struct ) ;
                case "bool":
                    return new BoolEntry( struct ) ;
                case "list":
                    return new ListEntry( struct ) ;
                case "array":
                    return new ArrayEntry( struct, this, Images ) ;
                case "image_array":
                    return new ImageArrayEntry( struct, this, Images ) ;
                case "number":
                    return new NumberEntry( struct ) ;
                case "crop":
                    return new CropEntry( struct );
            }
            }) ;
    }
        
    load_from_doc( doc ) {
        // put doc data in objects
        this.members.forEach( e => e.load_from_doc( doc ) ) ;
    }
        
    form2value() {
        // get data from HTMO fields into "new_val"
        this.members.forEach( e => e.form2value() ) ;
    }
    
    changed() {
        //console.log("CHANGE Entry_list");
        return this.members.some( m => m.changed() ) ;
    }
    
    get_doc() {
        const doc = {} ;
        this.members.forEach( m => {
                const e = m.get_doc() ;
                doc[e[0]] = e[1] ;
                });
        return doc ;
    }
        
    show_doc() {
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        parent.appendChild(this.show_doc_inner()) ;
        cloneClass( ".ExtraEdit", parent ) ;
    }

    show_doc_inner() {
        const ul = document.createElement('ul');

        this.members
            .filter( m => m.struct.type != "image" )
            .forEach( item => {
                const li = document.createElement("li");
                item.show_item().forEach( e => li.appendChild(e)) ;
                ul.appendChild( li );
                });

        ul.onclick = () => {
            // fake double-tap (phones don't have ondblclick)
            if ( this.double_tap ) {
                // second tap
                this.double_tap = false ;
                this.edit_doc() ;
            } else {
                // first tap
                this.double_tap = true ;
                setTimeout( ()=>objectPotData.double_tap = false, 500 ) ;
            }
        } ;
        return ul ;
    }

    choicePromise() {
        // actually, return a promise of the choices
        
        // create the pairs for all "choices" items
        this.members.forEach( m => m.picks = ("choices" in m.struct ) ? m.struct.choices : [] ) ;
            
        // perform the queries for the items with queries and return a aggretate promise
        // can work even if no queries    
        return Promise.all( this.members
            .filter( all_item => "query"   in all_item.struct )
            .map( query_item => objectDatabase.db.query( query_item.struct.query, {group:true,reduce:true} )
            .then( q_result => q_result.rows
                .filter( r=>r.key )
                .filter( r=>r.value>0)
                .forEach(r=>query_item.picks.push(r.key)))
            ));
        }

    print_doc() {
        const parent = document.getElementById("print_space");
        parent.innerHTML = "";
        
        parent.appendChild(this.print_doc_inner()) ;
    }

    print_doc_inner() {
        const ul = document.createElement('ul');
        
        this.members
        .forEach( item => {
            const li = document.createElement("li");
            item.print_item().forEach( e => li.appendChild(e)) ;
            ul.appendChild( li );
            });

        return ul ;
    }

    edit_doc() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="block";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = true;
        });
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        this.edit_doc_inner()
        .then( ul => parent.appendChild(ul) )
        .then( _ => cloneClass( ".ExtraSave", parent )) ;
    }    

    edit_doc_inner() {
        const ul = document.createElement('ul');
        return this.choicePromise( this.struct ).then( _ => {
            this.members.forEach( item => {
                const li = document.createElement("li");
                li.classList.add("MainEditList");
                item.edit_item()
                    .forEach( e => li.appendChild(e)) ;
                ul.appendChild( li );
                });
            return ul ;
        });
    }    
}

class InvisibleEntry {
    // base class for basic (non-visible) entries
    static unique = 0 ;
    // class (s) for data entry items
    constructor( struct ) {
        this.struct = struct ;
        this._name = struct.name ;
        this._alias = struct?.alias ?? this._name ;
        this.localname = `LOCAL_${InvisibleEntry.unique}`;
        InvisibleEntry.unique += 1 ;
    }
    
    changed() {
        // value changed from initial setting
        return this.initial_val != this.new_val ;
    }
    
    default_value() {
        return "" ;
    }
    
    form2value() {
    }
    
    load_from_doc( doc ) {
        this.initial_val = (this._name in doc) ? doc[this._name] : this.default_value() ;
        this.new_val = this.initial_val ;
    }
    
    get_doc() {
        // pair for creating doc of values
        return [this._name, this.new_val] ;
    }
    
    print_item() {
        return this.show_item() ;
    }

    show_item() {
        return [] ;
    }
    
    edit_item() {
        return [] ;
    }
}

class VisibleEntry extends InvisibleEntry {
        default_value() {
            return "" ;
        }
        
        form2value() {
            const local = [...document.getElementsByName(this.localname)] ;
            if ( local.length > 0 ) {
                this.new_val = local[0].value ;
            }
        }
        
        show_label() {
        const span = document.createElement('span');
        span.classList.add('fill_show_label');
        span.innerHTML=`<i>${this._alias}:&nbsp;&nbsp;</i>`;
        span.title=this.struct.hint??"data entry";
        return span ;
        }
                        
    show_item() {
        // Wrap with label and specific display
        const span = document.createElement('span');
        span.classList.add('fill_show_data');
        span.title = this.struct.hint ?? "Enter data";
    
        span.appendChild( this.show_item_element() ) ;
        return [this.show_label(),span];
    }
    
    show_item_element() {
        // default element = straight text
        return document.createTextNode( (this.new_val == "") ? "<empty>" : this.new_val ) ;
    }

    edit_label() {
        // label for edit item
        const lab = document.createElement("label");
    
        // possibly use an alias instead of database field name
        lab.appendChild( document.createTextNode(`${this._alias}: `) );
        lab.title = this.struct.hint;
            
        return lab ;
    }
    
    edit_item() {
        // wraps the label and calls for HTML elements
        return [this.edit_label()].concat( this.edit_flatten().flat() ) ;
    }

    edit_flatten() {
        // returns a list of HTML elements (will be flattened and a label added)
        return [document.createTextNode("Unimplemented")] ;
    }
}

class TextEntry extends VisibleEntry {
    edit_flatten() {
        // get value and make type-specific input field with filled in value
        const inp = document.createElement( "input" );
        inp.title = this.struct.hint;
        inp.name = this.localname ;
        inp.value = this.new_val ;
        inp.oninput = () => this.form2value() ;
        return [ inp ] ;
    }
}
                
class TextAreaEntry extends VisibleEntry {
    edit_flatten() {
        // get value and make type-specific input field with filled in value
        const inp = document.createElement( "textarea" );
        inp.title = this.struct.hint;
        inp.name = this.localname ;
        inp.value = this.new_val ;
        inp.oninput = () => this.form2value() ;
        return [ inp ] ;
    }
}
                
class ImageEntry extends VisibleEntry {
    constructor( struct, Images ) {
        super( struct ) ;
        this.Images = Images ;
        this.img = null ; // for printing -- to check completion
    }
    
    show_item_element() {
        // image or comment
        return this.Images.displayClickable(this.new_val) ;
    }
    
    print_item() {
        this.img = this.Images.print_display( this.new_val ) ;
        return [this.img] ;
    }
            
    edit_item() {
        return [this.Images.displayClickable(this.new_val,"medium_pic") ] ;
    }
}
                
class ListEntry extends VisibleEntry {
    edit_flatten() {
        const dlist = document.createElement("datalist");
        dlist.id = this.localname ;
        this.picks.forEach( pick => 
            dlist.appendChild( new Option(pick) )
            ); 

        const inp = document.createElement("input");
        inp.setAttribute( "list", dlist.id );
        inp.name = this.localname ;
        inp.value = this.new_val;
        inp.oninput = () => this.form2value() ;

        return [dlist,inp] ;
    }
}

class RadioEntry extends VisibleEntry {
    form2value() {
        this.new_val = [...document.getElementsByName(this.localname)]
            .filter( i => i.checked )
            .map(i=>i.value)[0] ?? "" ;
    }

    edit_flatten() {
        return this.picks.map( pick => {
            const inp = document.createElement("input");
            inp.type = "radio";
            inp.name = this.localname;
            inp.value = pick;
            inp.oninput = () => this.form2value() ;
            if ( pick == this.new_val ) {
                inp.checked = true;
            }
            inp.title = this.struct.hint;
            return [inp,document.createTextNode(pick)];
        }) ;
    }
}

class DateEntry extends VisibleEntry {
    default_value() {
        return new Date().toISOString() ;
    }
    
    show_item_element() {
        // default element = straight text
        return document.createTextNode( (this.new_val == "") ? "<empty>" : this.new_val.split("T")[0] ) ;
    }

    edit_flatten() {
        const inp = document.createElement("input");
        inp.type = "date";
        inp.name = this.localname ;
        inp.title = this.struct.hint;
        inp.value = this.new_val.split("T")[0] ;
        inp.oninput = () => this.form2value() ;
        return [inp] ;
    }
}

class CropEntry extends InvisibleEntry {
    default_value() {
        return [] ;
    }
}

class BoolEntry extends VisibleEntry {
        default_value() {
                return "false" ;
        }
        
        show_item_element() {
                return document.createTextNode( (this.new_val=="true") ? "yes" : "no" ) ;
        } 

        form2value() {
                this.new_val = [...document.getElementsByName(this.localname)]
                        .filter( i => i.checked )
                        .map(i=>i.value)[0] ?? "" ;
        }
        
        edit_flatten() {
                return [true,false].map( pick => {
                        const inp = document.createElement("input");
                        inp.type = "radio";
                        inp.name = this.localname;
                        inp.value = pick;
                        inp.oninput = () => this.form2value() ;
                        switch (pick) {
                                case true:
                                        inp.checked = (this.new_val == "true") ;
                                        break ;
                                default:
                                        inp.checked = (this.new_val !== "true") ;
                                        break ;
                        }
                        inp.title = this.struct.hint;
                        return [ inp,document.createTextNode(pick?"yes":"no")];
                        }) ;
        }
}

class CheckboxEntry extends VisibleEntry {
        default_value() {
                return [] ;
        }

        show_item_element() {
                // list as text
                return document.createTextNode( (this.new_val.length == 0) ?  "<empty>" : this.new_val.join(", ") ) ;
        }
        
        form2value() {
                this.new_val = [...document.getElementsByName(this.localname)]
                        .filter( i => i.checked )
                        .map( i => i.value );
        }

        changed() {
                //console.log("Change check", type._name);
                return (this.initial_val.length != this.new_val.length) || this.initial_val.some( (v,i) => v != this.new_val[i] ) ;
        }
         
        edit_flatten() {
                return this.picks.map( pick => {
                        const inp = document.createElement("input");
                        inp.type = "checkbox";
                        inp.name = this.localname;
                        inp.value = pick;
                        inp.oninput = () => this.form2value() ;
                        if ( this.new_val.includes(pick) ) {
                                inp.checked = true;
                        }
                        inp.title = this.struct.hint;
                        return [inp,document.createTextNode(pick)];
                        }); 
        }
}               
                                
class NumberEntry extends VisibleEntry {
        default_value() {
                return null ;
        }

        show_item_element() {
                return document.createTextNode( this.new_val.toString() ?? "<empty>" ) ;
        }
}               

class ArrayEntry extends VisibleEntry {
        constructor( struct, enclosing, Images=null ) {
                super( struct ) ;
                this.initial_val=[] ;
                this.enclosing = enclosing ;
                this.Images = Images ;
        }
        
        changed() {
                //console.log(`Change ${this._name} <${this.initial_val.length}><${this.new_val.length}>`);
                //console.log("Array",this.new_val.length != this.initial_val.length,this.new_val.some( m => m.changed() ));
                return (this.new_val.length != this.initial_val.length) 
                        || this.new_val.some( m => m.changed() ) 
                        || this.new_val.some( (n,i) => n != this.initial_val[i] )
                        ;
        }

        get_doc() {
                return [ this._name, this.new_val.map( e => e.get_doc() ) ] ;
        }

        load_from_doc( doc ) {
                if ( (this._name in doc) && Array.isArray(doc[this._name]) ) {
                        // make an entry for each data array element in doc, of the full members EntryList 
                        this.initial_val = doc[this._name]
                                .map( (e,i) => {
                                        const elist = new EntryList( this.struct.members, this.Images ) ;
                                        elist.load_from_doc( doc[this._name][i] ) ;
                                        return elist ;
                                } ) ;
                } else {
                        this.initial_val = []; 
                }
                this.new_val = [ ...this.initial_val ] ;
        }       

        form2value() {
                // get data from HTML fields into "new_val"
        this.new_val.forEach( e => e.form2value() ) ;
        }
        
        show_item() {
                // show as table with list for each member (which is a set of fields in itself)
        const clone = document.createElement("span"); // dummy span to hold clone
        cloneClass( ".Darray", clone ) ;

        const tab = clone.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} list</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( this.new_val.length > 0 ) {
            this.new_val.forEach( entry => {
                                const td = tab.insertRow(-1).insertCell(0);
                                td.appendChild( entry.show_doc_inner() ) ;
                                });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
        }

        print_item() {
                // show as table with list for each member (which is a set of fields in itself)
        const clone = document.createElement("span"); // dummy span to hold clone
        cloneClass( ".Darray", clone ) ;

        const tab = clone.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} list</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( this.new_val.length > 0 ) {
            this.new_val.forEach( entry => {
                                const td = tab.insertRow(-1).insertCell(0);
                                td.appendChild( entry.print_doc_inner() ) ;
                                });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
        }

        edit_item() {
        // Insert a table, and pull label into caption

        // Heading and buttons
        const clone = document.createElement("span"); // dummy span to hold clone
        cloneClass( ".Darray", clone ) ;

        // table caption
        const tab = clone.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} list</i>`;
        tab.querySelector(".Darray_add").hidden=false;
        tab.querySelector(".Darray_add").onclick=()=>this.edit_array_entry( -1 );
                switch ( this.new_val.length ) {
                        case 0:
                                break ;
                        case 1:
                                tab.querySelector(".Darray_edit").hidden=false;
                                tab.querySelector(".Darray_edit").onclick=()=>this.edit_array_entry( 0 );
                                break ;
                        default:
                                tab.querySelector(".Darray_edit").hidden=false;
                                tab.querySelector(".Darray_edit").onclick=()=>this.select_edit();
                                tab.querySelector(".Darray_rearrange").hidden=false;
                                tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange();
                                break ;
                }

        // table entries
        if ( this.new_val.length > 0 ) {
            this.new_val.forEach( (entry,i) => {
                                const tr = tab.insertRow(-1);
                                tr.onclick = () => this.edit_array_entry( i );
                                
                                const td = tr.insertCell(-1);
                                td.appendChild(entry.show_doc_inner());
                                });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
        }

    fake_page() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        return parent ;
    }               
    
    select_edit( item ) {
        // Insert a table, and pull label into caption
        const parent = this.fake_page() ;
            
        // Heading and buttons
        cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Choose ${this._alias} item</i>`;
        [".Darray_back"].forEach(c=>tab.querySelector(c).hidden=false);
        tab.querySelector(".Darray_back").onclick=()=>this.enclosing.edit_doc();

        // table
        this.new_val.forEach( (entry,i) => {
                        const tr = tab.insertRow(-1);
                        tr.onclick = () => this.edit_array_entry( i );
                        
                        const td = tr.insertCell(-1);
                        td.appendChild(entry.show_doc_inner());
                        });
    }

    edit_array_entry( idx ) {
                const parent = this.fake_page() ;
        const adding = idx==-1 ; // flag for adding rather than editing
        const local_list = adding ? new EntryList( this.struct.members, this.Images ) : this.new_val[idx] ;
        if ( adding ) {
                        // fill in default values
                        local_list.load_from_doc( {} ) ;
                }

                // controls to be added to top
                const control_li = document.createElement('li');
                cloneClass( ".Darray_li", control_li ) ;
                control_li.querySelector("span").innerHTML=`<i>${adding?"Add":"Edit"} ${this._alias} entry</i>`;
                control_li.classList.add("Darray_li1");
                (adding?[".Darray_ok",".Darray_cancel"]:[".Darray_ok",".Darray_cancel",".Darray_delete"]).forEach(c=>control_li.querySelector(c).hidden=false);
                control_li.querySelector(".Darray_ok").onclick=()=>{
                        local_list.form2value() ;
                        if ( adding ) {
                                this.new_val.push( local_list ) ;
                        }
                        this.enclosing.edit_doc() ;
                };
                control_li.querySelector(".Darray_cancel").onclick=()=>this.enclosing.edit_doc();
                control_li.querySelector(".Darray_delete").onclick=()=>{
                        if (confirm(`WARNING -- about to delete this ${this._alias} entry\nPress CANCEL to back out`)==true) {
                                this.new_val.splice(idx,1);
                                this.enclosing.edit_doc();
                        }
                };

        // Insert edit fields and put controls at top
        local_list.edit_doc_inner()
        .then( ul => {
                        ul.insertBefore( control_li, ul.children[0] );
                        parent.appendChild(ul) ;
                }) ;
    }

        swap( i1, i2 ) {
                [this.new_val[i1],this.new_val[i2]] = [this.new_val[i2],this.new_val[i1]] ; 
                this.rearrange() ; // show the rearrange menu again
        }

    rearrange() {
                const parent = this.fake_page() ;

        // Insert a table, and pull label into caption
                
        // Heading and buttons
        cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} rearrange order</i>`;
        [".Darray_ok"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_ok").onclick=()=>this.enclosing.edit_doc();

        // table
        this.new_val.forEach( (entry,i) => {
            const tr = tab.insertRow(-1) ;
            tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Move this entry up"><B>&#8657;</B></button>`;
            tr.insertCell(-1).innerHTML=`<button type="button"  class="Darray_down" title="Move this entry down"><B>&#8659;</B></button>`;
            const td = tr.insertCell(-1);
            td.style.width="100%";
                        td.appendChild(entry.show_doc_inner());
            });
            
        const elements = this.new_val.length ;
        tab.querySelectorAll(".Darray_up"  ).forEach( (b,i)=>b.onclick=()=> this.swap( i, (i+elements-1)%elements ) ) ;
        tab.querySelectorAll(".Darray_down").forEach( (b,i)=>b.onclick=()=> this.swap( i, (i+1)%elements )  );
        }
        
}

class ImageArrayEntry extends ArrayEntry {
    show_image( entry ) {
        const image = entry.members.find( m => m.struct.type == "image" ) ;
        if ( image ) {
            return image.show_item_element() ;
        } else {
            return document.createTextNode("No image") ;
        }
    }
                
    show_item() {
        // show as table with list for each member (which is a set of fields in itself)
        const clone = document.createElement("span"); // dummy span to hold clone
        cloneClass( ".Darray", clone ) ;

        const tab = clone.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Saved Images</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( this.new_val.length > 0 ) {
            this.new_val.forEach( entry => {
                const tr = tab.insertRow(-1);
                tr.insertCell(-1).appendChild( this.show_image( entry ) );
                const td=tr.insertCell(-1);
                td.style.width="100%";
                td.appendChild(entry.show_doc_inner() );
                });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
    }
        
    edit_item() {
        // Insert a table, and pull label into caption

        // Heading and buttons
        const clone = document.createElement("span"); // dummy span to hold clone
        cloneClass( ".Darray", clone ) ;

        // table caption
        const tab = clone.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} list</i>`;
        switch ( this.new_val.length ) {
            case 0:
                break ;
            case 1:
                tab.querySelector(".Darray_edit").hidden=false;
                tab.querySelector(".Darray_edit").onclick=()=>this.edit_array_entry( 0 );
                tab.querySelector(".Darray_crop").hidden=false;
                tab.querySelector(".Darray_crop").onclick=()=>this.crop( 0 );
                break ;
            default:
                tab.querySelector(".Darray_edit").hidden=false;
                tab.querySelector(".Darray_edit").onclick=()=>this.select_edit();
                tab.querySelector(".Darray_rearrange").hidden=false;
                tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange();
                break ;
        }

        // table entries
        if ( this.new_val.length > 0 ) {
            this.new_val.forEach( (entry,i) => {
                const tr = tab.insertRow(-1);
                tr.insertCell(-1).appendChild( this.show_image( entry ) );
                const td=tr.insertCell(-1);
                td.style.width="100%";
                td.onclick = () => this.edit_array_entry( i );
                td.appendChild(entry.show_doc_inner() );
                });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
    }

    select_edit( item ) {
        // Insert a table, and pull label into caption
        const parent = this.fake_page() ;
            
        // Heading and buttons
        cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Choose ${this._alias} item</i>`;
        [".Darray_back"].forEach(c=>tab.querySelector(c).hidden=false);
        tab.querySelector(".Darray_back").onclick=()=>this.enclosing.edit_doc();

        // table
        this.new_val.forEach( (entry,i) => {
            const tr = tab.insertRow(-1);
            tr.onclick = () => this.edit_array_entry( i );
            tr.insertCell(-1).appendChild( this.show_image( entry ) );
            
            const td = tr.insertCell(-1);
            td.appendChild(entry.show_doc_inner());
            });
    }

    rearrange() {
        const parent = this.fake_page() ;

        // Insert a table, and pull label into caption
                
        // Heading and buttons
        cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${this._alias} rearrange order</i>`;
        [".Darray_ok"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_ok").onclick=()=>this.enclosing.edit_doc();

        // table
        this.new_val.forEach( (entry,i) => {
            const tr = tab.insertRow(-1) ;
            tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Move this entry up"><B>&#8657;</B></button>`;
            tr.insertCell(-1).innerHTML=`<button type="button"  class="Darray_down" title="Move this entry down"><B>&#8659;</B></button>`;
                tr.insertCell(-1).appendChild( this.show_image( entry ) );
                const td=tr.insertCell(-1);
                td.style.width="100%";
                td.appendChild(entry.show_doc_inner() );
            });
            
        const elements = this.new_val.length ;
        tab.querySelectorAll(".Darray_up"  ).forEach( (b,i)=>b.onclick=()=> this.swap( i, (i+elements-1)%elements ) ) ;
        tab.querySelectorAll(".Darray_down").forEach( (b,i)=>b.onclick=()=> this.swap( i, (i+1)%elements )  );
    }
        
    edit_array_entry( idx ) {
        // image version, no add, crop enabled
        const parent = this.fake_page() ;
        const local_list = this.new_val[idx] ;

        // controls to be added to top
        const control_li = document.createElement('li');
        cloneClass( ".Darray_li", control_li ) ;
        control_li.querySelector("span").innerHTML=`<i>Edit Image</i>`;
        control_li.classList.add("Darray_li1");
        [".Darray_ok",".Darray_crop",".Darray_cancel",".Darray_delete"].forEach(c=>control_li.querySelector(c).hidden=false);
        control_li.querySelector(".Darray_ok").onclick=()=>{
            local_list.form2value() ;
            this.enclosing.edit_doc() ;
        };
        control_li.querySelector(".Darray_crop").onclick=()=>this.crop(idx);
        control_li.querySelector(".Darray_cancel").onclick=()=>this.enclosing.edit_doc();
        control_li.querySelector(".Darray_delete").onclick=()=>{
            if (confirm(`WARNING -- about to delete this ${this._alias} entry\nPress CANCEL to back out`)==true) {
                this.new_val.splice(idx,1);
                this.enclosing.edit_doc();
            }
        };

        // Insert edit fields and put controls at top
        local_list.edit_doc_inner()
        .then( ul => {
            ul.insertBefore( control_li, ul.children[0] );
            parent.appendChild(ul) ;
            }) ;
    }
    
    crop(idx) {
        const b = document.createElement("button") ;
        b.id="replot";
        b.onclick = () => {
            this.enclosing.edit_doc() ;
            b.remove() ;
            } ;    
        b.style.display = "none" ;
        document.body.appendChild(b) ;
        objectCrop.crop(this.new_val[idx] ) ;
    }
}
