/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

// globals cookie backed
globalThis. potId = null ;

// singleton class instances
globalThis. globalPage = null ;
globalThis. globalPotData = null ;
globalThis. globalTable = null ;
globalThis. globalDatabase = null ;
globalThis. globalLog = null ;
globalThis. globalPot = null ;
globalThis. globalStorage = null ;
globalThis. globalSearch = null;
globalThis. globalThumbs = null;
globalThis. globalCropper = null ;
globalThis. globalSettings = {} ;

globalThis. rightSize = ( imgW, imgH, limitW, limitH ) => {
    const h = limitW * imgH / imgW ;
    if ( h <= limitH ) {
        return [ limitW, h ] ;
    } else {
        return [ limitH * imgW / imgH, limitH ] ;
    }
} ;

globalThis. cloneClass = ( fromClass, target ) => {
    document.getElementById("templates").
    querySelector(fromClass)
        .childNodes
        .forEach( cc => target.appendChild(cc.cloneNode(true) ) );
} ;


