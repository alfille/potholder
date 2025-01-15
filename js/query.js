/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

// Create pouchdb indexes.
// Used for links between records and getting list of choices
// change version number to force a new version

export {
    Query,
};
    
class Query {
    static version = 2 ; // change to force renewal (value is arbitrary)
    constructor() {
        this.version = `${Query.version}` ;
    }
    
    create(struct) {
        const queries = this.struct_parse(struct) ; // query entries
        // add image statistics
        queries.push( ({
            _id: "_design/qPictures",
            views: {
                qPictures: {
                    map: function(doc) { 
                        emit( doc._id, ('images' in doc) ? doc.images.length : 0 ); 
                    }.toString(), 
                    reduce: '_stats',
                },
            },
        }) );
        return Promise.all( queries.map( (ddoc) => {
            globalDatabase.db.get( ddoc._id )
            .then( doc => {
                // update if version number has changed
                if ( this.version !== doc.version ) {
                    ddoc._rev = doc._rev;
                    ddoc.version = this.version ;
                    return globalDatabase.db.put( ddoc );
                } else {
                    return Promise.resolve(true);
                }
                })
            .catch( () => {
                // assume because this is first time and cannot "get"
                return globalDatabase.db.put( ddoc );
                });
            }))
        .then( _ => this.prune_queries() )
        .then( _ => globalDatabase.db.viewCleanup() )
        .catch( (err) => globalLog.err(err) );
    }
    
    struct_parse(struct) {
        // create query definision (_design document) by parsing structure and finding:
        // 1. Query strings
        // 2. Query strings buried in an array (members)
        // query gives the name of the search and it is grouped by name
        return struct.map( e => {
            if ( "query" in e ) { // primary query field
                const f = `(doc) => { if ( "${e.name}" in doc ) { emit(doc.${e.name}) ; }}`;
                return ({
                    _id: `_design/${e.query}`,
                    views: {
                        [e.query]: {
                            map: f,
                            reduce: "_count",
                        },
                    },
                }) ;
            } else if ("members" in e) { // query field in array (or ImageArray)
                return e.members.filter( m => "query" in m ).map( m => {
                    const f = `(doc) => { if ( "${e.name}" in doc ){doc.${e.name}.forEach(g=> { if ( "${m.name}" in g ) { emit(g.${m.name}); }});}};`;
                    return ({
                        _id: `_design/${m.query}`,
                        views: {
                            [m.query]: {
                                map: f,
                                reduce: "_count",
                            },
                        },
                    }) ; 
                    }) ;
            } else { // no query -- will filter out
                return null ;
            }}).flat().filter( x => x != null ) ;
    }
    
    prune_queries() {
        // remove old entries (don't match version string)
        return globalDatabase.db.allDocs( {
            startkey: "_design/",
            endkey:   "_design/\uffff",
            include_docs: true,
        } )
        .then( docs => docs.rows.filter( r=> r.doc.version !== this.version ) )
        .then( rows => Promise.all( rows.map( r => globalDatabase.db.remove(r.doc)) ) ) ;
    }
}
