/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
/* Althought this is labeled as "Cookie" we've switched to localStorage */ 

/* jshint esversion: 11 */

class Cookie { //convenience class
    // 2 versions, one with values placed in global scope, the other purely local values
    
    set( cname, value ) {
        // From https://www.tabnine.com/academy/javascript/how-to-set-cookies-javascript/
        this.local_set( cname, value ) ;
        globalThis[cname] = value;
    }
    
    local_set( cname, value ) {
        localStorage.setItem( cname, JSON.stringify(value) );
    }

    del( cname ) {
        this.local_del(cname);
        globalThis[cname] = null;
    }
    
    local_del( cname ) {
        localStorage.removeItem(cname);
    }
    
    get( cname ) {
        // local storage
        const ls = this.local_get( cname ) ;
        if ( ls ) {
            globalThis[cname] = ls;
            return ls ;
        }

        // legacy cookie
        const name = `${cname}=`;
        let ret = null ;
        decodeURIComponent(document.cookie).split('; ').filter( val => val.indexOf(name) === 0 ).forEach( val => {
            try {
                ret = JSON.parse( val.substring(name.length) );
                }
            catch(err) {
                ret =  val.substring(name.length);
                }
        });
        this.set(cname,ret) ; // put in local storage
        globalThis[cname] = ret;
        // Now delete cookie version
        // From https://www.w3schools.com/js/js_cookies.asp
        document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure; path=/;` ;
        return ret;
    }
    
    local_get( cname ) {
        // local storage
        const ls = localStorage.getItem(cname);
        if ( ls ) {
            try {
                return JSON.parse( ls ) ;
            }
            catch(err) {
                return ls ;
            }
        }
        return null ;
    }

    clear() {
        this.local_clear();
    }
    
    local_clear() {
        localStorage.clear();
    }
}
globalStorage = new Cookie() ;
