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
                            }
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
