/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

import {
    PotBox,
    BlankBox,
} from "./app.js" ;

export {
    PotImages,
} ;

class Pot { // convenience class
    constructor() {
        this.TL=document.getElementById("TopLeftImage");
        this.LOGO = document.getElementById("LogoPicture");
        this.pictureSource = document.getElementById("HiddenPix");
    }
    
    create() {
        // create new pot record
        return ({
            _id: Id_pot.makeId( this.doc ),
            type:"",
            series:"",
            author: globalDatabase.username,
            artist: globalDatabase.username,
            start_date: (new Date()).toISOString().split("T")[0],
            stage: "greenware",
            kiln: "none",
           });
    }
   
    del() {
        if ( this.isSelected() ) {        
            globalDatabase.db.get( potId )
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n piece type << ${doc?.type} >> of series << ${doc.series} >>\nPress CANCEL to back out`)==true) {
                    return globalDatabase.db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => globalThumbs.remove( potId ) )
            .then( _ => this.unselect() )
            .then( _ => globalPage.show( "back" ) )
            .catch( (err) => {
                if (err != "Cancel" ) {
                    globalLog.err(err);
                    globalPage.show( "back" ) ;
                }
            });
        }
    }

    getAllIdDoc() {
        const doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: false,
        };
        return globalDatabase.db.allDocs(doc);
    }
        
    select( pid = potId ) {
        potId = pid ;
        // Check pot existence
        return globalDatabase.db.get( pid )
        .then( (doc) => {
            // Top left Logo
            globalThumbs.displayThumb( this.TL, pid ) ;
            new PotBox(doc);
            return doc ;
            })
        .catch( (err) => {
            globalLog.err(err,"pot select");
            this.unselect();
            });
    }

    isSelected() {
        return ( potId != null ) ;
    }

    unselect() {
        potId = null;
        this.TL.src = this.LOGO.src;
        if ( globalPage.isThis("AllPieces") ) {
            const pt = document.getElementById("PotTable");
            if ( pt ) {
                pt.rows.forEach( r => r.classList.remove('choice'));
            }
        }
        new BlankBox();
    }

    pushPixButton() {
        this.pictureSource = document.getElementById("HiddenPix");
        this.pictureSource.click() ;
    }

    pushGalleryButton() {
        this.pictureSource=document.getElementById("HiddenGallery");
        this.pictureSource.click() ;
    }

    save_pic( pid=potId, i_list=[] ) {
        if ( i_list.length == 0 ) {
            return Promise.resolve(true) ;
        }
        const f = i_list.pop() ;
        return globalDatabase.db.get( pid )
        .then( doc => {
            if ( !("images" in doc ) ) {
                doc.images = [] ;
            }
            if ( doc.images.find( e => e.image == f.name ) ) {
                // exists, just update attachment
                return globalDatabase.db.putAttachment( pid, f.name, doc._rev, f, f.type )
                    .catch( err => globalLog(err)) ;
            } else {
                // doesn't exist, add images entry as well (to front)
                doc.images.unshift( {
                    image: f.name,
                    comment: "",
                    date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
                    } );
                return globalDatabase.db.put( doc )
                    .then( r => globalDatabase.db.putAttachment( r.id, f.name, r.rev, f, f.type ) ) ;
            }
            })
        .then( _ => this.save_pic( pid, i_list ) ) ; // recursive
    }
                  

    newPhoto() {
        if ( ! globalPot.isSelected() ) { 
            globalPage.show("AssignPic") ;
            return ;
        }
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        globalPage.show("PotPixLoading");

        this.save_pic( potId, i_list )
        .then( () => globalThumbs.getOne( potId ) )
        .then( () => globalPage.add( "PotMenu" ) )
        .then( () => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
        const doc = this.create() ;
        //console.log("new",doc);
        globalDatabase.db.put( doc )
        .then( response => this.AssignPhoto( response.id ) )
        .catch( err => {
            globalLog(err);
            globalPage.show('MainMenu');
        }) ;
    }
            
    AssignPhoto(pid = potId) {
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        globalPage.show("PotPixLoading");
        globalPot.select( pid )
        .then( _ => this.save_pic( pid, i_list ) )
        .then( _ => globalThumbs.getOne( potId ) )
        .then( _ => globalPage.add("PotMenu" ) )
        .then( _ => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    showPictures(doc) {
        // doc alreaady loaded
        const pix = document.getElementById("PotPhotos");
        const images = new PotImages(doc);
        pix.innerHTML="";
        images.displayAll().forEach( i => pix.appendChild(i) ) ;
    }
}

class Id_pot {
    static type = "p";
    static version = 0;
    static start="";
    static end="\uffff";
    
    static splitId( id=potId ) {
        if ( id ) {
            const spl = id.split(";");
            return {
                version: spl[0] ?? null, // 0 so far
                type:    spl[1] ?? null,
                artist:  spl[2] ?? null,
                date:    spl[3] ?? null,
                rand:    spl[4] ?? null, // really creation date
            };
        }
        return null;
    }
    
    static joinId( obj ) {
        return [
            obj.version,
            obj.type,
            obj.artist,
            obj.date,
            obj.rand
            ].join(";");
    }
    
    static makeIdKey( pid, key=null ) {
        const obj = this.splitId( pid ) ;
        if ( key==null ) {
            obj.date = new Date().toISOString();
            obj.rand = Math.floor( Math.random() * 1000 ) ;
        } else {
            obj.date = key;
        }
        obj.type = this.type;
        return this.joinId( obj );
    }
    
    static makeId( doc ) {
        return [
            this.version,
            this.type,
            globalDatabase.username,
            new Date().toISOString(),
            Math.floor( Math.random() * 1000 ),
            ].join(";");
    }
    
    static allStart() { // Search entire database
        return [this.version, this.type, this.start].join(";");
    }
    
    static allEnd() { // Search entire database
        return [this.version, this.type, this.end].join(";");
    }
}

globalPot = new Pot() ;

class PotImages {    
    constructor( doc ) {
        // uses images array in doc
        //  image: name
        //  crop: dimensions
        this.images = doc?.images ?? [] ;
        this.pid = doc._id ;
        // doc does not need to have attachments included.
    }

    getURL( name ) {
        return globalDatabase.db.getAttachment( this.pid, name )
        .then( data => URL.createObjectURL(data) ) ;
    }
    
    displayClickable( name, pic_size="small_pic", new_crop=null ) {
        //console.log("displayClickable",name,pic_size,new_crop);
        const img = new Image() ;
        const canvas = document.createElement("canvas");
        switch ( pic_size ) {
            case "small_pic":
                canvas.width = 60 ;
                break;
            default:
                canvas.width = 120 ;
                break ;
        }
        canvas.classList.add("click_pic") ;
        let crop = [] ;
        this.getURL( name )
        .then( url => {
            img.onload = () => {
                URL.revokeObjectURL(url) ;
                crop = new_crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = this.images.find( i => i.image==name)?.crop ?? null ;
                }
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,img.naturalWidth,img.naturalHeight] ;
                }
                const h = canvas.width * crop[3] / crop[2] ;
                canvas.height = h ;
                canvas.getContext("2d").drawImage( img, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, h ) ;
                } ;
            canvas.onclick=()=>{
                const img2 = new Image() ; // temp image
                document.getElementById("modal_canvas").width = window.innerWidth ;
                this.getURL( name )
                .then( url2 => {
                    img2.onload = () => {
                        URL.revokeObjectURL(url2) ;
                        const canvas2 = document.getElementById("modal_canvas");
                        const [cw,ch] = rightSize( crop[2], crop[3], window.innerWidth, window.innerHeight-75 ) ;
                        canvas2.height = ch ;
                        canvas2.getContext("2d").drawImage( img2, crop[0], crop[1], crop[2], crop[3], 0, 0, cw, ch ) ;
                        screen.orientation.onchange=()=>{
                            screen.orientation.onchange=()=>{};
                            document.getElementById('modal_id').style.display='none';
                            requestAnimationFrame( ()=>canvas.click() ) ;
                            } ;
                        } ;
                    document.getElementById("modal_close").onclick=()=>{
                        screen.orientation.onchange=()=>{};
						if (globalSettings.fullscreen=="big_picture") {
							if ( document.fullscreenElement ) {
								document.exitFullscreen() ;
							}
						}
                        document.getElementById('modal_id').style.display='none';
                        };
                    document.getElementById("modal_down").onclick=()=> {
                        this.getURL( name )
                        .then( url => {
                            const link = document.createElement("a");
                            link.download = name;
                            link.href = url;
                            link.style.display = "none";

                            document.body.appendChild(link);
                            link.click(); // press invisible button
                            
                            // clean up
                            // Add "delay" see: https://www.stefanjudis.com/snippets/how-trigger-file-downloads-with-javascript/
                            setTimeout( () => {
                                window.URL.revokeObjectURL(link.href) ;
                                document.body.removeChild(link) ;
                            });
                        }) ;
                    } ;
					((globalSettings.fullscreen=="big_picture") ?
						document.documentElement.requestFullscreen()
						: Promise.resolve() )
                    .finally( _ => {
                        img2.src=url2;
                        document.getElementById("modal_caption").innerText=this.images.find(e=>e.image==name).comment;
                        document.getElementById("modal_id").style.display="block";
                        });
                    })
                .catch( err => globalLog.err(err) ) ;
            };

            img.src=url ;
            })
        .catch( err => globalLog.err(err)) ;
        return canvas ;
    }

    print_display( name ) {
        // full sized but cropped
        const img = new Image() ;
        const canvas = document.createElement("canvas");
        let crop = [] ;
        this.getURL( name )
        .then( url => {
            img.onload = () => {
                URL.revokeObjectURL(url) ;
                crop = this.images.find( i => i.image==name)?.crop ?? null ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,img.naturalWidth,img.naturalHeight] ;
                }
                canvas.width = crop[2] ;
                canvas.height = crop[3] ;
                canvas.getContext("2d").drawImage( img, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3] ) ;
                } ;
            img.src=url ;
            canvas.classList.add("print_pic");
            })
        .catch( err => globalLog.err(err)) ;
        return canvas ;
    }

    displayAll() {
        return this.images.map( k=> this.displayClickable(k.image,"medium_pic") ) ;
    }    
}

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

        globalDatabase.db.getAttachment(pid, doc.images[0].image )
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
                            globalPot.select( pid )
                            .then( () => globalPage.show("PotMenu") ) ;
                        } ;
                        this.pick.appendChild( img ) ;
                        img.alt = pid ;
                    }
                    },`image/${globalSettings?.img_format??"png"}`) ;
                };
            t_img.src = url ;
        })
        .catch( err => globalLog.err(err) );
    }

    _firstload( doc ) {
        // no need to check for existing
        const pid = doc._id ;
        if ( (doc?.images??[]).length<1) {
            return ;
        }

        globalDatabase.db.getAttachment(pid, doc.images[0].image )
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
                        globalPot.select( pid )
                        .then( () => globalPage.show("PotMenu") ) ;
                    } ;
                    this.pick.appendChild( img ) ;
                    img.alt = pid ;
                    }, `image/${globalSettings?.img_format??"png"}`) ;
                };
            t_img.src = url ;
        })
        .catch( err => globalLog.err(err) );
    }

    getOne( pid = potId ) {
        return globalDatabase.db.get( pid )
        .then( doc => this._load(doc) )
        .catch( err => globalLog.err(err) );
    }

    getAll() {
        this.pick.innerHTML="";
        globalPot.getAllIdDoc()
        .then( docs => {
            if ( 'requestIdleCallback' in window ) {
                if ( docs.rows.length > 0 ) {
                    window.requestIdleCallback( () => this.getAllList(docs.rows),{timeout:100});
                }
            } else {
                docs.rows.forEach( r => this._firstload( r.doc ) ) ;
            }
            })
        .catch( err => globalLog.err(err) ) ;
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

globalThumbs = new Thumb() ;

