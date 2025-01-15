/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

export class Log{
    constructor() {
        this.list = [];
    }
    
    err( err, title=null ) {
        // generic console.log of error
        const ttl = title ?? globalPage.current() ;
        const msg = err.message ?? err ;
        this.list.push(`${ttl}: ${msg}`);
        if ( globalSettings?.console == "true" ) {
            console.group() ;
            console.log( ttl, msg ) ;
            console.trace();
            console.groupEnd();
        }
        if ( globalPage.current() == "ErrorLog" ) {
            // update
            this.show();
        }
    }
    
    clear() {
        this.list = ["Error log cleared"] ;
        this.show();
    }
    
    show() {
        const cont = document.getElementById("ErrorLogContent") ;
        cont.innerHTML="";
        const ul = document.createElement('ul');
        cont.appendChild(ul);
        this.list
        .forEach( e => {
            const l = document.createElement('li');
            l.innerText=e;
            //l.appendChild( document.createTextNode(e) ) ;
            ul.appendChild(l) ;
        });
    }
}
globalLog = new Log() ;
