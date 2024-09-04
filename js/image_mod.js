/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */
 
export {
	PotImages,
} ;

class PotImages {
	static srcList = [] ;
	
	constructor( doc ) {
		// Clear existing Images in memory
		PotImages.srcList.forEach( s => URL.revokeObjectURL(s) );
		PotImages.srcList=[] ;
		
		this.doc = doc;
		
		this.Imap = new Map() ;
		if ( "_attachments" in doc ) {
			Object.entries( doc._attachments ).forEach( ([k,v]) => {
				console.log("ObURL",k,v);
				let s=URL.createObjectURL(v.data);
				console.log("SRC",s);
				this.Imap.set(k,s);
				PotImages.srcList.push(s);
				});
		}
	}	
	
	number() {
		return this.Imap.size;
	}
	
	getByName(name) {
		return this.Imap.get(name)??null;
	}
	
	delByName(name) {
		// srcList corrected later
		this.Imap.delete(name);
	}
	
	exists(name) {
		return this.Imap.has(name) ;
	}
	
    display( name ) {
		const img = document.createElement( "img" ) ;
		img.src=this.Imap.get(name) ;
		img.classList.add("small_pic");
		img.onclick=()=>{
			document.getElementById("modal_img").src=img.src;
			document.getElementById("modal_caption").innerText=this.doc.images.find(e=>e.image==name).comment;
			document.getElementById("modal_id").style.display="block";
		}
		return img ;
	}
		
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
}
