/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

// globals cookie backed
globalThis. potId = null ;
globalThis. remoteCouch = null ;

// other globals
globalThis. credentialList = ["database", "username", "password", "address" ] ;
globalThis. pictureSource = document.getElementById("HiddenPix");

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
