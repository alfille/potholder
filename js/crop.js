/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

import {
    EntryList,
} from "./field_mod.js" ;
    
class Crop {
    constructor() {
        // canvas and context
        this.under = document.getElementById("under_canvas") ;
        this.underctx = this.under.getContext("2d");
        this.canvas = document.getElementById("crop_canvas");
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.edges = [] ;
        this.ball = [] ;
        
        // edge blur (1/2 width for easier clicking
        this.blur = 10 ; 
        this.radius = 25 ;
        this.radii= this.radius ;
        
        // edges [left,top,right,bottom]
        this.active_edge = null ;
        
        this.observer = new ResizeObserver( _ => this.cacheBounds() ) ;
    }

    crop( entrylist ) {
        this.entrylist = entrylist ; // entry list holds image
        const imageentry = entrylist.members.find( m => m.struct.type == "image" ) ;
        this.cropentry = entrylist.members.find( m => m.struct.type == "crop" ) ;
        if ( imageentry == null || this.cropentry == null ) {
            this.cancel() ; 
        }
        const name = imageentry.new_val ;
        const image = new Image() ; // temporary image

        // Load Image
        imageentry.Images.getURL( name )
        .then( url => {
            image.onload = () => {
                // clear url
                URL.revokeObjectURL(url) ;
                
                // figure size if canvas and image
                this.natW = image.naturalWidth;
                this.natH = image.naturalHeight;
                
                if ( this.cropentry.new_val.length != 4 ) {
					this.cropentry.new_val = [ 0, 0, this.natW, this.natH ] ;
				}
                this.canW = window.innerWidth ;
                this.canH = 600 ;
                [this.W, this.H] = rightSize( this.natW, this.natH, this.canW, this.canH ) ;

                this.under.width = this.canW ;
                this.canvas.width = this.canW ;
                this.under.height = this.canH ;
                this.canvas.height = this.canH ; 
                this.background() ;
                // show scaled image
                this.underctx.drawImage( image, 0, 0, this.W, this.H ) ;

                // only started after image load
                this.startEdges() ;
                
                // bounding box precalculations box 
                this.cacheBounds() ;
                
                // handlers
                this.canvas.ontouchstart = (e) => this.start_drag_t(e);
                this.canvas.ontouchmove  = (e) => this.drag_t(e);
                this.canvas.ontouchend   = (e) => this.undrag();
                this.canvas.onmousedown  = (e) => this.start_drag(e);
                this.canvas.onmousemove  = (e) => this.drag_m(e);
                this.canvas.onmouseup    = (e) => this.undrag();
                this.canvas.oncontextmenu= (e) => e.preventDefault() ;
                
                // Show
                this.show(true);
            }
            image.src = url ;
            })
        .catch( err => {
            objectLog.err(err) ;
            this.cancel() ;
            }) ;
    }
    
    cacheBounds() {
        const bounding = this.canvas.getBoundingClientRect() ;
        this.boundX = bounding.left ;
        this.boundY = bounding.top ;
        this.ratioX = this.canW / bounding.width ;
        this.ratioY = this.canH / bounding.height ;
    }
    
    background() {
        this.underctx.fillStyle = "lightgray" ;
        this.underctx.fillRect(0,0,this.canW,this.canH) ;
        this.underctx.strokeStyle = "white" ;
        this.underctx.lineWidth = 1 ;
        const grd = 10 ; // grid size
        for ( let i = grd; i <= this.canW ; i += grd ) {
            // grid
            this.underctx.beginPath() ;
            this.underctx.moveTo( i,0 ) ;
            this.underctx.lineTo( i,this.canH ) ;
            this.underctx.stroke() ;
        }
        for ( let i = grd; i <= this.canH ; i += grd ) {
            // grid
            this.underctx.beginPath() ;
            this.underctx.moveTo( 0,i ) ;
            this.underctx.lineTo( this.canW,i ) ;
            this.underctx.stroke() ;
        }
    }
    
