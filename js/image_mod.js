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
    
    display( name ) {
        const img = document.createElement( "img" ) ;
        img.src=this.images[name] ;
        img.classList.add("small_pic");
        img.onclick=()=>{
            document.getElementById("modal_img").src=img.src;
            document.getElementById("modal_caption").innerText=this.doc.images.find(e=>e.image==name).comment;
            document.getElementById("modal_id").style.display="block";
        }
        return img ;
    }

    displayAll() {
        return Object.keys(this.images).map( k=> this.display(k) ) ;
    }    
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
}

class Thumb {
    constructor() {
        this.canvas = document.getElementById("thumbnail");
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.Thumbs = {} ;
        this.img = document.createElement("img");
        this.NoPicture = this.no_picture() ;
    }

    no_picture() {
        const img = document.getElementById("NoPicture");
        this.ctx.drawImage( img, 0, 0, this.canvas.width, this.canvas.height ) ;
        this.canvas.toBlob( (blob) => {
            this.NoPicture = blob ;
            }) ;
    }
    
    _load( doc ) {
        if ( ("images" in doc) 
            && ("_attachments" in doc)
            && Array.isArray(doc.images)
            && doc.images.length > 0 
            && (doc.images[0].image in doc._attachments) ) 
        {
            const url = URL.createObjectURL(doc._attachments[doc.images[0].image].data) ;
            this.img.onload = () => {
                URL.revokeObjectURL(url) ;
                this.ctx.drawImage( this.img, 0, 0, this.canvas.width, this.canvas.height ) ;
                this.canvas.toBlob( (blob) => {
                    this.Thumbs[doc._id] = blob;
                    }) ;
                };
            this.img.src = url ;
        }
    }

    getOne( pid = pot_Id ) {
        return objectPot.getRecordIdPix( pid, true )
        .then( doc => this._load(doc) )
        .catch( err => objectLog.err(err) );
    }

    getAll() {
        db.allDocs( { // get docs from search
            include_docs: true,
            attachments: true,
            binary: true,
        })
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
}
            
            
