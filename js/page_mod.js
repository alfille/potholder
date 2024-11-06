/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    Pagelist,
    } ;

import {
    } from "./globals_mod.js" ;
    
import {
	CSV,
	} from "./csv_mod.js" ;

class Pagelist {
    // list of subclasses = displayed "pages"
    // Note that these classes are never "instantiated -- only used statically
    static pages = {} ; // [pagetitle]->class -- pagetitle is used by HTML to toggle display of "pages"
    // prototype to add to pages
    static AddPage() { Pagelist.pages[this.name]=this; }
    
    static show_page(extra="") {
        // reset buttons from edit mode
        document.querySelector(".potDataEdit").style.display="none"; 
        document.querySelectorAll(".topButtons")
            .forEach( tb => tb.style.display = "block" );

        // hide all but current page
        document.querySelectorAll(".pageOverlay")
            .forEach( po => po.style.display = po.classList.contains(this.name) ? "block" : "none" );

        // hide Thumbnails
        document.getElementById("MainPhotos").style.display="none";
        
        this.show_content(extra);
    }
    
    static show_content(extra="") {
        // default version, derived classes may overrule
        // Simple menu page
    }
    
    static subclass(pagetitle) {
        const cls = Pagelist.pages[pagetitle] ?? null ;
        if ( cls ) {
            return cls ;
        } else {
            // bad entry -- fix by going back
            objectPage.back() ;
            return objectPage.current() ;
        }
    } 
}

class Page { // singleton class
    constructor() {
        this.normal_screen = false ; // splash/screen/print for show_screen
        this.path = [];
    }
    
    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
    }

    back() {
		// return to previous page (if any exist)
        this.path.shift() ;
        if ( this.path.length == 0 ) {
            this.reset();
        }
    }

    current() {
        if ( this.path.length == 0 ) {
            this.reset();
        }
        return this.path[0];
    }

    add( page = null ) {
        if ( page == "back" ) {
            this.back();
        } else if ( page == null ) {
            return ;
        } else {
            const iop = this.path.indexOf( page ) ;
            if ( iop < 0 ) {
                // add to from of page list
                this.path.unshift( page ) ;
            } else {
                // trim page list back to prior occurence of this page (no loops, finite size)
                this.path = this.path.slice( iop ) ;
            }
        }
    }

    isThis( page ) {
        return this.current()==page ;
    }

    forget() {
		// remove this page from the "back" list -- but don't actually go there
        this.back();
    }

    helpLink() {
		const helpLoc = "https://alfille.github.io/" ;
		const helpDir = "/potholder/" ;
		let   helpTopic = this.current() ;
		switch (helpTopic) {
			case 'ListForm':
			case 'ListSeries':
			case 'ListGlaze':
			case 'ListKiln':
			case "ListStage":
			case 'ListClay':
				helpTopic = 'ListGroup';
				break ;
			default:
				break ;
		}
        window.open( new URL(`${helpDir}${helpTopic}.html`,helpLoc).toString(), '_blank' );
    } 
    
    show( page, extra="" ) { // main routine for displaying different "pages" by hiding different elements
        console.log("SHOW",page,"STATE",this.path);
        // test that database is selected
        if ( db == null || credentialList.some( c => remoteCouch[c]=='' ) ) {
            // can't bypass this! test if database exists
            if ( page != "FirstTime" && page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.add(page) ; // place in reversal list

        // clear display objects
        objectPotData = null;
        objectTable = null;
		document.querySelector(".ContentTitleHidden").style.display = "none";

        this.show_normal(); // basic page display setup

        // send to page-specific code
        (Pagelist.subclass(objectPage.current())).show_page(extra);
    }
    
    show_normal() { // switch between screen and print
		if ( this.normal_screen ) {
			return ;
		}
		this.normal_screen = true ;
		// Clear Splash once really.
		document.getElementById("splash_screen").style.display = "none";
		
		document.querySelectorAll(".work_screen").forEach( v => v.style.display="block" ) ;
		document.querySelectorAll(".picture_screen").forEach( v => v.style.display="block" ) ;
		document.querySelectorAll(".print_screen").forEach( v => v.style.display="none" ) ;
    }    

    show_print() { // switch between screen and print
		if ( !this.normal_screen ) {
			return ;
		}
		this.normal_screen = false ;
		// Clear Splash once really.
		document.getElementById("splash_screen").style.display = "none";
		
		document.querySelectorAll(".work_screen").forEach( v => v.style.display="none" ) ;
		document.querySelectorAll(".picture_screen").forEach( v => v.style.display="none" ) ;
		document.querySelectorAll(".print_screen").forEach( v => v.style.display="block" ) ;
    }    

	headerLink() {
		if ( objectPage.current() != "MainMenu" ) {
			objectPage.show("MainMenu") ;
		} else {
			if ( objectPage ) {
				objectPage.reset();
			}
			window.location.href="/index.html"; // force reload
		}
	}

	copy_to_clip() {
		navigator.clipboard.writeText( document.getElementById("MakeURLtext").href )
		.catch( err => objectLog.err(err) );
	}
	
	csv() {
		new CSV() ;
	}
}

objectPage = new Page();

