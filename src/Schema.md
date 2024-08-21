# Schema

The database

|name| field | format | arity | Comment |searchable|
|--|--|--|--|---|-|
|_id|id|date|1|for chronological display|no|
|pot_name|name|text|1|freeform|yes|
|Series|series|text|1|choice plus|yes|
|type|item type|choice plus|1|pot/plate/bowl...|yes|
|general_comment|comments|text|1|freeform|yes||
|mark|marking|text|1|choice plus|yes|
|start_date|date|1|date|no|
|firing_type|firing type|radio|1|ox/red/soda/raku/garbage/none|yes|
|construction|construction type|checkbox|1|wheel/slab/handbuilt/coil|yes|
|photo|images|binary attachments|multi|Any supported image type||
|photo_desc|image-array|json|multi-link to "images"|list||
|photo_desc.comment|-- comments|text|array entry|free form|yes|
|photo_dec.date|-- date|date|array entry|date|no|
|clay|clay-array|json|multi|list||
|clay.type|-- type|text|array entry|choice plus|yes|
|clay.comment|-- comment|text|array entry|freeform|yes|
|process|process-array|json|multi|list||
|process.type|-- step|text|array entry|choice plus|yes|
|process.date|-- date|date|array entry|date|no|
|glaze|glaze-array|json|multi|list||
|glaze.type|-- glaze|text|array entry|choice plus|yes|
|glaze.comment|-- comment|text|array entry|freeform|yes|
|kiln|kiln-array|json|multi|list||
|kiln.type|-- type|text|array entry|choice plus|yes|
|kiln.date|-- date|date|array entry|date|no|
|kiln.comment|-- comment|text|array entry|freeform|yes|
|location|location|text|1|choice plus|yes|
|dimensions||dimensions|text|1|freeform|yes|
|weight|weight|text|1|freeform|yes|
