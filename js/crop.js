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
    
export class Crop {
    constructor() {
        // canvas and context
        this.under = document.getElementById("under_canvas") ;
        this.underctx = this.under.getContext("2d");
        //this.image = document.getElementById( "crop_image" ) ;
        this.canvas = document.getElementById("crop_canvas");
        this.ctx = this.canvas.getContext( "2d" ) ;
        
        // edge blur (1/2 width for easier clicking
        this.blur = 10 ; 
        
        // edges [left,top,right,bottom]
        this.active_edge = null ;
        
        this.observer = new ResizeObserver( _ => this.cacheBounds() ) ;
    }

    crop( entrylist ) {
        this.entrylist = entrylist ; // entry list holds image
        const imageentry = entrylist.members.find( m => m.struct.type == "image" ) ;
        const cropentry = entrylist.members.find( m => m.struct.type == "crop" ) ;
        console.log("entrylist",entrylist);
        console.log("imageentry",imageentry);
        console.log("cropentry",cropentry);
        if ( imageentry == null ) {
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
                this.canW = window.innerWidth ;
                this.canH = 600 ;
                this.H = this.canH ;
                // max size preseve aspect
                this.W = this.natW * this.H / this.natH ;
                if ( this.W > this.canW ) {
                    this.W = this.canW ;
                    this.H = this.natH * this.W / this.natW ;
                }
                this.under.width = this.canW ;
                this.canvas.width = this.canW ;
                this.under.height = this.canH ;
                this.canvas.height = this.canH ; 
                this.background() ;
                // show scaled image
                this.underctx.drawImage( image, 0, 0, this.W, this.H ) ;

                // only started after image load
                this.startEdges( 0,0,this.W,this.H ) ;
                
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
    
    startEdges( left,top,right,bottom ) {
        this.edges=[left,top,right,bottom];
        this.testEdges() ;
    }
    
    testEdges() {
        if ( this.edges[0] < 0 ) {
            this.edges[0] = 0 ;
        }
        if ( this.edges[1] < 0 ) {
            this.edges[1] = 0 ;
        }
        if ( this.edges[2] >= this.W ) {
            this.edges[2] = this.W-1 ;
        }
        if ( this.edges[3] >= this.H ) {
            this.edges[3] = this.H-1 ;
        }
        if ( this.edges[0] > this.edges[2] ) {
            this.edges[0] = this.edges[2] ;
        }
        if ( this.edges[1] > this.edges[3] ) {
            this.edges[1] = this.edges[3] ;
        }
        this.showEdges() ;
    }
    
    showEdges() {
        this.ctx.clearRect(0,0,this.canW,this.canH);
        
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
        this.show(false);
    }

    full() {
        this.show(false);
    }
    
    ok() {
        const ret = [
        this.edges[0] * this.natW / this.W ,
        this.edges[1] * this.natH / this.H ,
        this.edges[2] * this.natW / this.W ,
        this.edges[3] * this.natH / this.H ,
        ];
        this.show(false);
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
