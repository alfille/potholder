/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    Cookie,
} ;

class Cookie { //convenience class
    set( cname, value ) {
        // From https://www.tabnine.com/academy/javascript/how-to-set-cookies-javascript/
        globalThis[cname] = value;
        localStorage.setItem( cname, JSON.stringify(value) );
    }

    del( cname ) {
        globalThis[cname] = null;
        localStorage.removeItem(cname);
    }

    get( cname ) {
		// local storage
		const ls = localStorage.getItem(cname);
        let ret = null;
		console.log("LS",cname,ls);
		if ( ls ) {
			try {
				ret = JSON.parse( ls ) ;
			}
			catch(err) {
				ret - ls ;
			}
			globalThis[cname] = ret;
			return ret ;
		}
		// legacy cookie
        const name = `${cname}=`;
        decodeURIComponent(document.cookie).split('; ').filter( val => val.indexOf(name) === 0 ).forEach( val => {
            try {
                ret = JSON.parse( val.substring(name.length) );
                }
            catch(err) {
                ret =  val.substring(name.length);
                }
        });
        this.set(cname,ret) ; // put in local storage
        return ret;
    }

    initialGet() {
        [ "potId", "remoteCouch", "displayState" ].forEach( c => this.get(c) );
    }

    clear() {
        [ "potId", "remoteCouch", "displayState" ].forEach( c => this.del(c) );
    }
}
objectCookie = new Cookie() ;
