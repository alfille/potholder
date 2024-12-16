/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

class Crop {
	constructor() {
		// canvas and context
		this.background() ;
        this.canvas = document.getElementById("crop_canvas");
        this.ctx = this.canvas.getContext( "2d" ) ;
        console.log("Canvas WH:",this.canvas.width,this.canvas.height);
        
        // bounding box precalculations box 
        const bounding = this.canvas.getBoundingClientRect() ;
		this.boundX = bounding.left ;
		this.boundY = bounding.top ;
		this.ratioX = this.canvas.width / bounding.width ;
		this.ratioY = this.canvas.height / bounding.height ;
        
        // edge blur (1/2 width for easier clicking
        this.blur = 10 ; 
        
        // edges [left,top,right,bottom]
        this.active_edge = null ;

        // Load Image
        this.image = document.getElementById( "crop_image" ) ;
        this.image.onload = this.startCrop() ;
	}
	
	startCrop() {
        // only started after image load
        this.startBounds( 0,0,this.image.width,this.image.height ) ;
        
        // handlers
        this.canvas.ontouchstart = (e) => this.start_drag_t(e);
        this.canvas.ontouchmove  = (e) => this.drag_t(e);
        this.canvas.ontouchend   = (e) => this.undrag();
        this.canvas.onmousedown  = (e) => this.start_drag(e);
        this.canvas.onmousemove  = (e) => this.drag_m(e);
        this.canvas.onmouseup    = (e) => this.undrag();
        this.canvas.oncontextmenu= (e) => e.preventDefault() ;
    }
    
    background() {
		const under = document.getElementById("under_canvas") ;
		const ctx = under.getContext("2d");
		ctx.fillStyle = "lightgray" ;
		ctx.fillRect(0,0,under.width,under.height) ;
		ctx.strokeStyle = "white" ;
		ctx.lineWidth = 1 ;
		const grd = 10 ; // grid size
		for ( let i = grd; i <= under.width ; i += grd ) {
			// grid
			ctx.beginPath() ;
			ctx.moveTo( i,0 ) ;
			ctx.lineTo( i,under.height ) ;
			ctx.stroke() ;
		}
		for ( let i = grd; i <= under.height ; i += grd ) {
			// grid
			ctx.beginPath() ;
			ctx.moveTo( 0,i ) ;
			ctx.lineTo( under.width,i ) ;
			ctx.stroke() ;
		}
	}
	
	startBounds( left,top,right,bottom ) {
		this.edges=[left,top,right,bottom];
		this.setBounds() ;
	}
	
	setBounds() {
		if ( this.edges[0] < 0 ) {
			this.edges[0] = 0 ;
		}
		if ( this.edges[1] < 0 ) {
			this.edges[1] = 0 ;
		}
		if ( this.edges[2] >= this.image.width ) {
			this.edges[2] = this.image.width-1 ;
		}
		if ( this.edges[3] >= this.image.height ) {
			this.edges[3] = this.image.height-1 ;
		}
		if ( this.edges[0] > this.edges[2] ) {
			this.edges[0] = this.edges[2] ;
		}
		if ( this.edges[1] > this.edges[3] ) {
			this.edges[1] = this.edges[3] ;
		}
		this.showBounds() ;
	}
	
