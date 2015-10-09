/*jslint */
/*global AdobeEdge: false, window: false, document: false, console:false, alert: false */
(function (compId) {

    "use strict";
    var im='images/',
        aud='media/',
        vid='media/',
        js='js/',
        fonts = {
        },
        opts = {
            'gAudioPreloadPreference': 'auto',
            'gVideoPreloadPreference': 'auto'
        },
        resources = [
        ],
        scripts = [
        ],
        symbols = {
            "stage": {
                version: "6.0.0",
                minimumCompatibleVersion: "5.0.0",
                build: "6.0.0.400",
                scaleToFit: "none",
                centerStage: "none",
                resizeInstances: false,
                content: {
                    dom: [
                        {
                            id: 'background',
                            type: 'image',
                            rect: ['0px', '-10px', '1024px', '782px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"background.svg",'0px','0px']
                        },
                        {
                            id: 'Text2',
                            type: 'text',
                            rect: ['83', '594', 'auto', 'auto', 'auto', 'auto'],
                            text: "<p style=\"margin: 0px;\">​</p>",
                            align: "left",
                            font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                            textStyle: ["", "", "", "", "none"]
                        },
                        {
                            id: 'curiousGroup',
                            type: 'group',
                            rect: ['230', '434', '128', '181', 'auto', 'auto'],
                            opacity: '0',
                            c: [
                            {
                                id: 'curiousText',
                                type: 'text',
                                rect: ['28px', '139px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​好奇</p>",
                                align: "left",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                                textStyle: ["", "", "", "", "none"]
                            },
                            {
                                id: 'curious',
                                type: 'image',
                                rect: ['0px', '0px', '128px', '128px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"curious.png",'0px','0px']
                            }]
                        },
                        {
                            id: 'eagerGroup',
                            type: 'group',
                            rect: ['362', '434', '128', '181', 'auto', 'auto'],
                            opacity: '0',
                            c: [
                            {
                                id: 'eagerText',
                                type: 'text',
                                rect: ['28px', '139px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​期待</p>",
                                align: "left",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                                textStyle: ["", "", "", "", "none"]
                            },
                            {
                                id: 'eager',
                                type: 'image',
                                rect: ['0px', '0px', '128px', '128px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"eager.png",'0px','0px']
                            }]
                        },
                        {
                            id: 'happyGroup',
                            type: 'group',
                            rect: ['492', '434', '128', '181', 'auto', 'auto'],
                            opacity: '0',
                            c: [
                            {
                                id: 'happyText',
                                type: 'text',
                                rect: ['28px', '139px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​高兴</p>",
                                align: "left",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                                textStyle: ["", "", "", "", "none"]
                            },
                            {
                                id: 'happy',
                                type: 'image',
                                rect: ['0px', '0px', '128px', '128px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"happy.png",'0px','0px']
                            }]
                        },
                        {
                            id: 'worryGroup',
                            type: 'group',
                            rect: ['635', '434', '128', '181', 'auto', 'auto'],
                            opacity: '0',
                            c: [
                            {
                                id: 'worryText',
                                type: 'text',
                                rect: ['28px', '139px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​担心</p>",
                                align: "left",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                                textStyle: ["", "", "", "", "none"]
                            },
                            {
                                id: 'worry',
                                type: 'image',
                                rect: ['0px', '0px', '128px', '128px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"worry.png",'0px','0px']
                            }]
                        },
                        {
                            id: 'anxiousGroup',
                            type: 'group',
                            rect: ['103', '434', '128', '181', 'auto', 'auto'],
                            opacity: '0',
                            c: [
                            {
                                id: 'anxiousText',
                                type: 'text',
                                rect: ['28px', '139px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​<span style=\"color: rgb(102, 153, 51);\">​</span>紧张</p>",
                                align: "left",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1)", "600", "none", "normal", "break-word", "nowrap"],
                                textStyle: ["", "", "", "", "none"]
                            },
                            {
                                id: 'anxious',
                                type: 'image',
                                rect: ['0px', '0px', '128px', '128px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"anxious.png",'0px','0px']
                            }]
                        },
                        {
                            id: 'jill',
                            type: 'image',
                            rect: ['791px', '328px', '158px', '430px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"jill.png",'0px','0px']
                        },
                        {
                            id: 'eye',
                            type: 'image',
                            rect: ['830px', '381px', '80px', '31px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"eye.png",'0px','0px']
                        },
                        {
                            id: 'smile',
                            type: 'image',
                            rect: ['853px', '424px', '30px', '20px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"smile.png",'0px','0px']
                        },
                        {
                            id: 'left-hand',
                            type: 'image',
                            rect: ['784px', '456px', '50px', '79px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"left-hand.png",'0px','0px']
                        },
                        {
                            id: 'right-hand',
                            type: 'image',
                            rect: ['903px', '454px', '50px', '78px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"right-hand.png",'0px','0px']
                        },
                        {
                            id: 'QuestionGroup',
                            type: 'group',
                            rect: ['584px', '342px', '500', '183', 'auto', 'auto'],
                            opacity: '0',
                            transform: [[],[],[],['0.05','0.05']],
                            c: [
                            {
                                id: 'box',
                                type: 'image',
                                rect: ['0px', '0px', '500px', '183px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"box.png",'0px','0px']
                            },
                            {
                                id: 'Text',
                                type: 'text',
                                rect: ['70px', '50px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​请选择能够反映你入学</p><p style=\"margin: 0px;\">​时心情的表情</p>",
                                font: ['Arial, Helvetica, sans-serif', [36, "px"], "rgba(85,85,85,1.00)", "600", "none", "", "break-word", "nowrap"]
                            }]
                        }
                    ],
                    style: {
                        '${Stage}': {
                            isStage: true,
                            rect: ['null', 'null', '1024px', '768px', 'auto', 'auto'],
                            overflow: 'hidden',
                            fill: ["rgba(255,255,255,1)"]
                        }
                    }
                },
                timeline: {
                    duration: 1000,
                    autoPlay: true,
                    data: [
                        [
                            "eid50",
                            "left",
                            0,
                            1000,
                            "linear",
                            "${QuestionGroup}",
                            '584px',
                            '159px'
                        ],
                        [
                            "eid70",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid80",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid99",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0deg',
                            '180deg'
                        ],
                        [
                            "eid94",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '180deg',
                            '360deg'
                        ],
                        [
                            "eid116",
                            "opacity",
                            0,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0',
                            '0.5'
                        ],
                        [
                            "eid126",
                            "opacity",
                            500,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid67",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid77",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid114",
                            "opacity",
                            0,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0',
                            '0.5'
                        ],
                        [
                            "eid124",
                            "opacity",
                            500,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid47",
                            "scaleX",
                            0,
                            1000,
                            "linear",
                            "${QuestionGroup}",
                            '0.05',
                            '1'
                        ],
                        [
                            "eid115",
                            "opacity",
                            0,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0',
                            '0.5'
                        ],
                        [
                            "eid125",
                            "opacity",
                            500,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid98",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0deg',
                            '180deg'
                        ],
                        [
                            "eid93",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${happyGroup}",
                            '180deg',
                            '360deg'
                        ],
                        [
                            "eid101",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0deg',
                            '180deg'
                        ],
                        [
                            "eid96",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '180deg',
                            '360deg'
                        ],
                        [
                            "eid73",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid83",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid71",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid81",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid74",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid84",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid69",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid79",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid113",
                            "opacity",
                            0,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0',
                            '0.5'
                        ],
                        [
                            "eid123",
                            "opacity",
                            500,
                            500,
                            "linear",
                            "${happyGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid100",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${worryGroup}",
                            '0deg',
                            '180deg'
                        ],
                        [
                            "eid95",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${worryGroup}",
                            '180deg',
                            '360deg'
                        ],
                        [
                            "eid76",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid86",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid112",
                            "opacity",
                            0,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0',
                            '0.5'
                        ],
                        [
                            "eid122",
                            "opacity",
                            500,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid51",
                            "top",
                            0,
                            1000,
                            "linear",
                            "${QuestionGroup}",
                            '342px',
                            '170px'
                        ],
                        [
                            "eid68",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid78",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid49",
                            "opacity",
                            0,
                            1000,
                            "linear",
                            "${QuestionGroup}",
                            '0',
                            '1'
                        ],
                        [
                            "eid97",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '0deg',
                            '180deg'
                        ],
                        [
                            "eid92",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${anxiousGroup}",
                            '180deg',
                            '360deg'
                        ],
                        [
                            "eid48",
                            "scaleY",
                            0,
                            1000,
                            "linear",
                            "${QuestionGroup}",
                            '0.05',
                            '1'
                        ],
                        [
                            "eid75",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid85",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${eagerGroup}",
                            '0.5',
                            '1'
                        ],
                        [
                            "eid72",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0.05',
                            '0.5'
                        ],
                        [
                            "eid82",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${curiousGroup}",
                            '0.5',
                            '1'
                        ]
                    ]
                }
            }
        };

    AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts);

    if (!window.edge_authoring_mode) AdobeEdge.getComposition(compId).load("index_edgeActions.js");
})("EDGE-14201750");
