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
        this.ul ;
        this.pairs = 1;
        this.images={} ;

        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = false;
        });
        this.parent.innerHTML = "";
        
		this.ul = this.fillshow( click );
		this.parent.appendChild( this.ul );
    }
    
    fillshow( click ) {
        let ul = document.createElement('ul');
        
        this.struct.forEach( ( item, idx ) => {
			console.log("ITEM",item);
            let li = document.createElement("li");

            // possibly use an alias instead of database field name
            let span = document.createElement('span');
            span.classList.add('fill_show_label');
            span.innerHTML=`<i>${item.alias??item.name}:&nbsp;</i>`;
            li.appendChild(span);
            
            // get value and make type-specific input field with filled in value
            let preVal = item.name.split(".").reduce( (arr,arg) => arr && arr[arg] , this.doc ) ;
            span = document.createElement('span');
            span.classList.add('fill_show_data');
            let textnode="";
            switch( item.type ) {
                case "image":
					textnode=document.createTextNode( "Picture" );
                    break ;
                case "radio":
                case "list":
					textnode=document.createTextNode( preVal );
                    break ;

                case "checkbox":
					textnode=document.createTextNode( (preVal??[]).join(", ") );
                    break;

                case "datetime":
					textnode=document.createTextNode( preVal ? flatpickr.formatDate(new Date(preVal), "Y-m-d h:i K"):"" );
                    break ;
                case "date":
                case "time":
                default:
					textnode=document.createTextNode( preVal??"" );
                    break ;
            }                
            span.appendChild(textnode);
            li.appendChild(span);
            ul.appendChild( li );
        });
        console.log("UL",ul);
        return ul;
    }

    fill( click ) {
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
                    cloneClass( ".imagetemplate", inp ) ;
                    this.images[localname] = new ImageImbedded( inp, this.doc, item?.none ) ;
                    this.images[localname].display_image() ;
                    lab.appendChild(inp);
                    if ( click ) {
                        this.clickEditItem(0,li);
                    }
                    break ;
                case "radio":
                    choices
                    .then( clist => clist.forEach( (c) => {
						console.log("query",item.query,choices);
                        inp = document.createElement("input");
                        inp.type = item.type;
                        inp.name = localname;
                        inp.value = c;
                        inp.disabled = true;
                        if ( c == preVal??"" ) {
                            inp.checked = true;
                            inp.disabled = false;
                        } else {
                            inp.disabled = true;
                        }
                        inp.title = item.hint;
                        lab.appendChild(inp);
                        lab.appendChild( document.createTextNode(c) );
                        }))
                    .then( () => {
                        if ( click ) {
                            this.clickEditItem(0,li);
                        }
                        }); 
                    break ;

                case "checkbox":
                    choices
                    .then( clist => clist.forEach( (c) => {
						console.log("query",item.query,choices);
                        inp = document.createElement("input");
                        inp.type = item.type;
                        inp.name = localname;
                        inp.value = c;
                        inp.disabled = true;
                        if ( (preVal??[]).includes(c) ) {
                            inp.checked = true;
                            inp.disabled = false;
                        } else {
                            inp.disabled = true;
                        }
                        inp.title = item.hint;
                        lab.appendChild(inp);
                        lab.appendChild( document.createTextNode(c) );
                        }))
                    .then( () => {
                        if ( click ) {
                            this.clickEditItem(0,li);
                        }
                        }); 
                    break;

                case "list":
                    {
                    let dlist = document.createElement("datalist");
                    dlist.id = localname ;
                    inp = document.createElement("input");
                    inp.type = "text";
                    inp.setAttribute( "list", dlist.id );
                    inp.value = preVal??"";
                    inp.readOnly = true;
                    inp.disabled = true;
                    lab.appendChild( dlist );
                    lab.appendChild( inp );                    
                        
                    choices
                    .then( clist => clist.forEach( (c) => {
						console.log("query",item.query,choices);
                        let op = document.createElement("option");
                        op.value = c;
                        dlist.appendChild(op);
                        }))
                    .then( () => {
                        if ( click ) {
                            this.clickEditItem(0,li);
                        }
                        }); 
                    }
                    break;
                case "datetime":
                    inp = document.createElement("input");
                    inp.type = "text";
                    inp.value = preVal ? flatpickr.formatDate(new Date(preVal), "Y-m-d h:i K"):"" ;
                    inp.title = "Date and time in format YYYY-MM-DD HH:MM AM";
                    inp.readOnly = true;
                    lab.appendChild( inp );                    
                    if ( click ) {
                        this.clickEditItem(0,li);
                    }
                    break;
                case "date":
                    inp = document.createElement("input");
                    inp.classList.add("flatpickr","flatpickr-input");
                    inp.type = "text";
                    inp.size = 10;
                    inp.value = preVal??"";
                    inp.readOnly = true;
                    inp.title = "Date in format YYYY-MM-DD";
                    lab.appendChild(inp);
                    if ( click ) {
                        this.clickEditItem(0,li);
                    }
                    break;
                case "time":
                    inp = document.createElement("input");
                    inp.classList.add("flatpickr","flatpickr-input");
                    inp.type = "text";
                    inp.size = 9;
                    inp.readOnly = true;
                    inp.value = preVal??"";
                    inp.title = "Time in format HH:MM PM or HH:MM AM";
                    lab.appendChild(inp);
                    if ( click ) {
                        this.clickEditItem(0,li);
                    }
                    break;
                default:
                    inp = document.createElement( item.type=="textarea" ? "textarea" : "input" );
                    inp.title = item.hint;
                    inp.readOnly = true;
                    inp.value = preVal??"" ;
                    lab.appendChild(inp);
                    if ( click ) {
                        this.clickEditItem(0,li);
                    }
                    break;
            }                
            
            ul.appendChild( li );
        });
        console.log("UL",ul);
        return ul;
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
        
    fsclick( target ) {
        if ( this.pairs > 1 ) {
            let ul = target.parentNode.parentNode.querySelector("ul");
            if ( target.value === "show" ) {
                // hide
                target.innerHTML = "&#10133;";
                ul.style.display = "none";
                target.value = "hide";
            } else {
                // show
                target.innerHTML = "&#10134;";
                ul.style.display = "";
                target.value = "show";
            }
        }
    }
    
    clickEdit() {
        this.clickEditButtons();
		this.ul.querySelectorAll("li").forEach( (li) => this.clickEditItem( li ) );
    }
    
    clickEditButtons() {
        document.querySelectorAll(".topButtons").forEach( v=>v.style.display="none" ); 
        document.querySelector(".patientDataEdit").style.display="block";
        document.querySelectorAll(".edit_data").forEach( (e) => {
            e.disabled = true;
        });
    }
    
    clickEditItem(li) {
        let idx = li.getAttribute("data-index");
        let localname = [this.struct[idx].name,idx,0].map(x=>x+'').join("_");
        if ( this.struct[idx] ?.readonly == "true" ) {
            return;
        }
        switch ( this.struct[idx].type ) {
            case "image":
                cloneClass(".imagetemplate_edit",li.querySelector("div"));
                this.images[localname].display_image();
                this.images[localname].addListen();
                break;
            case "radio":
            case "checkbox":
                document.getElementsByName(localname).forEach( (i) => i.disabled = false );
                break;
            case "date":
                li.querySelector("input").readOnly = false;
                flatpickr( li.querySelector("input"),
                    {
                        enableTime: false,
                        noCalendar: false,
                        dateFormat: "Y-m-d",
                        //defaultDate: Date.now(),
                    });
                break;
            case "time":
                li.querySelector("input").readOnly = false;
                flatpickr( li.querySelector("input"),
                    {
                        enableTime: true,
                        noCalendar: true,
                        dateFormat: "h:i K",
                        //defaultDate: "9:00",
                    });
                break;
            case "datetime":
                li.querySelector("input").readOnly = false;
                flatpickr( li.querySelector("input"),
                    {
                        time_24hr: false,
                        enableTime: true,
                        noCalendar: false,
                        dateFormat: "Y-m-d h:i K",
                        //defaultDate: Date.now(),
                    });
                break;
            case "textarea":
                li.querySelector("textarea").readOnly = false;
                break;
            case "list":
                li.querySelector("input").readOnly = false;
                li.querySelector("input").disabled = false;
                break;
            default:
                li.querySelector("input").readOnly = false;
                break;
        }
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
        this.clickEditButtons() ;
    }
}
