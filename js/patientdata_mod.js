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
        this.images={} ;

		if ( click ) {
			this.clickEdit() ;
		} else {
			this.clickNoEdit() ;
		}
    }
    
    fillshow() {
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        let ul = document.createElement('ul');
        
        this.struct.forEach( item => {
			console.log("ITEM",item);
            let li = document.createElement("li");

            // possibly use an alias instead of database field name
            let span = document.createElement('span');
            span.classList.add('fill_show_label');
            span.innerHTML=`<i>${item.alias??item.name}:&nbsp;</i>`;
            span.title = item.hint;               
            li.appendChild(span);
            
            // get value and make type-specific input field with filled in value
            let preVal = item.name.split(".").reduce( (arr,arg) => arr && arr[arg] , this.doc ) ;
            span = document.createElement('span');
            span.classList.add('fill_show_data');
            let textnode="";
            switch( item.type ) {
                case "image":
                    textnode = document.createElement("div");
                    cloneClass( ".imagetemplate", textnode ) ;
                    let img = new ImageImbedded( textnode, this.doc, item?.none ) ;
                    img.display_image() ;
                    break ;

                case "checkbox":
					textnode=document.createTextNode( (preVal??[]).join(", ") );
                    break;

                case "datetime":
					textnode=document.createTextNode( preVal ? flatpickr.formatDate(new Date(preVal), "Y-m-d h:i K"):"" );
                    break ;

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
            li.appendChild(span);
            ul.appendChild( li );
        });
        console.log("UL",ul);

		this.ul = ul ;
        parent.appendChild(ul) ;
    }

    filledit() {
        let parent = document.getElementById("PotDataContent");
        parent.innerHTML = "";
        
        let ul = document.createElement('ul');
        
        this.struct.forEach( ( item, idx ) => {
            let li = document.createElement("li");
            li.setAttribute("data-index",idx);
            let lab = document.createElement("label");
            li.appendChild(lab);
            let localname = [item.name,idx,0].map( x=>x+'').join("_");
            
            // possibly use an alias instead of database field name
            if ( "alias" in item ) {
                lab.appendChild( document.createTextNode(`${item.alias}: `) );
            } else {
                lab.appendChild( document.createTextNode(`${item.name}: `) );
            }
            lab.title = item.hint;

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
                    lab.appendChild(inp);
					this.images[localname].addListen();
					this.images[localname].addListen();
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
                        lab.appendChild(inp);
                        lab.appendChild( document.createTextNode(c) );
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
                        lab.appendChild(inp);
                        lab.appendChild( document.createTextNode(c) );
                        })); 
                    break;

                case "list":
                    {
                    let dlist = document.createElement("datalist");
                    dlist.id = localname ;
                    inp = document.createElement("input");
                    inp.type = "text";
                    inp.setAttribute( "list", dlist.id );
                    inp.value = preVal??"";
                    lab.appendChild( dlist );
                    lab.appendChild( inp );                    
                        
                    choices
                    .then( clist => clist.forEach( (c) => {
						console.log("query",item.query,choices);
                        let op = document.createElement("option");
                        op.value = c;
                        dlist.appendChild(op);
                        })); 
                    }
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
                    lab.appendChild(inp);
					flatpickr( inp,
						{
							enableTime: false,
							noCalendar: false,
							dateFormat: "Y-m-d",
							//defaultDate: Date.now(),
						});
                    break;
                    
                case "time":
                    inp = document.createElement("input");
                    inp.classList.add("flatpickr","flatpickr-input");
                    inp.type = "text";
                    inp.size = 9;
                    inp.value = preVal??"";
                    inp.title = "Time in format HH:MM PM or HH:MM AM";
                    lab.appendChild(inp);
					flatpickr( inp,
						{
							enableTime: true,
							noCalendar: true,
							dateFormat: "h:i K",
							//defaultDate: "9:00",
						});
                    break;

                default:
                    inp = document.createElement( item.type=="textarea" ? "textarea" : "input" );
                    inp.title = item.hint;
                    inp.value = preVal??"" ;
                    lab.appendChild(inp);
                    break;
            }                
            
            ul.appendChild( li );
        });
        console.log("UL",ul);
        
		this.ul = ul ;
        parent.appendChild(ul) ;
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
        
    clickEdit() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".patientDataEdit").style.display="block";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = true;
        });
        this.filledit() ;
    }

    clickNoEdit() {
        //document.querySelectorAll(".topButtons").forEach( v=>v.style.display="block" ); 
        //document.querySelector(".patientDataEdit").style.display="none";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        this.fillshow() ;
    }
        
    loadDocData() {
        //return true if any real change
        let changed = false; 
		this.ul.querySelectorAll("li").forEach( (li) => {
			let idx = li.getAttribute("data-index");
			let postVal = "";
			let name = this.struct[idx].name;
			let localname = [this.struct[idx].name,idx,0].map(x=>x+'').join("_");
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
				case "textarea":
					postVal = li.querySelector("textarea").value;
					break;
				default:
					postVal = li.querySelector("input").value;
					break;
			}
			if ( this.struct[idx].type != "image" ) {
				if ( postVal != name.split(".").reduce( (arr,arg) => arr && arr[arg] , this.doc ) ) {
					changed = true;
					Object.assign( this.doc, name.split(".").reduceRight( (x,n) => ({[n]:x}) , postVal ));
				}
			} else {
				// image
				if ( this.images[localname].changed() ) {
					changed = true;
					this.images[localname].save(this.doc) ;
				}
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
