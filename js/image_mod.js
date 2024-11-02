/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */
 
export {
    PotImages,
    Thumb,
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
    
    display( name, small_class="small_pic" ) {
        const img = document.createElement( "img" ) ;
        db.getAttachment( this.pid, name )
        .then( data => {
			const url = URL.createObjectURL(data) ;
			img.onload = () => URL.revokeObjectURL(url) ;
			img.onclick=()=>{
					db.getAttachment( this.pid, name )
					.then( data => {
						const img2 = document.getElementById("modal_img") ;
						const url2 = URL.createObjectURL(data) ;
						img2.onload = () => URL.revokeObjectURL(url2) ;
						img2.src=url2;
						document.getElementById("modal_caption").innerText=this.images.find(e=>e.image==name).comment;
						document.getElementById("modal_id").style.display="block";
						})
					.catch( err => objectLog.err(err) ) ;
				};

			img.src=url ;
			img.classList.add(small_class);
			})
		.catch( err => objectLog.err(err)) ;
		return img ;
	}

    print_display( name, small_class="small_pic" ) {
        const img = document.createElement( "img" ) ;
        db.getAttachment( this.pid, name )
        .then( data => {
			const url = URL.createObjectURL(data) ;
			img.onload = () => URL.revokeObjectURL(url) ;
			img.src=url ;
			img.classList.add(small_class);
			})
		.catch( err => objectLog.err(err)) ;
		return img ;
	}

    displayAll() {
        return this.images.map( k=> this.display(k.image,"medium_pic") ) ;
    }    
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
}

class Thumb {
    constructor() {
        this.canvas = document.getElementById("thumbnail");
        this.pick = document.getElementById("MainPhotos");
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.Thumbs = {} ;
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

		db.getAttachment(pid, doc.images[0].image )
		.then(data => {
			const url = URL.createObjectURL(data) ;
			const t_img = document.createElement("img");
			t_img.onload = () => {
				URL.revokeObjectURL(url) ;
				// center and crop to maintain 1:1 aspect ratio
				let sw = t_img.naturalWidth;
				let sh = t_img.naturalHeight ;
				let sx = 0 ;
				let sy = 0 ;
				if (  sw > sh ) {
					sx = (sw - sh) / 2;
					sw = sh ;
				} else {
					sy = (sh - sw ) / 2 ;
					sh = sw ;
				}
				this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.ctx.drawImage( t_img, sx, sy, sw, sh, 0, 0, this.canvas.width, this.canvas.height ) ;
				this.canvas.toBlob( (blob) => {
					this.Thumbs[pid] = blob;
					let img = this.pick.querySelector(`[data-id="${pid}"]`);
					if ( img ) {
						this.display( img, pid ) ;
					} else {
						img = document.createElement("img");
						this.display( img, pid ) ;
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

    display( target, pid = potId ) {
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
