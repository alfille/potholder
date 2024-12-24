/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    PotImages,
} ;

class PotImages {    
    constructor( doc ) {
        // Clear existing Images in memory
        this.images = doc?.images ?? [] ;
        this.pid = doc._id ;
    }

    exists(name) {
        return (name in this.images) ;
    }
    
    getURL( name ) {
        return objectDatabase.db.getAttachment( this.pid, name )
        .then( data => URL.createObjectURL(data) ) ;
    }
    
    displayClickable( name, small_class="small_pic" ) {
        const img = new Image() ;
        const canvas = document.createElement("canvas");
        switch ( small_class ) {
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
                crop = this.images.find( i => i.image==name)?.crop ?? null ;
                if ( !crop || crop.length!=4 ) {
					crop = [0,0,img.naturalWidth,img.naturalHeight] ;
				}
				const h = canvas.width * crop[3] / crop[2] ;
				canvas.height = h ;
				canvas.getContext("2d").drawImage( img, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, h ) ;
				}
            canvas.onclick=()=>{
				const img2 = new Image() ; // temp image
                this.getURL( name )
                .then( url2 => {
                    img2.onload = () => {
						URL.revokeObjectURL(url2) ;
						const canvas2 = document.getElementById("modal_canvas");
						const [cw,ch] = rightSize( crop[2], crop[3], window.innerWidth, window.innerHeight-75 ) ;
						canvas2.height = ch ;
						canvas2.getContext("2d").drawImage( img2, crop[0], crop[1], crop[2], crop[3], 0, 0, cw, ch ) ;
						} ;
					img2.src=url2;
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
					document.getElementById("modal_caption").innerText=this.images.find(e=>e.image==name).comment;
					document.getElementById("modal_id").style.display="block";
					})
                .catch( err => objectLog.err(err) ) ;
            };

            img.src=url ;
            })
        .catch( err => objectLog.err(err)) ;
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
        .catch( err => objectLog.err(err)) ;
        return canvas ;
    }

    displayAll() {
        return this.images.map( k=> this.displayClickable(k.image,"medium_pic") ) ;
    }    
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
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
        if ( !( "images" in doc) || ! Array.isArray(doc.images) || doc.images.length==0) {
            this.remove(pid) ;
            return ;
        }

        objectDatabase.db.getAttachment(pid, doc.images[0].image )
        .then(data => {
            const url = URL.createObjectURL(data) ;
            const t_img = document.createElement("img");
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
                    let img = this.pick.querySelector(`[data-id="${pid}"]`);
                    if ( img ) {
                        this.displayThumb( img, pid ) ;
                    } else {
                        img = document.createElement("img");
                        this.displayThumb( img, pid ) ;
                        img.classList.add("MainPhoto");
                        img.onclick = () => {
                            objectPot.select( pid )
                            .then( () => objectPage.show("PotMenu") ) ;
                        } ;
                        this.pick.appendChild( img ) ;
                        img.setAttribute("data-id",pid) ;
                    }
                    }) ;
                };
            t_img.src = url ;
        })
        .catch( err => objectLog.err(err) );
    }

    getOne( pid = potId ) {
        return objectPot.getRecordId( pid )
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
            this.pick.removeChild( img ) ;
        }
    }
}

objectThumb = new Thumb() ;
