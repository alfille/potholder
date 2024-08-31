/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    PotData,
    PotDataEditMode,
    PotDataRaw,
    } ;

import {
    cloneClass,
    } from "./globals_mod.js" ;
    
// data entry page type
// except for Noteslist and some html entries, this is the main type
class PotDataRaw { // singleton class
    constructor(click,doc,struct) {
        // args is a list of "docs" to update"
        this.parent = document.getElementById("PotDataContent");
        
        this.doc = doc;
        this.struct = struct;
        this.images={} ;
        this.array_preVals={} ;

		if ( click ) {
			this.clickEdit() ;
		} else {
			this.clickNoEdit() ;
		}
    }
    
    clickNoEdit() {
        //document.querySelectorAll(".topButtons").forEach( v=>v.style.display="block" ); 
        //document.querySelector(".potDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        this.ul = document.createElement('ul');
        
        this.struct.forEach( item => {
            let li = document.createElement("li");
            this.fill_show_item(item,this.doc).forEach( e => li.appendChild(e)) ;
            this.ul.appendChild( li );
        });

        parent.appendChild(this.ul) ;
    }

	fill_show_item(item,doc) {
		// return an array to attach
		
		// possibly use an alias instead of database field name
		let span0 = document.createElement('span');
		span0.classList.add('fill_show_label');
		span0.innerHTML=`<i>${item.alias??item.name}:&nbsp;&nbsp;</i>`;
		span0.title=item.hint??"data entry";
		let return_list=[span0];
				
		// get value and make type-specific input field with filled in value
		let preVal = null ;
		if ( item.name in doc ) {
			preVal = doc[item.name];
		} else {
			doc[item.name]=null ;
		}
		let span = document.createElement('span');
		span.classList.add('fill_show_data');
		let textnode="";
		switch( item.type ) {
			case "image":
				textnode = document.createElement("div");
				cloneClass( ".imagetemplate", textnode ) ;
				let img = new ImageImbedded( textnode, doc, item?.none ) ;
				img.display_image() ;
				break ;

			case "checkbox":
				textnode=document.createTextNode( (preVal??[]).join(", ") );
				break;

			case "datetime":
				textnode=document.createTextNode( preVal ? flatpickr.formatDate(new Date(preVal), "Y-m-d h:i K"):"" );
				break ;
				
			case "array":
				// Insert a table, and pull label into caption
				// separate return because the flow is different
				return this.fill_show_array( item, doc ) ;

			case "date":
			case "time":
			case "radio":
			case "list":
			default:
				textnode=document.createTextNode( preVal??"" );
				break ;
		} 
		span.title = item.hint;               
		span.appendChild(textnode);
		return_list.push(span);
		return return_list;
	}
		
	select_edit( item ) {
		this.clickEditArray();
		// Insert a table, and pull label into caption
		// separate return because the flow is different
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
		
		// Heading and buttons
		cloneClass( ".Darray", parent ) ;
		let tab = parent.querySelector( ".Darray_table" ) ;
		tab.querySelector("span").innerHTML=`<i>Choose ${item.alias??item.name} item</i>`;
		[".Darray_back"].forEach(c=>tab.querySelector(c).hidden=false);

		tab.querySelector(".Darray_back").onclick=()=>this.clickEdit();

		// table
		this.doc[item.name].forEach( (v,i) => {
			let tr = tab.insertRow(-1) ;
			tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Edit this entry"><B>Edit</B></button>`;
			let td = tr.insertCell(-1);
			td.style.width="100%";
			let ul = document.createElement("ul");
			td.appendChild(ul);
			item.members.forEach( m => {
				let li = document.createElement("li");
				this.fill_show_item(m,v).forEach( e => li.appendChild(e)) ;
				ul.appendChild(li);
				}) ;
			});
		tab.querySelectorAll(".Darray_up").forEach( (b,i)=>b.onclick=()=>this.edit_array_entry(item,i) );
	}

