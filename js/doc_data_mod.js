/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    PotData,
    PotDataEditMode,
    PotDataRaw,
    } ;

import {
        PotImages,
    } from "./image_mod.js" ;
    
// data entry page type
class PotDataRaw { // singleton class
    constructor(click,doc,struct) {
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);
        
        this.doc = doc;
        this.struct = struct;
        this.array_preVals={} ;
        this.double_tap = false ;

        // Add dummy entries for extra images
        if ( "_attachments" in doc ) {
            const a_list = Object.keys(doc._attachments);
            if ( ! ( "images" in doc ) ) {
                doc.images=[] ;
            }
            const i_list = doc.images.map( i=>i.image ) ;
            a_list
            .filter( a => ! i_list.includes(a) )
            .forEach( a=> {
                doc.images.push( {
                    image: a,
                    comment: "<Restored>",
                    date: new Date().toISOString()
                    }) ;
                changed = true ;
            });
        }
        // remove references to non-existent images
        if ( "images" in doc ) {
            const i_list = doc.images.map( i=>i.image ) ;
            if ( ! ( "_attachments" in doc ) ) {
                doc._attachments=[] ;
            }
            const a_list = Object.keys(doc._attachments);
            i_list
            .filter( i => ! a_list.includes(i) )
            .forEach( i => delete doc.images[i] ) ;
        }