    startEdges() {
		// convert picture scale to shown scale
		this.edges[0] = this.cropentry.new_val[0] * this.W / this.natW ;
		this.edges[1] = this.cropentry.new_val[1] * this.H / this.natH ;
		this.edges[2] = this.cropentry.new_val[2] * this.W / this.natW + this.edges[0] ;
		this.edges[3] = this.cropentry.new_val[3] * this.H / this.natH + this.edges[1] ;
        [0,1,2,3,null].forEach( e => {
			this.active_edge = e ;
			this.testEdges() ;
			});
    }
    
    testEdges() {
		const b2 = 2*this.blur ;
        switch ( this.active_edge ) {
			case null:
				break ;
			case 0:
				if ( this.edges[0] < 0 ) {
					this.edges[0] = 0 ;
				}
				if ( this.edges[0] >= this.W-b2 ) {
					this.edges[0] = this.W-b2 ;
				}
				if ( this.edges[0] >= this.edges[2]-b2 ) {
					this.edges[0] = this.edges[2]-b2 ;
				} 
				break ;
			case 1:
				if ( this.edges[1] < 0 ) {
					this.edges[1] = 0 ;
				}
				if ( this.edges[1] >= this.H-b2 ) {
					this.edges[1] = this.H-b2 ;
				}
				if ( this.edges[1] >= this.edges[3]-b2 ) {
					this.edges[1] = this.edges[3]-b2 ;
				}
				break ;
			case 2:
				if ( this.edges[2] <= b2 ) {
					this.edges[2] = b2 ;
				}
				if ( this.edges[2] >= this.W ) {
					this.edges[2] = this.W-1 ;
				}
				if ( this.edges[2] <= this.edges[0]+b2 ) {
					this.edges[2] = this.edges[0]+b2 ;
				}
				break ;
			case 3:
				if ( this.edges[3] <= b2 ) {
					this.edges[3] = b2 ;
				}
				if ( this.edges[3] >= this.H ) {
					this.edges[3] = this.H-1 ;
				}
				if ( this.edges[3] <= this.edges[1]+b2 ) {
					this.edges[3] = this.edges[1]+b2 ;
				}
				break ;
		}
			

        this.ball[0] = ( this.edges[1] + this.edges[3] ) / 2 ;
        this.ball[1] = ( this.edges[0] + this.edges[2] ) / 2 ;
        this.ball[2] = this.ball[0] ;
        this.ball[3] = this.ball[1] ;

        const R2 = Math.min(
            (this.ball[0]-this.edges[1])**2 + (this.edges[0]-this.ball[1])**2 ,
            (this.ball[0]-this.edges[3])**2 + (this.edges[0]-this.ball[3])**2 ,
            (this.ball[2]-this.edges[1])**2 + (this.edges[2]-this.ball[1])**2 ,
            (this.ball[2]-this.edges[3])**2 + (this.edges[2]-this.ball[3])**2 ,
            (this.ball[0]-this.ball[2])**2 + (this.edges[0]-this.edges[2])**2 ,
            (this.ball[1]-this.ball[3])**2 + (this.edges[1]-this.edges[3])**2 );
        this.radii = Math.min( this.radius, (R2**.5)/2 ) ;
        
        this.showEdges() ;
    }
    
