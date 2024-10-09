/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */

// globals cookie backed
globalThis. potId = null ;
globalThis. displayState = null ;
globalThis. remoteCouch = null ;

// other globals
globalThis. credentialList = ["database", "username", "password", "address" ] ;

// singleton class instances
globalThis. objectPage = null ;
globalThis. objectPotData = null ;
globalThis. objectTable = null ;
globalThis. objectRemote = null ;
globalThis. objectLog = null ;
globalThis. objectPot = null ;
globalThis. objectCookie = null ;
globalThis. objectSearch = null;
globalThis. objectThumb = null;

// Database handles
globalThis.db = null ; // will be Pouchdb local copy 
