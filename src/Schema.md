# Schema

The database

| field | format | arity | Comment |searchable|
|--|--|--|---|-|
|id|date|1|for chronological display|no|
|name|text|1|freeform|yes|
|series|text|1|choice plus|yes|
|comments|text|1|freeform|yes||
|marking|text|1|choice plus|yes|
|firing type|radio|1|ox/red/soda/raku/garbage/none|yes|
|construction type|checkbox|1|wheel/slab/handbuilt/coil|yes|
|images|binary attachments|multi|Any supported image type||
|image-array|json|multi-link to "images"|list||
|-- comments|text|array entry|free form|yes|
|-- date|date|array entry|date|no|
|clay-array|json|multi|list||
|-- type|text|array entry|choice plus|yes|
|-- comment|text|array entry|freeform|yes|
|process-array|json|multi|list||
|-- step|text|array entry|choice plus|yes|
|-- date|date|array entry|date|no|
|stage|text|1|computed from "process"||
|glaze-array|json|multi|list||
|-- glaze|text|array entry|choice plus|yes|
|-- comment|text|array entry|freeform|yes|
|kiln-array|json|multi|list||
|-- type|text|array entry|choice plus|yes|
|-- date|date|array entry|date|no|
|-- comment|text|array entry|freeform|yes|
|location|text|1|choice plus|yes|
|dimensions|text|1|freeform|yes|
|weight|text|1|freeform|yes|
