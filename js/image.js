/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

export {
    PotImages,
} ;

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