	edit_array_entry( item, idx ) {
		this.clickEditArray();

		let doc={} ;
		let adding = idx==-1 ; // flag for adding rather than editing
		if ( !adding ) {
			Object.assign(doc,this.doc[item.name][idx]);
		}
		// Insert a table, and pull label into caption
		// separate return because the flow is different
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
		
        this.ul = document.createElement('ul');
        let li1 = document.createElement('li');
        let title = item.alias??item.name ;
        if ( !(item.name in this.doc) || this.doc[item.name]==null ) {
			this.doc[item.name]=[];
		}
        cloneClass( ".Darray_li", li1 ) ;
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
			this.clickEdit() ;
			};
	    li1.querySelector(".Darray_cancel").onclick=()=>this.clickEdit();
	    li1.querySelector(".Darray_delete").onclick=()=>{
			if (confirm(`WARNING -- about to delete this ${title} entry\nPress CANCEL to back out`)==true) {
				this.doc[item.name].splice(idx,1);
				this.clickEdit();
			}};
        this.ul.appendChild(li1);
        
        item.members.forEach( m => {
            let li = document.createElement("li");
			li.classList.add("MainEditList");
            this.fill_edit_item(m,doc).forEach( e => li.appendChild(e)) ;
            this.ul.appendChild( li );
        });
        
