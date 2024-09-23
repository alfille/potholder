/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
    PotImages,
    Thumb,
} ;

class PotImages {
    static srcList = [] ;
    
    constructor( doc ) {
        // Clear existing Images in memory
        PotImages.srcList.forEach( s => URL.revokeObjectURL(s) );
        PotImages.srcList=[] ;
        
        this.doc = doc;
        
        this.images = {} ;
        if ( "_attachments" in doc ) {
            Object.entries( doc._attachments ).forEach( ([k,v]) => {
                let s=URL.createObjectURL(v.data);
                this.images[k]=s;
                PotImages.srcList.push(s);
                });
        }
    }   
    
    exists(name) {
        return (name in this.images) ;
    }
    
    display( name, small_class="small_pic" ) {
        const img = document.createElement( "img" ) ;
        img.src=this.images[name] ;
        img.classList.add(small_class);
        img.onclick=()=>{
            document.getElementById("modal_img").src=img.src;
            document.getElementById("modal_caption").innerText=this.doc.images.find(e=>e.image==name).comment;
            document.getElementById("modal_id").style.display="block";
        }
        return img ;
    }

    displayAll() {
        return Object.keys(this.images).map( k=> this.display(k,"medium_pic") ) ;
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
        const pid = doc._id ;
        if ( ! ("_attachments" in doc) ) {
            return ;
        }
        let image = Object.keys(doc._attachments)[0] ;
        if ( image == undefined ) {
            return
        }
        if ( "images" in doc && Array.isArray(doc.images) && doc.images.length>0) {
            image = doc.images[0].image ;
        }

        const url = URL.createObjectURL(doc._attachments[image].data) ;
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
                        objectPot.select( pid ) ;
                        objectPage.show("PotMenu") ;
                    } ;
                    this.pick.appendChild( img ) ;
                    img.setAttribute("data-id",pid) ;
                }
                }) ;
            };
        t_img.src = url ;
    }

    getOne( pid = pot_Id ) {
        return objectPot.getRecordIdPix( pid, true )
        .then( doc => this._load(doc) )
        .catch( err => objectLog.err(err) );
    }

    getAll() {
        this.pick.innerHTML="";
        objectPot.getAllIdDocPix()
        .then( docs => {
            docs.rows.forEach( r => this._load( r.doc ) ) ;
            })
        .catch( err => objectLog.err(err) ) ;
    }

    display( target, pid = pot_Id ) {
        const url = URL.createObjectURL( (pid in this.Thumbs ) ? this.Thumbs[pid] : this.NoPicture ) ;
        target.onload = () => URL.revokeObjectURL( url ) ;
        target.src = url ;
    }

    remove( pid ) {
        let img = this.pick.querySelector(`[data-id="${pid}"]`);
        if ( img ) {
            this.pick.removeChild( img ) ;
        }
    }
}
