/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    Pagelist,
    } ;

import {
    } from "./globals_mod.js" ;

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
        let cls = Pagelist.pages[pagetitle] ?? null ;
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
        // get page history from cookies
        let path = [] ;
        this.lastscreen = null ; // splash/screen/patient for show_screen
        this.path = [];
        // stop at repeat of a page          
        for( const p of path ) {
            if ( this.path.includes(p) ) {
                break ;
            } else {
                this.path.push(p);
            }
        }
    }
    
    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
        objectCookie.set ( "displayState", this.path ) ;
    }

    back() {
		// return to previous page (if any exist)
        this.path.shift() ;
        if ( this.path.length == 0 ) {
            this.reset();
        }
		objectCookie.set ( "displayState", this.path ) ;
    }

    current() {
        if ( this.path.length == 0 ) {
            this.reset();
        }
        return this.path[0];
    }

    next( page = null ) {
        if ( page == "back" ) {
            this.back();
        } else if ( page == null ) {
            return ;
        } else {
            let iop = this.path.indexOf( page ) ;
            if ( iop < 0 ) {
                // add to from of page list
                this.path.unshift( page ) ;
            } else {
                // trim page list back to prior occurence of this page (no loops, finite size)
                this.path = this.path.slice( iop ) ;
            }
            objectCookie.set ( "displayState", this.path ) ;
        }
    }

    test( page ) {
        return this.current()==page ;
    }

    forget() {
		// remove this page from the "back" list -- but don't actually go there
        this.back();
    }

    link() {
        window.open( new URL(`/book/${this.current()}.html`,location.href).toString(), '_blank' );
    } 
    
    show( page, extra="" ) { // main routine for displaying different "pages" by hiding different elements
        console.log("SHOW",page,"STATE",displayState,this.path);
        // test that database is selected
        if ( db == null || credentialList.some( c => remoteCouch[c]=='' ) ) {
            // can't bypass this! test if database exists
            if ( page != "FirstTime" && page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.next(page) ; // place in reversal list

        // clear display objects
        objectPotData = null;
        objectTable = null;

        this.show_screen( "screen" ); // basic page display setup

        // send to page-specific code
        (Pagelist.subclass(objectPage.current())).show_page(extra);
    }
    
    show_screen( type ) { // switch between screen and print
        if ( type !== this.lastscreen ) {
            this.lastscreen == type ;
            document.getElementById("splash_screen").style.display = "none";
            let showscreen = {
                ".work_screen": type=="screen",
                ".print_patient": type == "patient",
            };
            for ( let cl in showscreen ) {
                document.querySelectorAll(cl)
                .forEach( (v)=> v.style.display=showscreen[cl]?"block":"none"
                );
            }
        }
    }    
}

objectPage = new Page();

