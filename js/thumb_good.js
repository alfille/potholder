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
                const img = new Image() ;
                img.width=100;
                img.height=100;
                img.style.overflow="hidden";
                
                let crop = doc.images[0]?.crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,t_img.naturalWidth,t_img.naturalHeight] ;
                }
                const scale = Math.min( crop[2]/100, crop[3]/100 ) ;
                img.setAttribute("data-id",pid) ;
                img.style.transform = `matrix(${ratio},0,0,${ratio},${-crop[0]},${-crop[1]}` ; 
                img.onload = () => this.pick.appendChild( img ) ;
                img.src = url ;
                URL.revokeObjectURL(url) ;
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
            docs.rows.forEach( r => this._load( r.doc ) ) ;
            })
        .catch( err => objectLog.err(err) ) ;
    }

    displayThumb( target, pid = potId ) {
        const url = URL.createObjectURL( (pid in this.Thumbs ) ? this.Thumbs[pid] : this.NoPicture ) ;
        target.onload = () => URL.revokeObjectURL( url ) ;
        target.src = url ;
    }

    remove( pid ) {
        const img = this.pick.querySelector(`[data-id="${pid}"]`);
        if ( img ) {
            delete this.Thumbs[img.getAttribute('data-id')];
            this.pick.removeChild( img ) ;
        }
    }
}

objectThumb = new Thumb() ;
