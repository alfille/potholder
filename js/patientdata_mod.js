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
		console.log("PotDataRaw",doc,struct);
        // args is a list of "docs" to update"
        this.parent = document.getElementById("PotDataContent");
        
        this.doc = doc;
        this.struct = struct;
        console.log("CONSTRUCT",doc,struct);
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
        
        let ul = document.createElement('ul');
        
        this.struct.forEach( item => {
			console.log("ITEM",item);
            let li = document.createElement("li");
            this.fill_show_item(item,this.doc).forEach( e => li.appendChild(e)) ;
            ul.appendChild( li );
        });
        console.log("UL",ul);

		this.ul = ul ;
        parent.appendChild(ul) ;
    }

	fill_show_item(item,doc) {
		// return an array to attach
		
		// possibly use an alias instead of database field name
		let span = document.createElement('span');
		span.classList.add('fill_show_label');
		span.innerHTML=`<i>${item.alias??item.name}:</i>`;
		span.title=item.hint??"data entry";
		let return_list=[];
				
		// get value and make type-specific input field with filled in value
		let preVal = null ;
		if ( item.name in doc ) {
			preVal = item.name.split(".").reduce( (arr,arg) => arr && arr[arg] , doc ) ;
		} else {
			doc[item.name]=null ;
		}
		span = document.createElement('span');
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
		tab.querySelectorAll(".Darray_up").forEach( (b,i)=>b.onclick=()=>this.edit_entry(item,i) );
	}

	edit_entry( item, idx ) {
		this.clickEditArray();
		// Insert a table, and pull label into caption
		// separate return because the flow is different
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
		let adding = idx==-1 ; // flag for adding rather than editing
		
        let ul = document.createElement('ul');
        let li1 = document.createElement('li');
        cloneClass( ".Darray_li", li1 ) ;
		li1.querySelector("span").innerHTML=`<i>${adding?"Add":"Edit"} ${item.alias??item.name} entry</i>`;
		(adding?[".Darray_ok",".Darray_cancel"]:[".Darray_ok",".Darray_cancel",".Darray_delete"]).forEach(c=>li1.querySelector(c).hidden=false);
	    li1.querySelector(".Darray_ok").onclick=()=>this.clickEdit();
	    li1.querySelector(".Darray_cancel").onclick=()=>this.clickEdit();
	    li1.querySelector(".Darray_delete").onclick=()=>this.clickEdit();
        ul.appendChild(li1);
        
        this.struct.forEach( ( item, idx ) => {
            let li = document.createElement("li");
			li.classList.add("MainEditList");
            this.fill_edit_item(item,idx,this.doc).forEach( e => li.appendChild(e)) ;
            ul.appendChild( li );
        });
        console.log("UL",ul);
        
		this.ul = ul ;
        parent.appendChild(ul) ;
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
		tab.querySelectorAll(".Darray_up").forEach( (b,i)=>b.onclick=()=>this.rearrange_up(item,i) );
		tab.querySelectorAll(".Darray_down").forEach( (b,i)=>b.onclick=()=>this.rearrange_down(item,i) );
	}

	rearrange_up(item,i)
	{
		const elements = this.doc[item.name].length ;
		console.log("up",i);
		[this.doc[item.name][i],this.doc[item.name][(i-1+elements)%elements]]=[this.doc[item.name][(i-1+elements)%elements],this.doc[item.name][i]];
		console.log("up2",i);
		this.rearrange( item );
		console.log("up3",i);
	}
	
	rearrange_down(item,i)
	{
		const elements = this.doc[item.name].length ;
		[this.doc[item.name][i],this.doc[item.name][(i+1)%elements]]=[this.doc[item.name][(i+1)%elements],this.doc[item.name][i]];
		this.rearrange( item );
	}
	
	fill_edit_array( item, doc ) {
		// Insert a table, and pull label into caption
		// separate return because the flow is different
		
		// data field
		if ( !(item.name in this.doc ) ) {
			this.doc[item.name] = null ;
		}
		console.log("FILL_EDIT_ARRAY",this.array_preVals);
		let preVal = this.doc[item.name] ;
		if ( !(item.name in this.array_preVals) ) {
			console.log("Store initial array",this.array_preVals);
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
	    tab.querySelector(".Darray_add").onclick=()=>this.edit_entry( item, -1 );
	    tab.querySelector(".Darray_edit").disabled=(elements<1);
	    tab.querySelector(".Darray_edit").onclick=(elements==1)?(()=>this.edit_entry( item, 0 )):(()=>this.select_edit(item));
	    tab.querySelector(".Darray_rearrange").disabled=(elements<2);
	    tab.querySelector(".Darray_rearrange").onclick=()=>this.rearrange(item);
	    console.log("OK");

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
	
	ArrayAdd(item) {
		console.log("ArrayAdd",item,"DOC",this.doc);
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
        
        let ul = document.createElement('ul');
        
        this.struct.forEach( ( item, idx ) => {
            let li = document.createElement("li");
			li.classList.add("MainEditList");
            this.fill_edit_item(item,idx,this.doc).forEach( e => li.appendChild(e)) ;
            ul.appendChild( li );
        });
        console.log("UL",ul);
        
		this.ul = ul ;
        parent.appendChild(ul) ;
    }
    
    fill_edit_item(item,idx,doc) {
		let lab = document.createElement("label");
		let localname = [item.name,idx,0].map( x=>x+'').join("_");
		
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
		let preVal = item.name.split(".").reduce( (arr,arg) => arr && arr[arg] , this.doc ) ;
		switch( item.type ) {
			case "image":
				inp = document.createElement("div");
				cloneClass( ".imagetemplate_edit", inp ) ;
				this.images[localname] = new ImageImbedded( inp, this.doc, item?.none ) ;
				this.images[localname].display_image() ;
				this.images[localname].addListen();
				this.images[localname].addListen();
				return_list.push(inp);
				break ;
				
			case "radio":
				choices
				.then( clist => clist.forEach( (c) => {
					console.log("query",item.query,choices);
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
					console.log("query",item.query,choices);
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
				return this.fill_edit_array( item ) ;

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
        
    loadDocData() {
        //return true if any real change
        let changed = false; 
		console.log("LOADDOC DOC",this.doc);
		this.ul.querySelectorAll(".MainEditList").forEach( (li,idx) => {
			let postVal = "";
			console.log("struct",idx,this.struct[idx],this.struct);
			let name = this.struct[idx].name;
			let localname = [name,idx,0].map(x=>x+'').join("_");
			console.log("Name",name);
			// first pass for value
			switch ( this.struct[idx].type ) {
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
					postVal = this.doc[name] ;
					console.log("Array postVal",postVal);
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
			switch( this.struct[idx].type ) {
				case "image":
					if ( this.images[localname].changed() ) {
						changed = true;
						this.images[localname].save(this.doc) ;
					}
					break ;
				
				case "array":
					changed ||= JSON.stringify(postVal) != this.array_preVals[name] ;
					console.log("Array changed?",changed);
					break ;
				
				default:
					if ( postVal != name.split(".").reduce( (arr,arg) => arr && arr[arg] , this.doc ) ) {
						changed = true;
						Object.assign( this.doc, name.split(".").reduceRight( (x,n) => ({[n]:x}) , postVal ));
					}
					break ;
			}
		});
        return changed;
    }
    
    saveChanged ( state ) {
        if ( this.loadDocData() ) {
			// doc is changed
			db.put( this.doc )
            .catch( (err) => objectLog.err(err) )
            .finally( () => objectPage.show( state ) );
		} else {
			objectPage.show( state ) ;
		}
    }
    
    savePatientData() {
		console.log("Savepatientdata",this);
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
