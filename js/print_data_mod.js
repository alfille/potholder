/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    PotDataPrint,
    } ;

import {
        PotImages,
    } from "./image_mod.js" ;

// data entry page type
class PotDataPrint { // singleton class
    constructor(doc,struct) {
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);
        
        this.doc = doc;
        this.struct = struct ;
        this.image_list = [] ;

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

		this.show_doc() ;
		objectPage.show_print();
		setTimeout( this.print, 500 ) ;
    }
    
    print() {
		if ( objectPotData.image_list.every( (i) => i.complete ) ) {
			window.print() ;
		} else {
			setTimeout( this.print, 500 ) ;
		}
	} 
    
    show_doc() {
        const parent = document.getElementById("print_space");
        parent.innerHTML = "";
        
        this.ul = document.createElement('ul');
        
        this.struct.forEach( item => {
            let li = document.createElement("li");
            this.show_item(item,this.doc).forEach( e => li.appendChild(e)) ;
            this.ul.appendChild( li );
        });

        parent.appendChild(this.ul) ;
    }

    show_item(item,doc) {
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
            
    show_array( item, doc ) {
        // Insert a table, and pull label into caption
        // separate return because the flow is different

        // data field
        if ( !(item.name in this.doc ) ) {
            this.doc[item.name] = null ;
        }
        let preVal = this.doc[item.name] ;

        let temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        let tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>${item.alias??item.name} list</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( Array.isArray(preVal) && (preVal.length>0) ) {
            preVal.forEach( v => {
            let td = tab.insertRow(-1).insertCell(0);
            let ul = document.createElement("ul");
            td.appendChild(ul);
            item.members.forEach( m => {
                let li = document.createElement("li");
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
        let preVal = this.doc[item.name] ;

        let temp = document.createElement("span"); // hold clone
        this.cloneClass( ".Darray", temp ) ;
        let tab = temp.querySelector( ".Darray_table" ) ;
        tab.querySelector("span").innerHTML=`<i>Saved Images</i>`;
        tab.querySelectorAll("button").forEach(b=>b.style.display="none");

        if ( Array.isArray(preVal) ) {
            preVal.forEach( v => {
            const tr = tab.insertRow(-1);
            const img = this.Images.print_display( v.image, "print_pic" ) ;
            tr.insertCell(-1).appendChild( img );
            this.image_list.push(img) ;
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
                    
	cloneClass( fromClass, target ) {
		let c = document.getElementById("templates").querySelector(fromClass);
		c.childNodes.forEach( cc => target.appendChild(cc.cloneNode(true) ) );
	}
}
