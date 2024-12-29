/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
"use strict";

/* jshint esversion: 11 */

export {
    PotDataPrint,
    } ;

import {
        PotImages,
    } from "./image_mod.js" ;

import {
    EntryList,
} from "./field_mod.js" ;
    
class PotDataPrint { // singleton class
    constructor(doc,struct) {
        // args is a list of "docs" to update"
        this.Images = new PotImages(doc);
        
        this.doc = doc;

        // Create (recursively) objects to mirror the structure
        this.list = new EntryList( struct, this.Images ) ;
        
        // Load the objects with doc data 
        this.list.load_from_doc( this.doc ) ;

        this.list.print_doc() ;
        objectPage.show_print();
        setTimeout( this.print, 1000 ) ;
    }

    print() {
            window.print() ;
    } 
    
}
