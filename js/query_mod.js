/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

// Create pouchdb indexes.
// Used for links between records and getting list of choices
// change version number to force a new version
export function createQueries() {
    let ddoclist = [
    {
        _id: "_design/qGlaze",
        version: 3,
        views: {
            qGlaze: {
                map: function (doc) {
                    if ("glaze" in doc) {
                        doc.glaze.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        }) ;
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qKiln",
        version: 3,
        views: {
            qKiln: {
                map: function (doc) {
                    if ("kilns" in doc) {
                        doc.kilns.forEach( g => {
                            if ( "kiln" in g ) {
                                emit( g.kiln ) ;
                            }
                        }) ;
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qCone",
        version: 3,
        views: {
            qCone: {
                map: function (doc) {
                    if ("kilns" in doc) {
                        doc.kilns.forEach( g => {
                            if ( "cone" in g ) {
                                emit( g.cone ) ;
                            }
                        }) ;
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qProcess",
        version: 3,
        views: {
            qProcess: {
                map: function (doc) {
                    if ("process" in doc) {
                        doc.process.forEach( g => {
                            if ( "type" in g ) {
                                emit( g.type ) ;
                            }
                        }) ;
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qType" ,
        version: 3,
        views: {
            qType: {
                map: function( doc ) {
                    if ( "type" in doc ) {
                        emit( doc.type );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qSeries" ,
        version: 3,
        views: {
            qSeries: {
                map: function( doc ) {
                    if ( "series" in doc ) {
                        emit( doc.series );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qArtist" ,
        version: 3,
        views: {
            qArtist: {
                map: function( doc ) {
                    if ( "artist" in doc ) {
                        emit( doc.artist );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
        _id: "_design/qLocation" ,
        version: 3,
        views: {
            qLocation: {
                map: function( doc ) {
                    if ( "location" in doc ) {
                        emit( doc.location );
                    }
                }.toString(),
                reduce: '_count',
            },
        },
    },
    {
		_id: "_design/qPictures",
		version: 3,
		views: {
			qPictures: {
				map: function(doc) { 
					emit( doc._id, ('images' in doc) ? doc.images.length : 0 ); 
				}.toString(), 
				reduce: '_stats',
			},
		},
	}, 	
    ];
    Promise.all( ddoclist.map( (ddoc) => {
        objectDatabase.db.get( ddoc._id )
        .then( doc => {
            if ( ddoc.version !== doc.version ) {
                ddoc._rev = doc._rev;
                return objectDatabase.db.put( ddoc );
            } else {
                return Promise.resolve(true);
            }
            })
        .catch( () => {
            // assume because this is first time and cannot "get"
            return objectDatabase.db.put( ddoc );
            });
        }))
    .catch( (err) => objectLog.err(err) );
}
