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
                            id: 'sky',
                            type: 'image',
                            rect: ['0px', '-28px', '1024px', '874px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"sky.png",'0px','0px']
                        },
                        {
                            id: 'background',
                            type: 'image',
                            rect: ['0px', '-178px', '1024px', '952px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"background.png",'0px','0px']
                        },
                        {
                            id: 'mother',
                            type: 'image',
                            rect: ['144px', '364px', '163px', '417px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"mother.png",'0px','0px']
                        },
                        {
                            id: 'boy',
                            type: 'image',
                            rect: ['736px', '480px', '173px', '294px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"boy.png",'0px','0px']
                        },
                        {
                            id: 'boy-eye',
                            type: 'image',
                            rect: ['804px', '524px', '55px', '29px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"boy-eye.png",'0px','0px']
                        },
                        {
                            id: 'boy-mouth',
                            type: 'image',
                            rect: ['815px', '570px', '22px', '6px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"boy-mouth.png",'0px','0px']
                        },
                        {
                            id: 'mother-eye',
                            type: 'image',
                            rect: ['225px', '422px', '51px', '27px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"mother-eye.png",'0px','0px']
                        },
                        {
                            id: 'mother-close-mouth',
                            type: 'image',
                            rect: ['235px', '468px', '26px', '7px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"mother-close-mouth.png",'0px','0px']
                        },
                        {
                            id: 'mother-open-mouth',
                            type: 'image',
                            rect: ['237px', '467px', '28px', '15px', 'auto', 'auto'],
                            opacity: '0',
                            fill: ["rgba(0,0,0,0)",im+"mother-open-mouth.png",'0px','0px']
                        },
                        {
                            id: 'wordGroup',
                            type: 'group',
                            rect: ['352px', '216px', '600', '220', 'auto', 'auto'],
                            opacity: '0',
                            transform: [[],[],[],['0.05','0.05']],
                            c: [
                            {
                                id: 'box',
                                type: 'image',
                                rect: ['0px', '0px', '600px', '220px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"box.png",'0px','0px']
                            },
                            {
                                id: 'word',
                                type: 'text',
                                rect: ['132px', '65px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​你马上成为小学生了, </p><p style=\"margin: 0px;\">准备好了吗?</p>",
                                font: ['Arial, Helvetica, sans-serif', [40, "px"], "rgba(85,85,85,1.00)", "900", "none", "", "break-word", "nowrap"]
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
                            "eid2",
                            "opacity",
                            0,
                            0,
                            "linear",
                            "${mother-open-mouth}",
                            '0.000000',
                            '0.000000'
                        ],
                        [
                            "eid3",
                            "opacity",
                            250,
                            0,
                            "linear",
                            "${mother-open-mouth}",
                            '0.000000',
                            '1'
                        ],
                        [
                            "eid4",
                            "opacity",
                            500,
                            0,
                            "linear",
                            "${mother-open-mouth}",
                            '1',
                            '0.000000'
                        ],
                        [
                            "eid5",
                            "opacity",
                            750,
                            0,
                            "linear",
                            "${mother-open-mouth}",
                            '0.000000',
                            '1'
                        ],
                        [
                            "eid6",
                            "opacity",
                            1000,
                            0,
                            "linear",
                            "${mother-open-mouth}",
                            '1',
                            '0'
                        ],
                        [
                            "eid15",
                            "scaleY",
                            0,
                            1000,
                            "linear",
                            "${wordGroup}",
                            '0.05',
                            '1'
                        ],
                        [
                            "eid17",
                            "top",
                            0,
                            1000,
                            "linear",
                            "${wordGroup}",
                            '345px',
                            '216px'
                        ],
                        [
                            "eid18",
                            "left",
                            0,
                            1000,
                            "linear",
                            "${wordGroup}",
                            '54px',
                            '352px'
                        ],
                        [
                            "eid14",
                            "scaleX",
                            0,
                            1000,
                            "linear",
                            "${wordGroup}",
                            '0.05',
                            '1'
                        ],
                        [
                            "eid16",
                            "opacity",
                            0,
                            1000,
                            "linear",
                            "${wordGroup}",
                            '0',
                            '1'
                        ]
                    ]
                }
            }
        };

    AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts);

    if (!window.edge_authoring_mode) AdobeEdge.getComposition(compId).load("index_edgeActions.js");
})("EDGE-14551220");
