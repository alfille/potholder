/* eMission project
 * Medical mission database application
 * See https://github.com/alfille/eMission
 * or https://emissionsystem.org
 * by Paul H Alfille 2023
 * MIT license
 * */

"use strict";

/* jshint esversion: 11 */

// used to generate data entry pages "PotData" type

export const structNewPot = [
    {
        name:  "type",
        alias: "Type of piece",
        hint:  "What will the piece be used for?",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "series",
        alias: "Series",    
        hint:  "Which creative wave?",
        type:  "list",
        query: "qSeries",
    },
    {
        name:  "start_date",
        alias: "Start date",
        type:  "date",
        hint:  "Date work started",
    },
    {
        name:  "artist",
        alias: "Artist",
        hint:  "Creator of this piece",
        type:  "list",
        query: "qArtist",
    },
    {
        name:  "general_comment",
        alias: "General comments",
        hint:  "Overall comments on piece",
        type:  "textarea",
    },
];
    
export const structGeneralPot = [
    {
        name:  "type",
        alias: "Type of piece",
        hint:  "What will the piece be used for?",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "series",
        alias: "Series",    
        hint:  "Which creative wave?",
        type:  "list",
        query: "qSeries",
    },
    {
        name: "location",
        hint: "Current location",
        type: "list",
        query: "qLocation",
    },
    {
        name:  "start_date",
        alias: "Start date",
        type:  "date",
        hint:  "Date work started",
    },
    {
        name:  "artist",
        alias: "Artist",
        hint:  "Creator of this piece",
        type:  "list",
        query: "qArtist",
    },
    {
        name:  "general_comment",
        alias: "General comments",
        hint:  "Overall comments on piece",
        type:  "textarea",
    },
];

export const structImages = [
    {
        name:  "images",
        alias: "Images",
        type:  "image_array",
        members: [
            {
                name:  "image",
                type:  "image",
            },
            {
                name:  "comment",
                alias: "Notes",
                hint:  "Notes about this photo",
                type:  "textarea",
            },
            {
                name:  "date",
                type:  "date",
                alias: "Date",
                hint:  "Date photo was taken",
            }
        ]
    }
];
        
export const structProcess = [
    {
        name:  "firing",
        alias: "Firing",
        hint:  "Type of firing",
        type:  "radio",
//        choices: ["greenware","bisque","oxidation","reduction","soda","raku","garbage","salt"],
        choices: ["greenware","bisque","oxidation","reduction","soda","raku",],
    },
    {
        name:  "weight_start",
        alias: "Starting weight",
        hint:  "Weight (in pounds) of the raw clay",
        type:  "text",
    },
    {
        name:  "weight_end",
        alias: "Final weight",
        hint:  "Weight (in pound) of the finished piece",
        type:  "text",
    },
    {
        name:  "construction",
        hint:  "techniques",
        type:  "checkbox",
        choices: ["wheel","slab","handbuilt","coil","pinch"],
    },
    {
        name:  "clay",
        alias: "Clays",
        type:  "array",
        members: [
            {
                name:  "type",
                alias: "Clay body",
                hint:  "Which clay type used?",
                type:  "list",
                query: "qClay",
            },
            {
                name:  "comment",
                hint:  "Clay comments",
                type:  "textarea",
            }
        ],
    },
    {
        name:  "glaze",
        alias: "Glazes",
        type:  "array",
        members: [
            {
                name:  "type",
                alias: "Glaze",
                type:  "list",
                query: "qGlaze",
            },
            {
                name:  "comment",
                alias: "Notes",
                type:  "textarea",
            }
        ],
    },
    {
        name: "kilns",
        type: "array",
        members: [
            {
                name: "kiln",
                hint: "Which kiln used?",
                type: "list",
                query: "qKiln",
            },
            {
                name: "cone",
                hint: "firing cone",
                type: "list",
                query: "qCone",
            },
            {
                name: "date",
                hint: "firing date",
                type: "date",
            },
            {
                name: "comment",
                hint: "Comments on firing",
                type: "textarea",
            },
        ],
    },
];

export const structRemoteUser = [
    {
        name: "username",
        hint: "Your user name for access",
        type: "text",
    },
    {
        name: "password",
        hint: "Your password for access",
        type: "text",
    },    
    {
        name: "address",
        alias: "Remote database server address",
        hint: "emissionsystem.org -- don't include database name",
        type: "text",
    },
    {
        name: "raw",
        alias: "  process address",
        hint: "Fix URL with protocol and port",
        type: "radio",
        choices: ["fixed","raw"],
    },
    {
        name: "database",
        hint: 'Name of ceramic database (e.g. "potholder"',
        type: "text",
    },
];

export const structDatabaseInfo = [
    {
        name: "db_name",
        alias: "Database name",
        hint: "Name of underlying database",
        type: "text",
    },
    {
        name: "doc_count",
        alias: "Document count",
        hint: "Total number of undeleted documents",
        type: "number",
    },
    {
        name: "update_seq",
        hint: "Sequence number",
        type: "number",
    },
    {
        name: "adapter",
        alias: "Database adapter",
        hint: "Actual database type used",
        type: "text",
    },
    {
        name: "auto_compaction",
        alias: "Automatic compaction",
        hint: "Database compaction done automaticslly?",
        type: "text",
    },
];

