/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

// globals cookie backed
globalThis. potId = null ;

// singleton class instances
globalThis. objectPage = null ;
globalThis. objectPotData = null ;
globalThis. objectTable = null ;
globalThis. objectDatabase = null ;
globalThis. objectLog = null ;
globalThis. objectPot = null ;
globalThis. objectCookie = null ;
globalThis. objectSearch = null;
globalThis. objectThumb = null;
globalThis. objectCrop = null ;

globalThis. rightSize = ( imgW, imgH, limitW, limitH ) => {
        const h = limitW * imgH / imgW ;
        if ( h > limitH ) {
            return [ limitH * imgW / imgH , limitH ] ;
        } else {
            return [limitW, h ] ;
        }
    } ;

globalThis. cloneClass = ( fromClass, target ) => {
        document.getElementById("templates").
        querySelector(fromClass)
                .childNodes
                .forEach( cc => target.appendChild(cc.cloneNode(true) ) );
	} ;