    showEdges() {
		const quart = Math.PI / 2 ;
        this.ctx.clearRect(0,0,this.canW,this.canH);
        this.ctx.lineWidth = 2 ;
        
        this.ctx.fillStyle = `rgba( 23,43,174,0.5 )` ; // big shadow
        this.ctx.fillRect( 0,0,this.edges[0],this.canH ) ; // left
        this.ctx.fillRect( this.edges[2],0,this.canW-this.edges[0],this.canH ) ; // right
        this.ctx.fillRect( 0,0,this.canW, this.edges[1] ) ; // top
        this.ctx.fillRect( 0,this.edges[3],this.canW,this.canH-this.edges[3] ) ; // bottom
        
        this.ctx.strokeStyle = (0 == this.active_edge) ? "yellow" : "black" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( this.edges[0],0 ) ;
        this.ctx.lineTo( this.edges[0], this.canH ) ;
        this.ctx.moveTo( this.edges[0]-2,0 ) ;
        this.ctx.lineTo( this.edges[0]-2, this.canH ) ;
        this.ctx.moveTo( this.edges[0]-4,0 ) ;
        this.ctx.lineTo( this.edges[0]-4, this.canH ) ;
        this.ctx.stroke() ;
        this.ctx.strokeStyle = "white" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( this.edges[0]-1,0 ) ;
        this.ctx.lineTo( this.edges[0]-1, this.H ) ;
        this.ctx.stroke() ;
        this.ctx.beginPath() ;
        this.ctx.arc( this.edges[0], this.ball[0], this.radii, 2*quart, 6*quart )
        this.ctx.arc( this.edges[0], this.ball[0], this.radii-5, 2*quart, 6*quart )
        this.ctx.stroke() ;
        
        
        this.ctx.strokeStyle = (2 == this.active_edge) ? "yellow" : "black" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( this.edges[2],0 ) ;
        this.ctx.lineTo( this.edges[2], this.canH ) ;
        this.ctx.moveTo( this.edges[2]+2,0 ) ;
        this.ctx.lineTo( this.edges[2]+2, this.canH ) ;
        this.ctx.moveTo( this.edges[2]+4,0 ) ;
        this.ctx.lineTo( this.edges[2]+4, this.canH ) ;
        this.ctx.stroke() ;
        this.ctx.strokeStyle = "white" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( this.edges[2]+1,0 ) ;
        this.ctx.lineTo( this.edges[2]+1, this.H ) ;
        this.ctx.stroke() ;
        this.ctx.beginPath() ;
        this.ctx.arc( this.edges[2], this.ball[2], this.radii, 0, 4*quart )
        this.ctx.arc( this.edges[2], this.ball[2], this.radii-5, 0, 4*quart )
        this.ctx.stroke() ;
        
        this.ctx.strokeStyle = (1 == this.active_edge) ? "yellow" : "black" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( 0, this.edges[1] ) ;
        this.ctx.lineTo( this.canW, this.edges[1] ) ;
        this.ctx.moveTo( 0, this.edges[1]-2 ) ;
        this.ctx.lineTo( this.canW, this.edges[1]-2 ) ;
        this.ctx.moveTo( 0, this.edges[1]-4 ) ;
        this.ctx.lineTo( this.canW, this.edges[1]-4 ) ;
        this.ctx.stroke() ;
        this.ctx.strokeStyle = "white" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( 0, this.edges[1]-1 ) ;
        this.ctx.lineTo( this.W, this.edges[1]-1 ) ;
        this.ctx.stroke() ;
        this.ctx.beginPath() ;
        this.ctx.arc( this.ball[1], this.edges[1], this.radii, 3*quart, 7*quart )
        this.ctx.arc( this.ball[1], this.edges[1], this.radii-5, 3*quart, 7*quart )
        this.ctx.stroke() ;
        
        this.ctx.strokeStyle = (3 == this.active_edge) ? "yellow" : "black" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( 0, this.edges[3] ) ;
        this.ctx.lineTo( this.canW, this.edges[3] ) ;
        this.ctx.moveTo( 0, this.edges[3]+2 ) ;
        this.ctx.lineTo( this.canW, this.edges[3]+2 ) ;
        this.ctx.moveTo( 0, this.edges[3]+4 ) ;
        this.ctx.lineTo( this.canW, this.edges[3]+4 ) ;
        this.ctx.stroke() ;
        this.ctx.strokeStyle = "white" ;
        this.ctx.beginPath() ;
        this.ctx.moveTo( 0, this.edges[3]+1 ) ;
        this.ctx.lineTo( this.W, this.edges[3]+1 ) ;
        this.ctx.stroke() ;
        this.ctx.beginPath() ;
        this.ctx.arc( this.ball[3], this.edges[3], this.radii, quart, 5*quart )
        this.ctx.arc( this.ball[3], this.edges[3], this.radii-5, quart, 5*quart )
        this.ctx.stroke() ;
    }       

    getXY_t(e) {
        if ( e.targetTouches.length > 0 ) {
            return this.getXY( e.targetTouches[0] ) ;
        }
        return null ;
    }
    
