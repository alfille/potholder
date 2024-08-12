# ID

Couchdb (and Pouchdb) is ID-based, and strongly recommends using ID for function.

ID wll include: ";" separated
* version
* record type
* artist
* unique pot identifier (perhaps date/time)

Assumptions (not required)

* version only changes for incompatible records
  * **0** is initial version
* record type 
  * **p** piece
  * **d** depot pictures
* artist 
  * **artist** name
* Piece
  * use creation date/time +/- random # to be unique

