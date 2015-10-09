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
                            rect: ['-254px', '-40px', '1303px', '855px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"background.png",'0px','0px']
                        },
                        {
                            id: 'grassland',
                            type: 'image',
                            rect: ['-27px', '664px', '1057px', '119px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"grassland.png",'0px','0px']
                        },
                        {
                            id: 'subTitleGroup1',
                            type: 'group',
                            rect: ['100px', '209px', '360', '148', 'auto', 'auto'],
                            c: [
                            {
                                id: 'subTitleBg1',
                                type: 'image',
                                rect: ['0px', '0px', '360px', '148px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"title.png",'0px','0px']
                            },
                            {
                                id: 'subTitle1',
                                type: 'text',
                                rect: ['45px', '48px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​你准备好了吗</p>",
                                font: ['Arial, Helvetica, sans-serif', [45, "px"], "rgba(85,85,85,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'subTitleGroup3',
                            type: 'group',
                            rect: ['564px', '209px', '360', '148', 'auto', 'auto'],
                            c: [
                            {
                                id: 'subTitleBg3',
                                type: 'image',
                                rect: ['0px', '0px', '360px', '148px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"title.png",'0px','0px']
                            },
                            {
                                id: 'subTitle3',
                                type: 'text',
                                rect: ['68px', '48px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">我的自画像</p>",
                                font: ['Arial, Helvetica, sans-serif', [45, "px"], "rgba(85,85,85,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'subTitleGroup4',
                            type: 'group',
                            rect: ['564px', '397px', '360', '148', 'auto', 'auto'],
                            c: [
                            {
                                id: 'subTitleBg4',
                                type: 'image',
                                rect: ['0px', '0px', '360px', '148px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"title.png",'0px','0px']
                            },
                            {
                                id: 'subTitle4',
                                type: 'text',
                                rect: ['67px', '48px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">快乐百分百</p>",
                                font: ['Arial, Helvetica, sans-serif', [45, "px"], "rgba(85,85,85,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'subTitleGroup2',
                            type: 'group',
                            rect: ['100px', '397px', '360', '148', 'auto', 'auto'],
                            c: [
                            {
                                id: 'subTitleBg2',
                                type: 'image',
                                rect: ['0px', '0px', '360px', '148px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"title.png",'0px','0px']
                            },
                            {
                                id: 'subTitle2',
                                type: 'text',
                                rect: ['67px', '48px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">我是小学生</p>",
                                font: ['Arial, Helvetica, sans-serif', [45, "px"], "rgba(85,85,85,1.00)", "900", "none", "", "break-word", "nowrap"]
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
                    duration: 2000,
                    autoPlay: true,
                    data: [
                        [
                            "eid9",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '0deg',
                            '-5deg'
                        ],
                        [
                            "eid15",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '-5deg',
                            '0deg'
                        ],
                        [
                            "eid16",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '0deg',
                            '5deg'
                        ],
                        [
                            "eid23",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '5deg',
                            '0deg'
                        ],
                        [
                            "eid56",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid32",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid40",
                            "scaleX",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid48",
                            "scaleX",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid57",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid33",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid41",
                            "scaleY",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid49",
                            "scaleY",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid11",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '0deg',
                            '-5deg'
                        ],
                        [
                            "eid12",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '-5deg',
                            '0deg'
                        ],
                        [
                            "eid19",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '0deg',
                            '5deg'
                        ],
                        [
                            "eid20",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup2}",
                            '5deg',
                            '0deg'
                        ],
                        [
                            "eid62",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid44",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid46",
                            "scaleX",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid54",
                            "scaleX",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid5",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '0deg',
                            '-5deg'
                        ],
                        [
                            "eid14",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '-5deg',
                            '0deg'
                        ],
                        [
                            "eid17",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '0deg',
                            '5deg'
                        ],
                        [
                            "eid22",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '5deg',
                            '0deg'
                        ],
                        [
                            "eid63",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid45",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid47",
                            "scaleY",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid55",
                            "scaleY",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup1}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid10",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '0deg',
                            '-5deg'
                        ],
                        [
                            "eid13",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '-5deg',
                            '0deg'
                        ],
                        [
                            "eid18",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '0deg',
                            '5deg'
                        ],
                        [
                            "eid21",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '5deg',
                            '0deg'
                        ],
                        [
                            "eid58",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid34",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid42",
                            "scaleX",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid50",
                            "scaleX",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid59",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid35",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid43",
                            "scaleY",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid51",
                            "scaleY",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup4}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid60",
                            "scaleX",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid36",
                            "scaleX",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid38",
                            "scaleX",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid52",
                            "scaleX",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid61",
                            "scaleY",
                            0,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid37",
                            "scaleY",
                            500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid39",
                            "scaleY",
                            1000,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid53",
                            "scaleY",
                            1500,
                            500,
                            "linear",
                            "${subTitleGroup3}",
                            '1.05',
                            '1'
                        ]
                    ]
                }
            }
        };

    AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts);

    if (!window.edge_authoring_mode) AdobeEdge.getComposition(compId).load("index_edgeActions.js");
})("EDGE-635559");