    getXY( e ) {
        return [
            (e.clientX - this.boundX) * this.ratioX,
            (e.clientY - this.boundY) * this.ratioY 
            ] ;
    }
    
    find_edge( x, y) {
        const r2 = this.radii**2 ;
		if ( (x-this.edges[0])**2 + (y-this.ball[0])**2 <= r2 ) {
			return 0 ;
		}
		if ( (x-this.edges[2])**2 + (y-this.ball[2])**2 <= r2 ) {
			return 2 ;
		}
		if ( (x-this.ball[1])**2 + (y-this.edges[1])**2 <= r2 ) {
			return 1 ;
		}
		if ( (x-this.ball[3])**2 + (y-this.edges[3])**2 <= r2 ) {
			return 3 ;
		}
        if ( x < this.edges[0]-this.blur ) {
            return this.find_edgeY( y ) ;
        } else if ( x > this.edges[2]+this.blur ) {
            return this.find_edgeY( y ) ;
        } else if ( x <= this.edges[0] ) {
            return 0 ;
        } else if ( x >= this.edges[2]-this.blur ) {
            return 2 ;
        } else if ( x <= this.edges[0]+this.blur ) {
            return 0 ;
        }
        return this.find_edgeY( y ) ;
    }
    
    find_edgeY( y ) {
        if ( y < this.edges[1]-this.blur ) {
            return null ;
        } else if ( y > this.edges[3]+this.blur ) {
            return null ;
        } else if ( y <= this.edges[1] ) {
            return 1 ;
        } else if ( y >= this.edges[3]-this.blur ) {
            return 3 ;
        } else if ( y <= this.edges[1]+this.blur ) {
            return 1 ;
        }
        return null ;
    }
    
    undrag() {
        this.active_edge = null ;
        this.showEdges() ;
    }
    
    start_drag_t(e) {
        if ( e.targetTouches.length > 0 ) {
            this.start_drag( e.targetTouches[0] ) ;
        } else {
            this.undrag() ;
        }
    }
    
    start_drag( e ) {
        const xy = this.getXY(e) ;
        if ( xy == null ) {
            this.undrag() ;
            return ;
        }
        
        this.active_edge = this.find_edge( xy[0], xy[1] ) ;
        this.showEdges() ;
    }
    
    drag_t(e) {
        if ( e.targetTouches.length > 0 ) {
            this.drag( e.targetTouches[0] ) ;
        } else {
            this.undrag() ;
        }
    }
    
    drag_m(e) {
        if ( e.buttons & 1 == 1 ) {
            this.drag(e) ;
        } else {
            this.undrag() ;
        } 
    }

    drag(e) {
        const xy = this.getXY(e) ;
        if ( xy == null ) {
            this.undrag() ;
            return ;
        }
        
        switch( this.active_edge ) {
            case null:
                this.start_drag(e) ;
                return ;
            case 0:
                this.edges[0] = xy[0] ;
                break ;
            case 1:
                this.edges[1] = xy[1] ;
                break ;
            case 2:
                this.edges[2] = xy[0] ;
                break ;
            case 3:
                this.edges[3] = xy[1] ;
                break ;
        }
        this.testEdges() ;
    }
    
    cancel() {
		// Hide Crop Screen and go back to full edit list
		// Called from all Crop buttons 
        this.show(false);
        document.getElementById("replot").click() ; // hidden button to replot
    }

    full() {
		this.cropentry.new_val = [ 0, 0, this.natW, this.natH ] ;
        this.cancel(); // to clean up
    }
    
    ok() {
        this.cropentry.new_val = [
			this.edges[0] * this.natW / this.W ,
			this.edges[1] * this.natH / this.H ,
			(this.edges[2]-this.edges[0]) * this.natW / this.W ,
			(this.edges[3]-this.edges[1]) * this.natH / this.H ,
        ];
        this.cancel(); // to clean up
    }
    
    show(state) {
        document.getElementById("crop_page").style.display=state ? "block" : "none" ;
        if ( state ) {
            this.observer.observe( this.canvas) ;
        } else {
            this.observer.unobserve( this.canvas) ;
        }
    }
        
}

objectCrop = new Crop() ;