	showBounds() {
		this.ctx.clearRect(0,0,this.image.width,this.image.height);
		
		this.ctx.fillStyle = `rgba( 23,43,174,0.3 )` ; // big shadow
		this.ctx.fillRect( 0,0,this.edges[0],this.image.height ) ; // left
		this.ctx.fillRect( this.edges[2],0,this.image.width-this.edges[0],this.image.height ) ; // right
		this.ctx.fillRect( 0,0,this.image.width, this.edges[1] ) ; // top
		this.ctx.fillRect( 0,this.edges[3],this.image.width,this.image.height-this.edges[3] ) ; // bottom
		
		this.ctx.strokeStyle = (0 == this.active_edge) ? "yellow" : "black" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( this.edges[0],0 ) ;
		this.ctx.lineTo( this.edges[0], this.image.height ) ;
		this.ctx.moveTo( this.edges[0]-2,0 ) ;
		this.ctx.lineTo( this.edges[0]-2, this.image.height ) ;
		this.ctx.moveTo( this.edges[0]-4,0 ) ;
		this.ctx.lineTo( this.edges[0]-4, this.image.height ) ;
		this.ctx.stroke() ;
		this.ctx.strokeStyle = "white" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( this.edges[0]-1,0 ) ;
		this.ctx.lineTo( this.edges[0]-1, this.image.height ) ;
		this.ctx.stroke() ;
		
		this.ctx.strokeStyle = (2 == this.active_edge) ? "yellow" : "black" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( this.edges[2],0 ) ;
		this.ctx.lineTo( this.edges[2], this.image.height ) ;
		this.ctx.moveTo( this.edges[2]+2,0 ) ;
		this.ctx.lineTo( this.edges[2]+2, this.image.height ) ;
		this.ctx.moveTo( this.edges[2]+4,0 ) ;
		this.ctx.lineTo( this.edges[2]+4, this.image.height ) ;
		this.ctx.stroke() ;
		this.ctx.strokeStyle = "white" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( this.edges[2]+1,0 ) ;
		this.ctx.lineTo( this.edges[2]+1, this.image.height ) ;
		this.ctx.stroke() ;
		
		this.ctx.strokeStyle = (1 == this.active_edge) ? "yellow" : "black" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( 0, this.edges[1] ) ;
		this.ctx.lineTo( this.image.width, this.edges[1] ) ;
		this.ctx.moveTo( 0, this.edges[1]-2 ) ;
		this.ctx.lineTo( this.image.width, this.edges[1]-2 ) ;
		this.ctx.moveTo( 0, this.edges[1]-4 ) ;
		this.ctx.lineTo( this.image.width, this.edges[1]-4 ) ;
		this.ctx.stroke() ;
		this.ctx.strokeStyle = "white" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( 0, this.edges[1]-1 ) ;
		this.ctx.lineTo( this.image.width, this.edges[1]-1 ) ;
		this.ctx.stroke() ;
		
		this.ctx.strokeStyle = (3 == this.active_edge) ? "yellow" : "black" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( 0, this.edges[3] ) ;
		this.ctx.lineTo( this.image.width, this.edges[3] ) ;
		this.ctx.moveTo( 0, this.edges[3]+2 ) ;
		this.ctx.lineTo( this.image.width, this.edges[3]+2 ) ;
		this.ctx.moveTo( 0, this.edges[3]+4 ) ;
		this.ctx.lineTo( this.image.width, this.edges[3]+4 ) ;
		this.ctx.stroke() ;
		this.ctx.strokeStyle = "white" ;
		this.ctx.beginPath() ;
		this.ctx.moveTo( 0, this.edges[3]+1 ) ;
		this.ctx.lineTo( this.image.width, this.edges[3]+1 ) ;
		this.ctx.stroke() ;
	}		

	getXY_t(e) {
		if ( e.targetTouches.length > 0 ) {
			return this.getXY( e.targetTouches[0] ) ;
		}
		return null ;
	}
	
	getXY( e ) {
		console.log("X",e.clientX,e.clientY);
		return [
			(e.clientX - this.boundX) * this.ratioX,
			(e.clientY - this.boundY) * this.ratioY 
			] ;
	}
	
	find_edge( x, y) {
		console.log( "find",x,y) ;
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
		this.showBounds() ;
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
		console.log("startdrag",xy);
		if ( xy == null ) {
			this.undrag() ;
			return ;
		}
		
		this.active_edge = this.find_edge( xy[0], xy[1] ) ;
		console.log("Found",this.active_edge);
		this.showBounds() ;
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
		console.log("drag",xy,"button",e.buttons);
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
		this.setBounds() ;
	}
	
	full() {
		console.log("full") ;
	}
	
	ok() {
		console.log( [
		this.edges[0] * this.image.naturalWidth / this.image.width ,
		this.edges[1] * this.image.naturalHeight / this.image.height ,
		this.edges[2] * this.image.naturalWidth / this.image.width ,
		this.edges[3] * this.image.naturalHeight / this.image.height ,
		]);
	}
}

// Application starting point
window.onload = () => {
	globalThis.objectCrop = new Crop() ;
} 