        // jump to edit mode?
        if ( click ) {
            this.edit_doc() ;
        } else {
            this.show_doc() ;
        }
    }
    
    show_doc() {
        //document.querySelectorAll(".topButtons").forEach( v=>v.style.display="block" ); 
        //document.querySelector(".potDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        this.ul = document.createElement('ul');
        
        this.struct.forEach( item => {
            const li = document.createElement("li");
            this.show_item(item,this.doc).forEach( e => li.appendChild(e)) ;
            this.ul.appendChild( li );
        });

		this.ul.onclick = () => this.pre_edit_doc() ;
        parent.appendChild(this.ul) ;
        this.cloneClass( ".ExtraEdit", parent ) ;
    }

	pre_edit_doc() {
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
	}

    show_item(item,doc) {
        // return an array to attach
        
        // possibly use an alias instead of database field name
        const span0 = document.createElement('span');
        span0.classList.add('fill_show_label');
        span0.innerHTML=`<i>${item.alias??item.name}:&nbsp;&nbsp;</i>`;
        span0.title=item.hint??"data entry";
        const return_list=[span0];
                        
        // get value and make type-specific input field with filled in value
        const preVal = ( item.name in doc ) ? doc[item.name] : null ;
        //console.log("Show item", item.name, preVal, doc ) ;
        const span = document.createElement('span');
        span.classList.add('fill_show_data');
        let textnode="";
        switch( item.type ) {
            case "image":
                if ( preVal && this.Images.exists(preVal) ) {
                    textnode = this.Images.display(preVal) ;
                } else {
                    textnode = document.createTextNode( "No Image" );
                }
                break ;

            case "checkbox":
				if ( Array.isArray(preVal) && preVal.length>0 ) {
					textnode=document.createTextNode( preVal.join(", ") );
				} else {
					textnode=document.createTextNode( "<empty>" );
				}
					
                break;

            case "array":
                // Insert a table, and pull label into caption
                // separate return because the flow is different
                return this.show_array( item, doc ) ;

            case "image_array":
                return this.show_image_array( item, doc ) ;

            case "date":
				textnode=document.createTextNode( typeof(preVal)=="string" ? preVal.split("T")[0] : "" ) ;
				break ;
				
			case "bool":
				textnode=document.createTextNode( (preVal=="true") ? "yes" : "no" ) ;
				break ;
				
            case "radio":
            case "list":
            default:
                textnode=document.createTextNode( preVal??"<empty>" );
                break ;
        } 
        span.title = item.hint;               
        span.appendChild(textnode);
        return_list.push(span);
        return return_list;
    }
            
    select_edit( item ) {
        this.array_buttons();
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
            
        // Heading and buttons
        this.cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Choose ${item.alias??item.name} item</i>`;
        [".Darray_back"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_back").onclick=()=>this.edit_doc();

        // table
        this.doc[item.name].forEach( (v,i) => {
            const tr = tab.insertRow(-1) ;
            // 1st col
            const td1 = tr.insertCell(-1);
            td1.innerText="Choose";
            td1.classList.add("Rotate");
            tr.appendChild(td1);
            // second col
            const td2 = tr.insertCell(-1);
            td2.classList.add("Greedy");
            tr.onclick = ()=>this.edit_array_entry(item,i) ;
            const ul = document.createElement("ul");
            td2.appendChild(ul);
            item.members.forEach( m => {
                const li = document.createElement("li");
                this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                ul.appendChild(li);
                }) ;
            });
    }

    select_image_edit( item ) {
        this.array_buttons();
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
            
        // Heading and buttons
        this.cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Choose ${item.alias??item.name} item</i>`;
        [".Darray_back"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_back").onclick=()=>this.edit_doc();

        // table
        this.doc[item.name].forEach( (v,i) => {
            const tr = tab.insertRow(-1) ;
            const td = tr.insertCell(-1);
            // first col
            td.innerText="Choose";
            td.classList.add("Rotate");
            tr.appendChild(td)
            // second col (image)
            tr.insertCell(-1).appendChild( this.Images.display(v.image) );
			// 3rd col
            td = tr.insertCell(-1);
            td.style.width="100%";
            td.classList.add("Greedy");
            const ul = document.createElement("ul");
            td.appendChild(ul);
            tr.onclick = () => this.edit_array_entry(item,i) ;
            item.members
                .filter( m => m.type != "image" )
                .forEach( m => {
                const li = document.createElement("li");
                this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                ul.appendChild(li);
                }) ;
            });
    }

    edit_array_entry( item, idx ) {
        this.array_buttons();

        const doc={} ;
        const adding = idx==-1 ; // flag for adding rather than editing
        if ( !adding ) {
            Object.assign(doc,this.doc[item.name][idx]);
        }
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
                
        this.ul = document.createElement('ul');
        const li1 = document.createElement('li');
        const title = item.alias??item.name ;
        if ( !(item.name in this.doc) || this.doc[item.name]==null ) {
            this.doc[item.name]=[];
        }
        this.cloneClass( ".Darray_li", li1 ) ;
        li1.querySelector("span").innerHTML=`<i>${adding?"Add":"Edit"} ${title} entry</i>`;
        li1.classList.add("Darray_li1");
        (adding?[".Darray_ok",".Darray_cancel"]:[".Darray_ok",".Darray_cancel",".Darray_delete"]).forEach(c=>li1.querySelector(c).hidden=false);
        li1.querySelector(".Darray_ok").onclick=()=>{
            this.loadDocData_local( item.members, doc ) ;
            if ( adding ) {
                this.doc[item.name].push(doc);
            } else {
                Object.assign(this.doc[item.name][idx],doc);
            }
            this.edit_doc() ;
        };
        li1.querySelector(".Darray_cancel").onclick=()=>this.edit_doc();
        li1.querySelector(".Darray_delete").onclick=()=>{
            if (confirm(`WARNING -- about to delete this ${title} entry\nPress CANCEL to back out`)==true) {
                this.doc[item.name].splice(idx,1);
                this.edit_doc();
            }};
        this.ul.appendChild(li1);
    
        // gather choices, especially queries
        const choicesF = item.members.map( m => {
            if ( "choices" in m ) {
                return m.choices ;
            } else if ( "query" in m ) {
                return objectDatabase.db.query(m.query,{group:true,reduce:true}).then( q=>q.rows.map(qq=>qq.key).filter(c=>c.length>0) ) ;
            } else {
                return [];
            }
            });
        this.choicePromise( item.members ).then( choices => {
            item.members.forEach( ( m, idx ) => {
                const c = (choices.find(c=>c[0]==m.name)??[null,null])[1] ;
                const li = document.createElement("li");
                li.classList.add("MainEditList");
                this.edit_item(m,c,doc).forEach( e => li.appendChild(e)) ;
                this.ul.appendChild( li );
            });
            
            parent.appendChild(this.ul) ;
        });
    }

    rearrange( item ) {
        this.array_buttons();
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
                
        // Heading and buttons
        this.cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} rearrange order</i>`;
        [".Darray_ok"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_ok").onclick=()=>this.edit_doc();

        // table
        const elements = this.doc[item.name].length ;
        this.doc[item.name].forEach( v => {
            const tr = tab.insertRow(-1) ;
            tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Move this entry up"><B>&#8657;</B></button>`;
            tr.insertCell(-1).innerHTML=`<button type="button"  class="Darray_down" title="Move this entry down"><B>&#8659;</B></button>`;
            const td = tr.insertCell(-1);
            td.style.width="100%";
            const ul = document.createElement("ul");
            td.appendChild(ul);
            item.members.forEach( m => {
                const li = document.createElement("li");
                this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                ul.appendChild(li);
                }) ;
            });
        tab.querySelectorAll(".Darray_up").forEach( (b,i)=>b.onclick=()=>{
            [this.doc[item.name][i],this.doc[item.name][(i-1+elements)%elements]]=[this.doc[item.name][(i-1+elements)%elements],this.doc[item.name][i]];
            this.rearrange( item );
            });
        tab.querySelectorAll(".Darray_down").forEach( (b,i)=>b.onclick=()=>{
            [this.doc[item.name][i],this.doc[item.name][(i+1)%elements]]=[this.doc[item.name][(i+1)%elements],this.doc[item.name][i]];
            this.rearrange( item );
            });
        }
        
        rearrange_images( item ) {
            this.array_buttons();
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
                
        // Heading and buttons
        this.cloneClass( ".Darray", parent ) ;
        const tab = parent.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} rearrange order</i>`;
        [".Darray_ok"].forEach(c=>tab.querySelector(c).hidden=false);

        tab.querySelector(".Darray_ok").onclick=()=>this.edit_doc();

        // table
        const elements = this.doc[item.name].length ;
        this.doc[item.name].forEach( v => {
            const tr = tab.insertRow(-1) ;
            tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Move this entry up"><B>&#8657;</B></button>`;
            tr.insertCell(-1).innerHTML=`<button type="button"  class="Darray_down" title="Move this entry down"><B>&#8659;</B></button>`;
            tr.insertCell(-1).appendChild( this.Images.display(v.image) );
            const td = tr.insertCell(-1);
            td.style.width="100%";
            const ul = document.createElement("ul");
            td.appendChild(ul);
            item.members
                .filter( m => m.type != "image" )
                .forEach( m => {
                    const li = document.createElement("li");
                    this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                    ul.appendChild(li);
                    }) ;
            });
        tab.querySelectorAll(".Darray_up").forEach( (b,i)=>b.onclick=()=>{
            [this.doc[item.name][i],this.doc[item.name][(i-1+elements)%elements]]=[this.doc[item.name][(i-1+elements)%elements],this.doc[item.name][i]];
            this.rearrange_images( item );
            });
        tab.querySelectorAll(".Darray_down").forEach( (b,i)=>b.onclick=()=>{
            [this.doc[item.name][i],this.doc[item.name][(i+1)%elements]]=[this.doc[item.name][(i+1)%elements],this.doc[item.name][i]];
            this.rearrange_images( item );
            });
    }
        
    edit_array( item, doc ) {
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        
        // data field
        if ( !(item.name in this.doc) ||  !Array.isArray(this.doc[item.name]) ) {
            this.doc[item.name] = [] ;
        }
        const preVal = this.doc[item.name] ;
        if ( !(item.name in this.array_preVals) ) {
            this.array_preVals[item.name] = JSON.stringify(preVal) ;
        }
        const elements = Array.isArray(preVal) ? preVal.length : 0 ;

        // Heading and buttons
        const temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        const tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
        tab.querySelector(".Darray_add").hidden=false;
        tab.querySelector(".Darray_add").onclick=()=>this.edit_array_entry( item, -1 );
        if ( elements == 1 ) {
			tab.querySelector(".Darray_edit").hidden=false;
			tab.querySelector(".Darray_edit").onclick=()=>this.edit_array_entry( item, 0 );
		} else if ( elements > 1 ) {
			tab.querySelector(".Darray_edit").hidden=false;
			tab.querySelector(".Darray_edit").onclick=()=>this.select_edit(item);
			tab.querySelector(".Darray_rearrange").hidden=false;
			tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange(item);
		}

        // table
        if ( Array.isArray(preVal) && (preVal.length>0) ) {
            preVal.forEach( (v,i) => {
            const tr = tab.insertRow(-1);
            tr.onclick = () => this.edit_array_entry( item, i );
            const td = tr.insertCell(-1);
            const ul = document.createElement("ul");
            td.appendChild(ul);
            item.members.forEach( m => {
                const li = document.createElement("li");
                this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                ul.appendChild(li);
                }) ;
            });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
    }
        
    edit_image_array( item, doc ) {
        // Insert a table, and pull label into caption
        // separate return because the flow is different
        
        // data field
        if ( !(item.name in this.doc) ||  !Array.isArray(this.doc[item.name]) ) {
            this.doc[item.name] = [] ;
        }
        const preVal = this.doc[item.name] ;
        if ( !(item.name in this.array_preVals) ) {
            this.array_preVals[item.name] = JSON.stringify(preVal) ;
        }
        const elements = preVal.length ;

        // Heading and buttons
        const temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        const tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
        if ( elements == 1 ) {
			tab.querySelector(".Darray_edit").hidden=false;
			tab.querySelector(".Darray_edit").onclick=()=>this.edit_array_entry( item, 0 );
		} else if ( elements > 1 ) {
			tab.querySelector(".Darray_edit").hidden=false;
			tab.querySelector(".Darray_edit").onclick=()=>this.select_image_edit(item);
			tab.querySelector(".Darray_rearrange").hidden=false;
			tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange_images(item);
		}

        // table
		preVal.forEach( (v,i) => {
		const tr = tab.insertRow(-1);
		tr.onclick = () => this.edit_array_entry( item, i ); ; 
		tr.insertCell(-1).appendChild( this.Images.display(v.image) );
		const td = tr.insertCell(-1);
		const ul = document.createElement("ul");
		td.appendChild(ul);
		td.style.width="100%";
		item.members
			.filter( m => m.type != "image" )
			.forEach( m => {
			const li = document.createElement("li");
			this.show_item(m,v).forEach( e => li.appendChild(e)) ;
			ul.appendChild(li);
			}) ;
		});
        return [tab];
    }
        
    show_array( item, doc ) {
        // Insert a table, and pull label into caption
        // separate return because the flow is different

        // data field
        if ( !(item.name in this.doc ) ) {
            this.doc[item.name] = null ;
        }
        const preVal = this.doc[item.name] ;

        const temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        const tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( Array.isArray(preVal) && (preVal.length>0) ) {
            preVal.forEach( v => {
            const td = tab.insertRow(-1).insertCell(0);
            const ul = document.createElement("ul");
            td.appendChild(ul);
            item.members.forEach( m => {
                const li = document.createElement("li");
                this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                ul.appendChild(li);
                }) ;
            });
        } else {
            tab.insertRow(-1).insertCell(-1).innerHTML="<i>- no entries -</i>";
        }
        return [tab];
    }
                    
    show_image_array( item, doc ) {
        // Insert a table, and pull label into caption
        // separate return because the flow is different

        // data field
        if ( !(item.name in this.doc ) ) {
                this.doc[item.name] = null ;
        }
        const preVal = this.doc[item.name] ;

        const temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        const tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Saved Images</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( Array.isArray(preVal) ) {
            preVal.forEach( v => {
            const tr = tab.insertRow(-1);
            tr.insertCell(-1).appendChild( this.Images.display(v.image) );
            const td=tr.insertCell(-1);
            td.style.width="100%";
            const ul = document.createElement("ul");
            td.appendChild(ul);
            item.members
                .filter( m => m.type != "image" )
                .forEach( m => {
                    const li = document.createElement("li");
                    this.show_item(m,v).forEach( e => li.appendChild(e)) ;
                    ul.appendChild(li);
                    }) ;
            });
        }
        return [tab];
        }
                    
    array_buttons() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
    }               
    
    choicePromise( struct ) {
        const choices = [];
        struct
            .filter( item => "choices" in item )
            .forEach( item => choices.push([item.name,item.choices] ) ) ;
        return Promise.all( struct
            .filter( item => "query"   in item )
            .map( item => objectDatabase.db.query(item.query,{group:true,reduce:true})
                .then( q=>[item.name,q.rows.map(qq=>qq.key).filter(c=>c.length>0)] ) ) )
                .then( x => {
                    struct
                    .filter( item => "choices" in item )
                    .forEach( item => {
                        const f = x.find( xx=>xx[0]==item.name ) ;
                        if (f) {
                            x[1].push( ...item.choices ) ;
                        } else {
                            x.push( [item.name,item.choices] ) ;
                        }
                    });
            return x ;
            });
        }
 
    edit_doc() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="block";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = true;
        });
        const parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";

        this.choicePromise( this.struct ).then( choices => { 
            //console.log("Map",choices);
            this.ul = document.createElement('ul');
            this.ul.innerHTML = "";
            this.struct.forEach( ( item, idx ) => {
                const c = (choices.find(c=>c[0]==item.name)??[null,null])[1] ;
                //console.log("Mapped Choices", item.name, c );
                const li = document.createElement("li");
                li.classList.add("MainEditList");
                this.edit_item( item, c, this.doc)
                    .forEach( e => li.appendChild(e)) ;
                this.ul.appendChild( li );
            });
            
            parent.appendChild(this.ul) ;
            this.cloneClass( ".ExtraSave", parent ) ;
        });
    }
    
    edit_item(item,choices,doc) {
        const lab = document.createElement("label");
        const localname = `UNIQUE${item.name}`;
        
        // possibly use an alias instead of database field name
        lab.appendChild( document.createTextNode(`${item.alias??item.name}: `) );
        lab.title = item.hint;
        const return_list=[lab];

        // get value and make type-specific input field with filled in value
        let inp = null;
        const preVal = (item.name in doc) ? doc[item.name] : null ;
        switch( item.type ) {
            case "image":
				return_list.push( this.Images.display(preVal,"medium_pic") ) ;
                break ;
                    
            case "radio":
                choices.forEach( c => {
                    inp = document.createElement("input");
                    inp.type = item.type;
                    inp.name = localname;
                    inp.value = c;
                    if ( c == preVal??"" ) {
                        inp.checked = true;
                    }
                    inp.title = item.hint;
                    return_list.push(inp);
                    return_list.push(document.createTextNode(c));
                    });
                break ;

            case "bool":
                [true,false].forEach( c => {
                    inp = document.createElement("input");
                    inp.type = "radio";
                    inp.name = localname;
                    inp.value = c;
                    switch (c) {
						case true:
							inp.checked = (preVal == "true") ;
							break ;
						default:
							inp.checked = (preVal !== "true") ;
							break ;
					}
                    inp.title = item.hint;
                    return_list.push(inp);
                    return_list.push(document.createTextNode(c?"yes":"no"));
                    });
                break ;

            case "checkbox":
                choices.forEach( c => {
                    inp = document.createElement("input");
                    inp.type = item.type;
                    inp.name = localname;
                    inp.value = c;
                    if ( (preVal??[]).includes(c) ) {
                        inp.checked = true;
                    }
                    inp.title = item.hint;
                    return_list.push(inp);
                    return_list.push(document.createTextNode(c));
                    }); 
                break;

            case "list":
                const dlist = document.createElement("datalist");
                dlist.id = localname ;
                inp = document.createElement("input");
                //inp.type = "text";
                inp.setAttribute( "list", dlist.id );
                inp.value = preVal??"";
                choices.forEach( c => 
                    dlist.appendChild( new Option(c) )
                    ); 
                return_list.push(dlist);
                return_list.push(inp);
                break;
                    
            case "date":
                inp = document.createElement("input");
                inp.type = "date";
                inp.name = localname ;
                inp.title = item.hint;
                inp.value = typeof(preVal)=="string" ? preVal.split("T")[0] : "" ;
                return_list.push(inp);
                break;
                    
            case "array":
                return this.edit_array( item, doc ) ;

            case "image_array":
                return this.edit_image_array( item, doc ) ;

            default:
                inp = document.createElement( item.type=="textarea" ? "textarea" : "input" );
                inp.title = item.hint;
                inp.value = preVal??"" ;
                return_list.push(inp);
                break;
        }
        return return_list ;
    }
    
    loadDocData_local(struct,doc) {
        //return true if any real change
        let changed = false; 
        this.ul.querySelectorAll(".MainEditList").forEach( (li,idx) => {
            let postVal = "";
            const name = struct[idx].name;
            const localname = `UNIQUE${name}`;
            // first pass for value
            switch ( struct[idx].type ) {
                case "image":
                    // handle separately
                    break;
                case "radio":
                case "bool":
                    postVal = [...document.getElementsByName(localname)]
                        .filter( i => i.checked )
                        .map(i=>i.value)[0];
                    break;
                case "checkbox":
                    postVal = [...document.getElementsByName(localname)]
                        .filter( i => i.checked )
                        .map( i => i.value );
                    break;
                case "array":
                case "image_array":
                    postVal = doc[name] ;
                    // already set
                    break ;
                case "textarea":
                    postVal = li.querySelector("textarea").value;
                    break;
                case "date":
					postVal = li.querySelector("input").value ;
					if (new Date(postVal) !== "Invalid Date" ) {
						postVal = new Date( postVal ).toISOString() ;
					}
					break ;
                default:
                    postVal = li.querySelector("input").value;
                    break;
            }
            // second pass for changed
            switch( struct[idx].type ) {
                case "image":
                    // Picture cannot be changed 
                    break ;
                
                case "array":
                case "image_array":
                    changed ||= JSON.stringify(postVal) != this.array_preVals[name] ;
                    break ;
                
                default:
                    if ( postVal != doc[name] ) {
                        changed = true;
                        Object.assign(doc,{[name]:postVal});
                    }
                    break ;
            }
        });
        return changed;
    }
    
    loadDocData(struct,doc) {
        //return true if any real change
        let changed = this.loadDocData_local(struct,doc);
        // Check images
        if ( "images" in doc ) {
            const i_list = doc.images.map( i=>i.image ) ;
            const a_list = Object.keys(doc._attachments);
            a_list.filter( a=> ! i_list.includes(a) ).forEach( a=> {
                delete doc._attachments[a] ;
                changed = true ;
            });
        }
        if ( changed ) {
            Object.assign(this.doc,doc);
        }
        return changed ;
    }
    
    saveChanged ( state ) {
        if ( this.loadDocData(this.struct,this.doc) ) {
            // doc is changed
            objectDatabase.db.put( this.doc )
            .then( () => objectThumb.getOne( this.doc._id ) )
            .catch( (err) => objectLog.err(err) )
            .finally( () => objectPage.show( state ) );
        } else {
            objectPage.show( state ) ;
        }
    }
    
    savePieceData() {
        this.saveChanged( "PotMenu" );
    }

	cloneClass( fromClass, target ) {
		document.getElementById("templates").
		querySelector(fromClass)
		.childNodes
		.forEach( cc => target.appendChild(cc.cloneNode(true) ) );
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
