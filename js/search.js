/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

import {
    } from "./globals_mod.js" ;

// used to generate data entry pages "PotData" type
import {
	structDatabaseInfo,
	structGeneralPot,
	structImages,
} from "./doc_struct.js" ;

class Search { // singleton class
    constructor() {
        this.select_id = null ;

        this.field_alias={} ;
        this.field_link={} ;
		this.fields = [] ;

        this.structStructure= ({
			PotEdit:    structGeneralPot,
			PotPix:     structImages,
			});

        // Extract fields fields
        Object.entries(this.structStructure).forEach( ([k,v]) =>
			this.structFields(v)
			.forEach( fn => {
				this.field_link[fn]=k ;
				this.fields.push(fn);
				})
			);
    }

    resetTable () {
        this.setTable([]);
    } 

    select(id) {
        this.select_id = id;
    }

    toTable() {
        const needle = document.getElementById("searchtext").value;

        if ( needle.length == 0 ) {
            return this.resetTable();
        }
        objectDatabase.db.search(
			{ 
				query: needle,
				fields: this.fields,
				highlighting: true,
				mm: "80%",
			})
		.then( x => x.rows.map( r =>
			Object.entries(r.highlighting)
			.map( ([k,v]) => ({
					_id:r.id,
					Field:this.field_alias[k],
					Text:v,
					Link:this.field_link[k],
				})
				)) 
			)
		.then( res => res.flat() )
        .then( res => res.map( r=>({doc:r}))) // encode as list of doc objects
        .then( res=>this.setTable(res)) // fill the table
        .catch(err=> {
            objectLog.err(err);
            this.resetTable();
            });
    }

    setTable(docs=[]) {
        objectTable.fill(docs);
    }

	structParse( struct ) {
		return struct
		.filter( e=>!(['date','image'].includes(e.type)))
		.map(e=>{
			const name=e.name;
			const alias=e?.alias??name;
			if ( ['array','image_array'].includes(e.type) ) {
				return this.structParse(e.members)
				.map(o=>({name:[name,o.name].join("."),alias:[alias,o.alias].join(".")})) ;
			} else {
				return ({name:name,alias:alias});
			}
			})
		.flat();
	}
	
	structFields( struct ) {
		const sP = this.structParse( struct ) ;
		sP.forEach( o => this.field_alias[o.name]=o.alias );
		return sP.map( o => o.name ) ;
	}
}

// Set up text search
objectSearch = new Search();

