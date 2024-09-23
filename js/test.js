class base_value {
	constructor( struct, doc=null ) {
		this.struct = {} ;
		Object.assigm( this.struct, struct ) ;
		this.start_value = JSON.stringify(val) ;
		this.value = val ;
		this.changed = false ;
	}	

	destroy() {
	}
	
	name() {
		return this.struct.alias && this.struct.name ;
	}
	
	setVal(value) {
		this.value = value ;
	}
	
	getVal() {
		return this.value ;
	}
	
	changed() {
		return this.start_value == JSON.stringify(this.value ) ;
	}
	
	hint() {
		return this.struct.hint ?? "" ;
	}
}

class text extends base_value {
}	
	
