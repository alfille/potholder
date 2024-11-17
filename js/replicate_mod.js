/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

import {
    } from "./globals_mod.js" ;

class DatabaseManager { // convenience class
    // Access to remote (cloud) version of database
    constructor() {
		// remoteCouch contents
		this.username = null ;
		this.password = null ;
		this.database = null ;
		this.address  = null ;
		this.local    = null ;
		
        this.remoteDB = null;
        this.problem = false ; // separates real connection problem from just network offline
        this.synctext = document.getElementById("syncstatus");
        this.db = null ;
        
    }
    
    show(type) {
		console.log(`for ${type}:`,"user:",this.username,"pwd:",this.password,"dtb:",this.database,"serve:",this.address,"local:",this.local);
	}
    
    load() {
		["username","password","database","address","local"].forEach( x => this[x]=objectCookie.local_get(x) );
	}
    
    acquire_and_listen() {        
        // Get remote DB from localStorage if available
        this.load();
        const cookie = objectCookie.get("remoteCouch");
        if ( cookie !== null ) { // legacy
			["username","password","database","address"].forEach( x => this[x] = this[x] ?? cookie[x] );
			objectCookie.del("remoteCouch") ;
		}
			
        // Get Remote DB fron command line if available
        const params = new URL(location.href).searchParams;
        ["username","password","database","address","local"].forEach( c => {
			const gc = params.get(c) ;
			//console.log(c,gc);
			if ( ( gc!==null ) && ( gc !== this[c] ) ) {
				this[c] = gc ;
				objectPage.reset() ;               
			}
		});
		this.store();
			 
        // set up monitoring
        window.addEventListener("offline", _ => this.not_present() );
        window.addEventListener("online", _ => this.present() );

        // initial status
        navigator.onLine ? this.present() : this.not_present() ;
    }
    
    open() { // local
		if ( this.database && (this.database !== "") ) {
			this.db = new PouchDB( this.database, {auto_compaction: true} ); // open local copy
		}
	}

    
    present() {
        this.status( "good", "--network present--" ) ;
    }

    not_present() {
        this.status( "disconnect", "--network offline--" ) ;
    }

    // Initialise a sync process with the remote server
    foreverSync() {
        document.getElementById( "userstatus" ).value = this.username;

		if ( this.local=="true" ) { // local -- no sync
            this.status("good","Local database only (no replication)");
            return ;
		}
			
        if ( this.username && this.password && this.database && this.address  ) {
            this.remoteDB = new PouchDB( [this.address, this.database].join("/") , {
                "skip_setup": "true",
                "auth": {
                    "username": this.username,
                    "password": this.password,
                    },
                });
        } else {
            objectLog.err("Bad DB specification");
            this.remoteDB = null;
        }
        if ( this.remoteDB ) {
            this.status( "good","download remote database");
            this.db.replicate.from( this.remoteDB )
                .catch( (err) => this.status("problem",`Replication from remote error ${err.message}`) )
                .finally( _ => this.syncer() );
        } else {
            this.status("problem","No remote database specified!");
        }
    }
    
    syncer() {
        this.status("good","Starting database intermittent sync");
        objectDatabase.db.sync( this.remoteDB ,
            {
                live: true,
                retry: true,
                filter: (doc) => doc._id.indexOf('_design') !== 0,
            } )
            .on('change', ()       => this.status( "good", "changed" ))
            .on('paused', ()       => this.status( "good", "quiescent" ))
            .on('active', ()       => this.status( "good", "actively syncing" ))
            .on('denied', ()       => this.status( "problem", "Credentials or database incorrect" ))
            .on('complete', ()     => this.status( "good", "sync stopped" ))
            .on('error', (err)     => this.status( "problem", `Sync problem: ${err.reason}` ));
    }
    
    status( state, msg ) {
        switch (state) {
            case "disconnect":
                document.body.style.background="#7071d3"; // Orange
                if ( this.lastState !== state ) {
                    objectLog.err(msg,"Network status");
                }
                break ;
            case "problem":
                document.body.style.background="#d72e18"; // grey
                objectLog.err(msg,"Network status");
                this.problem = true ;
                break ;
            case "good":
            default:
                document.body.style.background="#172bae"; // heppy blue
                if ( this.lastState !== state ) {
                    objectLog.err(msg,"Network status");
                }
                this.problem = false ;
                break ;
        }
        this.synctext.value = msg ;
    }
            
    SecureURLparse( url ) {
        let prot = "https";
        let addr = url;
        let port = "6984";
        let spl = url.split("://") ;
        if (spl.length < 2 ) {
            addr=spl[0];
        } else {
            prot = spl[0];
            addr = spl[1];
        }
        spl = addr.split(":");
        if (spl.length < 2 ) {
            addr=spl[0];
        } else {
            addr = spl[0];
            port = spl[1];
        }
        return [prot,[addr,port].join(":")].join("://");
    }

    // Fauxton link
    fauxton() {
        window.open( `${objectDatabase.address}/_utils`, '_blank' );
    }
    
    clearLocal() {
		const remove = confirm("Remove the eMission data and your credentials from this device?\nThe central database will not be affected.") ;
		if ( remove ) {
			objectCookie.clear();
			// clear (local) database
			objectDatabase.db.destroy()
			.finally( _ => location.reload() ); // force reload
		} else {
			objectPage.show( "MainMenu" );
		}
	}

}
objectDatabase = new DatabaseManager() ;