        parent.appendChild(this.ul) ;
    }

	rearrange( item ) {
		this.clickEditArray();
		// Insert a table, and pull label into caption
		// separate return because the flow is different
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
		
		// Heading and buttons
		cloneClass( ".Darray", parent ) ;
		let tab = parent.querySelector( ".Darray_table" ) ;
		tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} rearrange order</i>`;
		[".Darray_ok"].forEach(c=>tab.querySelector(c).hidden=false);

		tab.querySelector(".Darray_ok").onclick=()=>this.clickEdit();

		// table
		const elements = this.doc[item.name].length ;
		this.doc[item.name].forEach( (v,i) => {
			let tr = tab.insertRow(-1) ;
			tr.insertCell(-1).innerHTML=`<button type="button" class="Darray_up" title="Move this entry up"><B>&#8657;</B></button>`;
			tr.insertCell(-1).innerHTML=`<button type="button"  class="Darray_down" title="Move this entry down"><B>&#8659;</B></button>`;
			let td = tr.insertCell(-1);
			td.style.width="100%";
			let ul = document.createElement("ul");
			td.appendChild(ul);
			item.members.forEach( m => {
				let li = document.createElement("li");
				this.fill_show_item(m,v).forEach( e => li.appendChild(e)) ;
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
	
	fill_edit_array( item, doc ) {
		// Insert a table, and pull label into caption
		// separate return because the flow is different
		
		// data field
		if ( !(item.name in this.doc) ||  !Array.isArray(this.doc[item.name]) ) {
			this.doc[item.name] = [] ;
		}
		let preVal = this.doc[item.name] ;
		if ( !(item.name in this.array_preVals) ) {
			this.array_preVals[item.name] = JSON.stringify(preVal) ;
		}
		let elements = 0 ;
		if ( Array.isArray(preVal) ) {
			elements = preVal.length ;
		}

		// Heading and buttons
		let temp = document.createElement("span"); // hold clone
		cloneClass( ".Darray", temp ) ;
		let tab = temp.querySelector( ".Darray_table" ) ;
		tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
		[".Darray_add",".Darray_edit",".Darray_rearrange"].forEach(c=>tab.querySelector(c).hidden=false);
	    tab.querySelector(".Darray_add").onclick=()=>this.edit_array_entry( item, -1 );
	    tab.querySelector(".Darray_edit").disabled=(elements<1);
	    tab.querySelector(".Darray_edit").onclick=(elements==1)?(()=>this.edit_array_entry( item, 0 )):(()=>this.select_edit(item));
	    tab.querySelector(".Darray_rearrange").disabled=(elements<2);
	    tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange(item);

		// table
		if ( Array.isArray(preVal) ) {
			preVal.forEach( (v,i) => {
			let td = tab.insertRow(-1).insertCell(0);
			let ul = document.createElement("ul");
			td.appendChild(ul);
			item.members.forEach( m => {
				let li = document.createElement("li");
				this.fill_show_item(m,v).forEach( e => li.appendChild(e)) ;
				ul.appendChild(li);
				}) ;
			});
		}
		return [tab];
	}
	
	fill_show_array( item, doc ) {
		// Insert a table, and pull label into caption
		// separate return because the flow is different

		// data field
		if ( !(item.name in this.doc ) ) {
			this.doc[item.name] = null ;
		}
		let preVal = this.doc[item.name] ;

		let temp = document.createElement("span"); // hold clone
		cloneClass( ".Darray", temp ) ;
		let tab = temp.querySelector( ".Darray_table" ) ;
		tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
		tab.querySelectorAll("button").forEach(b=>b.style.display="none");

		if ( Array.isArray(preVal) ) {
			preVal.forEach( v => {
			let td = tab.insertRow(-1).insertCell(0);
			let ul = document.createElement("ul");
			td.appendChild(ul);
			item.members.forEach( m => {
				let li = document.createElement("li");
				this.fill_show_item(m,v).forEach( e => li.appendChild(e)) ;
				ul.appendChild(li);
				}) ;
			});
		}
		return [tab];
	}
		    
    clickEditArray() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
			});
	}		
        
    clickEdit() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".potDataEdit").style.display="block";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = true;
        });
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        this.ul = document.createElement('ul');
        
        this.struct.forEach( ( item, idx ) => {
            let li = document.createElement("li");
			li.classList.add("MainEditList");
            this.fill_edit_item(item,this.doc).forEach( e => li.appendChild(e)) ;
            this.ul.appendChild( li );
        });
        
        parent.appendChild(this.ul) ;
    }
    
    fill_edit_item(item,doc) {
		let lab = document.createElement("label");
		let localname = `UNIQUE${item.name}`;
		
		// possibly use an alias instead of database field name
		lab.appendChild( document.createTextNode(`${item.alias??item.name}: `) );
		lab.title = item.hint;
		let return_list=[lab];

		// get prior choices for fill-in choice
		let choices = Promise.resolve([]) ;
		if ( "choices" in item ) {
			choices = Promise.resolve(item.choices) ;
		} else if ( "query" in item ) {
			choices = db.query(item.query,{group:true,reduce:true}).then( q=>q.rows.map(qq=>qq.key).filter(c=>c.length>0) ) ;
		}

		// get value and make type-specific input field with filled in value
		let inp = null;
		let preVal = doc[item.name] ;
		switch( item.type ) {
			case "image":
				inp = document.createElement("div");
				cloneClass( ".imagetemplate_edit", inp ) ;
				this.images[localname] = new ImageImbedded( inp, this.doc, item?.none ) ;
				this.images[localname].display_image() ;
				this.images[localname].addListen();
				return_list.push(inp);
				break ;
				
			case "radio":
				choices
				.then( clist => clist.forEach( (c) => {
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
					}));
				break ;

			case "checkbox":
				choices
				.then( clist => clist.forEach( (c) => {
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
					})); 
				break;

			case "list":
				let dlist = document.createElement("datalist");
				dlist.id = localname ;
				inp = document.createElement("input");
				//inp.type = "text";
				inp.setAttribute( "list", dlist.id );
				inp.value = preVal??"";
				choices
				.then( clist => clist.forEach( (c) => 
					dlist.appendChild( new Option(c) )
					)); 
				return_list.push(dlist);
				return_list.push(inp);
				break;
				
			case "datetime":
				inp = document.createElement("input");
				inp.type = "text";
				inp.value = preVal ? flatpickr.formatDate(new Date(preVal), "Y-m-d h:i K"):"" ;
				inp.title = "Date and time in format YYYY-MM-DD HH:MM AM";
				lab.appendChild( inp );                    
				flatpickr( inp,
					{
						time_24hr: false,
						enableTime: true,
						noCalendar: false,
						dateFormat: "Y-m-d h:i K",
						//defaultDate: Date.now(),
					});
				break;

			case "date":
				inp = document.createElement("input");
				inp.classList.add("flatpickr","flatpickr-input");
				inp.type = "text";
				inp.size = 10;
				inp.value = preVal??"";
				inp.title = "Date in format YYYY-MM-DD";
				flatpickr( inp,
					{
						enableTime: false,
						noCalendar: false,
						dateFormat: "Y-m-d",
						//defaultDate: Date.now(),
					});
				return_list.push(inp);
				break;
				
			case "time":
				inp = document.createElement("input");
				inp.classList.add("flatpickr","flatpickr-input");
				inp.type = "text";
				inp.size = 9;
				inp.value = preVal??"";
				inp.title = "Time in format HH:MM PM or HH:MM AM";
				flatpickr( inp,
					{
						enableTime: true,
						noCalendar: true,
						dateFormat: "h:i K",
						//defaultDate: "9:00",
					});
				return_list.push(inp);
				break;
				
			case "array":
				return this.fill_edit_array( item, doc ) ;

			default:
				inp = document.createElement( item.type=="textarea" ? "textarea" : "input" );
				inp.title = item.hint;
				inp.value = preVal??"" ;
				return_list.push(inp);
				break;
		}
		return return_list ;
    }
    
    static HMtoMin ( inp ) {
        if ( typeof inp != 'string' ) {
            throw "bad";
        }
        let d = inp.match( /\d+/g );
        if ( (d == null) || d.length < 2 ) {
            throw "bad";
        }
        return parseInt(d[0]) * 60 + parseInt(d[1]);
    }
        
    static HMfromMin ( min ) {
        if ( typeof min == 'number' ) {
            return (Math.floor(min/60)+100).toString().substr(-2) + ":" + ((min%60)+100).toString().substr(-2);
        } else {
            return "00:00";
        }
    }
        
    loadDocData_local(struct,doc) {
        //return true if any real change
        let changed = false; 
		this.ul.querySelectorAll(".MainEditList").forEach( (li,idx) => {
			let postVal = "";
			let name = struct[idx].name;
			let localname = `UNIQUE${name}`;
			// first pass for value
			switch ( struct[idx].type ) {
				case "image":
					// handle separately
					break;
				case "radio":
					postVal = [...document.getElementsByName(localname)]
						.filter( i => i.checked )
						.map(i=>i.value)[0];
					break;
				case "datetime":
					try {
						postVal = new Date(flatpickr.parseDate(li.querySelector("input").value, "Y-m-d h:i K")).toISOString();
					} catch {
						postVal="";
					}
					break;
				case "checkbox":
					postVal = [...document.getElementsByName(localname)]
						.filter( i => i.checked )
						.map( i => i.value );
					break;
				case "array":
					postVal = doc[name] ;
					// already set
					break ;
				case "textarea":
					postVal = li.querySelector("textarea").value;
					break;
				default:
					postVal = li.querySelector("input").value;
					break;
			}
			// second pass for changed
			switch( struct[idx].type ) {
				case "image":
					if ( this.images[localname].changed() ) {
						changed = true;
						this.images[localname].save(this.doc) ;
					}
					break ;
				
				case "array":
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
        if ( changed ) {
			Object.assign(this.doc,doc);
		}
        return changed ;
    }
    
    saveChanged ( state ) {
        if ( this.loadDocData(this.struct,this.doc) ) {
			// doc is changed
			db.put( this.doc )
            .catch( (err) => objectLog.err(err) )
            .finally( () => objectPage.show( state ) );
		} else {
			objectPage.show( state ) ;
		}
    }
    
    savePatientData() {
        this.saveChanged( "PotMenu" );
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
