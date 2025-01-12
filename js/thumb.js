/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

class Thumb {
    constructor() {
        this.Thumbs = {} ;
    }

    setup() {
        // after onload
        this.canvas = document.getElementById("thumbnail"); // defines the thumbnail size
        this.pick = document.getElementById("MainPhotos");
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.NoPicture = this._no_picture() ;
    }

    _no_picture() {
        const img = document.getElementById("NoPicture");
        this.ctx.drawImage( img, 0, 0, this.canvas.width, this.canvas.height ) ;
        this.canvas.toBlob( (blob) => {
            this.NoPicture = blob ;
            }) ;
    }
    
    _load( doc ) {
        // attachments need not be included in doc -- will pull in separately
        const pid = doc._id ;
        if ( (doc?.images??[]).length<1) {
            this.remove(pid) ;
            return ;
        }

        objectDatabase.db.getAttachment(pid, doc.images[0].image )
        .then(data => {
            const url = URL.createObjectURL(data) ;
            const t_img = new Image();
            t_img.onload = () => {
                URL.revokeObjectURL(url) ;
                let crop = doc.images[0]?.crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,t_img.naturalWidth,t_img.naturalHeight] ;
                }
                // sw/sh in canvas units
                const [iw,ih] = rightSize( this.canvas.width, this.canvas.height, crop[2], crop[3]  ) ;
                // center and crop to maintain 1:1 aspect ratio
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage( t_img, crop[0] + (crop[2]-iw)/2, crop[1] + (crop[3]-ih)/2, iw, ih, 0, 0, this.canvas.width, this.canvas.height ) ;
                this.canvas.toBlob( (blob) => {
                    this.Thumbs[pid] = blob;
                    let img = this.pick.querySelector(`img[alt="${pid}"]`);
                    if ( img ) {
                        this.displayThumb( img, pid ) ;
                    } else {
                        img = new Image(100,100);
                        this.displayThumb( img, pid ) ;
                        img.classList.add("MainPhoto");
                        img.onclick = () => {
                            objectPot.select( pid )
                            .then( () => objectPage.show("PotMenu") ) ;
                        } ;
                        this.pick.appendChild( img ) ;
                        img.alt = pid ;
                    }
                    },`image/${objectSettings?.img_format??"png"}`) ;
                };
            t_img.src = url ;
        })
        .catch( err => objectLog.err(err) );
    }

    _firstload( doc ) {
        // no need to check for existing
        const pid = doc._id ;
        if ( (doc?.images??[]).length<1) {
            return ;
        }

        objectDatabase.db.getAttachment(pid, doc.images[0].image )
        .then(data => {
            const url = URL.createObjectURL(data) ;
            const t_img = new Image();
            t_img.onload = () => {
                URL.revokeObjectURL(url) ;
                let crop = doc.images[0]?.crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,t_img.naturalWidth,t_img.naturalHeight] ;
                }
                // sw/sh in canvas units
                const [iw,ih] = rightSize( this.canvas.width, this.canvas.height, crop[2], crop[3]  ) ;
                // center and crop to maintain 1:1 aspect ratio
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage( t_img, crop[0] + (crop[2]-iw)/2, crop[1] + (crop[3]-ih)/2, iw, ih, 0, 0, this.canvas.width, this.canvas.height ) ;
                this.canvas.toBlob( (blob) => {
                    this.Thumbs[pid] = blob;
                    const img = new Image(100,100);
                    this.displayThumb( img, pid ) ;
                    img.classList.add("MainPhoto");
                    img.onclick = () => {
                        objectPot.select( pid )
                        .then( () => objectPage.show("PotMenu") ) ;
                    } ;
                    this.pick.appendChild( img ) ;
                    img.alt = pid ;
                    }, `image/${objectSettings?.img_format??"png"}`) ;
                };
            t_img.src = url ;
        })
        .catch( err => objectLog.err(err) );
    }

    getOne( pid = potId ) {
        return objectDatabase.db.get( pid )
        .then( doc => this._load(doc) )
        .catch( err => objectLog.err(err) );
    }

    getAll() {
        this.pick.innerHTML="";
        objectPot.getAllIdDoc()
        .then( docs => {
            if ( 'requestIdleCallback' in window ) {
                if ( docs.rows.length > 0 ) {
                    window.requestIdleCallback( () => this.getAllList(docs.rows),{timeout:100});
                }
            } else {
                docs.rows.forEach( r => this._firstload( r.doc ) ) ;
            }
            })
        .catch( err => objectLog.err(err) ) ;
    }

    getAllList( rows ) {
        const r = rows.pop() ;
        this._load( r.doc ) ;
        if ( rows.length > 0 ) {
            window.requestIdleCallback( () => this.getAllList( rows ), {timeout:100} ) ;
        }
    }

    displayThumb( target, pid = potId ) {
        const url = URL.createObjectURL( (pid in this.Thumbs ) ? this.Thumbs[pid] : this.NoPicture ) ;
        target.onload = () => URL.revokeObjectURL( url ) ;
        target.src = url ;
    }

    remove( pid ) {
        const img = this.pick.querySelector(`img[alt="${pid}"]`);
        if ( img ) {
            delete this.Thumbs[img.alt];
            this.pick.removeChild( img ) ;
        }
    }
}

objectThumb = new Thumb() ;
