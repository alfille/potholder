/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

export {
	BlankBox,
	PotBox,
	StatBox,
	TextBox,
} ;

class TitleBox {
	show(html) {
		//console.log("TITLEBOX",html);
		document.getElementById( "titlebox" ).innerHTML = html ;
	}
}

class BlankBox extends TitleBox {
	constructor() {
		super();
		this.show("") ;
	}
}

class PotBox extends TitleBox {
	constructor( doc ) {
		super();
		this.show(`<button type="button" onClick='objectPage.show("PotMenu")'>${[doc?.type,"from",doc?.series,"by",doc?.artist,doc?.start_date].join(" ")}</button>` ) ;
	}
}

class TextBox extends TitleBox {
	constructor( text ) {
		super();
		this.show( `<B>${text}</B>` ) ;
	}
}

class StatBox extends TitleBox {
	constructor() {
		super();
		objectDatabase.db.query("qPictures", { reduce:true, group: false })
		.then( stat => this.show( `Pieces: ${stat.rows[0].value.count}, Pictures: ${stat.rows[0].value.sum}` ) )
		.catch( err => objectLog.err(err) );
	}
}
