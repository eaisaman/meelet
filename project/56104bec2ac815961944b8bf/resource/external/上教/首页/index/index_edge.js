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
                centerStage: "both",
                resizeInstances: false,
                content: {
                    dom: [
                        {
                            id: 'medow',
                            type: 'image',
                            rect: ['0px', '0px', '1024px', '768px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"medow.png",'0px','0px']
                        },
                        {
                            id: 'weed-left',
                            type: 'image',
                            rect: ['-24px', '116px', '512px', '218px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"weed-left.png",'0px','0px']
                        },
                        {
                            id: 'weed-right',
                            type: 'image',
                            rect: ['522px', '108px', '518px', '242px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"weed-right.png",'0px','0px']
                        },
                        {
                            id: 'leaf',
                            type: 'image',
                            rect: ['-42px', '239px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['-45']]
                        },
                        {
                            id: 'leaf2',
                            type: 'image',
                            rect: ['69px', '219px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['-37']]
                        },
                        {
                            id: 'leaf3',
                            type: 'image',
                            rect: ['179px', '207px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['-30']]
                        },
                        {
                            id: 'leaf4',
                            type: 'image',
                            rect: ['283px', '189px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['-20']]
                        },
                        {
                            id: 'leaf5',
                            type: 'image',
                            rect: ['376px', '175px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['-10']]
                        },
                        {
                            id: 'leaf11',
                            type: 'image',
                            rect: ['453px', '162px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px']
                        },
                        {
                            id: 'leaf6',
                            type: 'image',
                            rect: ['522px', '175px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px']
                        },
                        {
                            id: 'leaf7',
                            type: 'image',
                            rect: ['599px', '191px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['10']]
                        },
                        {
                            id: 'leaf8',
                            type: 'image',
                            rect: ['692px', '208px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['20']]
                        },
                        {
                            id: 'leaf9',
                            type: 'image',
                            rect: ['797px', '233px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['30']]
                        },
                        {
                            id: 'leaf10',
                            type: 'image',
                            rect: ['906px', '264px', '135px', '116px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"leaf.png",'0px','0px'],
                            transform: [[],['40']]
                        },
                        {
                            id: 'title4Group',
                            type: 'group',
                            rect: ['600px', '413px', '243', '155', 'auto', 'auto'],
                            transform: [[],['15']],
                            c: [
                            {
                                id: 'board4',
                                type: 'image',
                                rect: ['0px', '0px', '243px', '155px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"board.png",'0px','0px']
                            },
                            {
                                id: 'title4',
                                type: 'text',
                                rect: ['45px', '79px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​请牵我的手</p>",
                                font: ['Georgia, Times New Roman, Times, serif', [30, "px"], "rgba(255,255,255,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'title3Group',
                            type: 'group',
                            rect: ['162px', '416px', '243', '155', 'auto', 'auto'],
                            transform: [[],['-10']],
                            c: [
                            {
                                id: 'board3',
                                type: 'image',
                                rect: ['0px', '0px', '243px', '155px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"board.png",'0px','0px']
                            },
                            {
                                id: 'title3',
                                type: 'text',
                                rect: ['44px', '83px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​铃声叮咚响</p>",
                                font: ['Georgia, Times New Roman, Times, serif', [30, "px"], "rgba(255,255,255,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'title2Group',
                            type: 'group',
                            rect: ['600px', '247px', '243', '155', 'auto', 'auto'],
                            transform: [[],['5']],
                            c: [
                            {
                                id: 'board2',
                                type: 'image',
                                rect: ['0px', '0px', '243px', '155px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"board.png",'0px','0px']
                            },
                            {
                                id: 'title2',
                                type: 'text',
                                rect: ['48px', '81px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​校园奇遇记</p>",
                                font: ['Georgia, Times New Roman, Times, serif', [30, "px"], "rgba(255,255,255,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'title1Group',
                            type: 'group',
                            rect: ['162px', '259px', '243', '155', 'auto', 'auto'],
                            transform: [[],['10']],
                            c: [
                            {
                                id: 'board1',
                                type: 'image',
                                rect: ['0px', '0px', '243px', '155px', 'auto', 'auto'],
                                fill: ["rgba(0,0,0,0)",im+"board.png",'0px','0px']
                            },
                            {
                                id: 'title1',
                                type: 'text',
                                rect: ['46px', '76px', 'auto', 'auto', 'auto', 'auto'],
                                text: "<p style=\"margin: 0px;\">​我要上学啦</p>",
                                font: ['Georgia, Times New Roman, Times, serif', [30, "px"], "rgba(255,255,255,1.00)", "900", "none", "", "break-word", "nowrap"]
                            }]
                        },
                        {
                            id: 'morninig-glory',
                            type: 'image',
                            rect: ['900px', '644px', '91px', '86px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"morninig-glory.png",'0px','0px']
                        },
                        {
                            id: 'background',
                            display: 'none',
                            type: 'audio',
                            tag: 'audio',
                            rect: ['251', '47', '320px', '45px', 'auto', 'auto'],
                            source: [aud+"background.mp3"],
                            preload: 'metadata'
                        },
                        {
                            id: 'sun',
                            type: 'image',
                            rect: ['25px', '597px', '150px', '150px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"sun.svg",'0px','0px'],
                            transform: [[],['360']]
                        },
                        {
                            id: 'character',
                            type: 'image',
                            rect: ['60px', '632px', '72px', '72px', 'auto', 'auto'],
                            overflow: 'hidden',
                            fill: ["rgba(0,0,0,0)",im+"dog1-character.png",'0px','0px']
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
                            "eid75",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf2}",
                            '-40deg',
                            '-50deg'
                        ],
                        [
                            "eid76",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf2}",
                            '-50deg',
                            '-40deg'
                        ],
                        [
                            "eid77",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf2}",
                            '-40deg',
                            '-30deg'
                        ],
                        [
                            "eid78",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf2}",
                            '-30deg',
                            '-37deg'
                        ],
                        [
                            "eid374",
                            "scaleY",
                            0,
                            1000,
                            "linear",
                            "${morninig-glory}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid375",
                            "scaleY",
                            1000,
                            1000,
                            "linear",
                            "${morninig-glory}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid181",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${weed-right}",
                            '0deg',
                            '1deg'
                        ],
                        [
                            "eid182",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${weed-right}",
                            '1deg',
                            '0deg'
                        ],
                        [
                            "eid183",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${weed-right}",
                            '0deg',
                            '-1deg'
                        ],
                        [
                            "eid184",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${weed-right}",
                            '-1deg',
                            '0deg'
                        ],
                        [
                            "eid68",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf}",
                            '-45deg',
                            '-55deg'
                        ],
                        [
                            "eid70",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf}",
                            '-55deg',
                            '-45deg'
                        ],
                        [
                            "eid71",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf}",
                            '-45deg',
                            '-40deg'
                        ],
                        [
                            "eid73",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf}",
                            '-40deg',
                            '-45deg'
                        ],
                        [
                            "eid335",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${title3Group}",
                            '-10deg',
                            '-15deg'
                        ],
                        [
                            "eid344",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${title3Group}",
                            '-15deg',
                            '-10deg'
                        ],
                        [
                            "eid348",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${title3Group}",
                            '-10deg',
                            '-5deg'
                        ],
                        [
                            "eid353",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${title3Group}",
                            '-5deg',
                            '-10deg'
                        ],
                        [
                            "eid130",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf8}",
                            '20deg',
                            '10deg'
                        ],
                        [
                            "eid131",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf8}",
                            '10deg',
                            '20deg'
                        ],
                        [
                            "eid132",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf8}",
                            '20deg',
                            '30deg'
                        ],
                        [
                            "eid133",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf8}",
                            '30deg',
                            '20deg'
                        ],
                        [
                            "eid155",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf5}",
                            '-10deg',
                            '-20deg'
                        ],
                        [
                            "eid111",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf5}",
                            '-20deg',
                            '-10deg'
                        ],
                        [
                            "eid112",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf5}",
                            '-10deg',
                            '0deg'
                        ],
                        [
                            "eid162",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf5}",
                            '0deg',
                            '-10deg'
                        ],
                        [
                            "eid174",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${weed-left}",
                            '0deg',
                            '-1deg'
                        ],
                        [
                            "eid178",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${weed-left}",
                            '-1deg',
                            '0deg'
                        ],
                        [
                            "eid175",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${weed-left}",
                            '0deg',
                            '1deg'
                        ],
                        [
                            "eid176",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${weed-left}",
                            '1deg',
                            '0deg'
                        ],
                        [
                            "eid147",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf10}",
                            '40deg',
                            '30deg'
                        ],
                        [
                            "eid148",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf10}",
                            '30deg',
                            '40deg'
                        ],
                        [
                            "eid165",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf10}",
                            '40deg',
                            '50deg'
                        ],
                        [
                            "eid166",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf10}",
                            '50deg',
                            '40deg'
                        ],
                        [
                            "eid167",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf7}",
                            '10deg',
                            '0deg'
                        ],
                        [
                            "eid168",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf7}",
                            '0deg',
                            '10deg'
                        ],
                        [
                            "eid171",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf7}",
                            '10deg',
                            '20deg'
                        ],
                        [
                            "eid172",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf7}",
                            '20deg',
                            '10deg'
                        ],
                        [
                            "eid192",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf11}",
                            '0deg',
                            '-10deg'
                        ],
                        [
                            "eid193",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf11}",
                            '-10deg',
                            '0deg'
                        ],
                        [
                            "eid196",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf11}",
                            '0deg',
                            '10deg'
                        ],
                        [
                            "eid197",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf11}",
                            '10deg',
                            '0deg'
                        ],
                        [
                            "eid383",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${sun}",
                            '0deg',
                            '90deg'
                        ],
                        [
                            "eid384",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${sun}",
                            '90deg',
                            '180deg'
                        ],
                        [
                            "eid385",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${sun}",
                            '180deg',
                            '270deg'
                        ],
                        [
                            "eid386",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${sun}",
                            '270deg',
                            '360deg'
                        ],
                        [
                            "eid333",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${title2Group}",
                            '5deg',
                            '0deg'
                        ],
                        [
                            "eid342",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${title2Group}",
                            '0deg',
                            '5deg'
                        ],
                        [
                            "eid349",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${title2Group}",
                            '5deg',
                            '10deg'
                        ],
                        [
                            "eid352",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${title2Group}",
                            '10deg',
                            '5deg'
                        ],
                        [
                            "eid338",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${title1Group}",
                            '10deg',
                            '5deg'
                        ],
                        [
                            "eid340",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${title1Group}",
                            '5deg',
                            '10deg'
                        ],
                        [
                            "eid350",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${title1Group}",
                            '10deg',
                            '15deg'
                        ],
                        [
                            "eid351",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${title1Group}",
                            '15deg',
                            '10deg'
                        ],
                        [
                            "eid372",
                            "scaleX",
                            0,
                            1000,
                            "linear",
                            "${morninig-glory}",
                            '1',
                            '1.05'
                        ],
                        [
                            "eid373",
                            "scaleX",
                            1000,
                            1000,
                            "linear",
                            "${morninig-glory}",
                            '1.05',
                            '1'
                        ],
                        [
                            "eid89",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf3}",
                            '-30deg',
                            '-40deg'
                        ],
                        [
                            "eid90",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf3}",
                            '-40deg',
                            '-30deg'
                        ],
                        [
                            "eid91",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf3}",
                            '-30deg',
                            '-20deg'
                        ],
                        [
                            "eid92",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf3}",
                            '-20deg',
                            '-30deg'
                        ],
                        [
                            "eid104",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf4}",
                            '-20deg',
                            '-30deg'
                        ],
                        [
                            "eid105",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf4}",
                            '-30deg',
                            '-20deg'
                        ],
                        [
                            "eid106",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf4}",
                            '-20deg',
                            '-10deg'
                        ],
                        [
                            "eid107",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf4}",
                            '-10deg',
                            '-20deg'
                        ],
                        [
                            "eid337",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${title4Group}",
                            '15deg',
                            '10deg'
                        ],
                        [
                            "eid346",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${title4Group}",
                            '10deg',
                            '15deg'
                        ],
                        [
                            "eid347",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${title4Group}",
                            '15deg',
                            '20deg'
                        ],
                        [
                            "eid354",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${title4Group}",
                            '20deg',
                            '15deg'
                        ],
                        [
                            "eid116",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf6}",
                            '0deg',
                            '-10deg'
                        ],
                        [
                            "eid117",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf6}",
                            '-10deg',
                            '0deg'
                        ],
                        [
                            "eid118",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf6}",
                            '0deg',
                            '10deg'
                        ],
                        [
                            "eid119",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf6}",
                            '10deg',
                            '0deg'
                        ],
                        [
                            "eid138",
                            "rotateZ",
                            0,
                            500,
                            "linear",
                            "${leaf9}",
                            '30deg',
                            '20deg'
                        ],
                        [
                            "eid139",
                            "rotateZ",
                            500,
                            500,
                            "linear",
                            "${leaf9}",
                            '20deg',
                            '30deg'
                        ],
                        [
                            "eid140",
                            "rotateZ",
                            1000,
                            500,
                            "linear",
                            "${leaf9}",
                            '30deg',
                            '40deg'
                        ],
                        [
                            "eid141",
                            "rotateZ",
                            1500,
                            500,
                            "linear",
                            "${leaf9}",
                            '40deg',
                            '30deg'
                        ]
                    ]
                }
            },
            "Symbol_leaf": {
                version: "6.0.0",
                minimumCompatibleVersion: "5.0.0",
                build: "6.0.0.400",
                scaleToFit: "none",
                centerStage: "none",
                resizeInstances: false,
                content: {
                    dom: [
                        {
                            transform: [[], ['50'], [0, 0, 0], [1, 1, 1]],
                            id: 'leaf',
                            type: 'image',
                            rect: ['13px', '22px', '97px', '83px', 'auto', 'auto'],
                            fill: ['rgba(0,0,0,0)', 'images/leaf.png', '0px', '0px']
                        }
                    ],
                    style: {
                        '${symbolSelector}': {
                            rect: [null, null, '126px', '128px']
                        }
                    }
                },
                timeline: {
                    duration: 3000,
                    autoPlay: true,
                    data: [
                        [
                            "eid7",
                            "rotateZ",
                            0,
                            755,
                            "linear",
                            "${leaf}",
                            '50deg',
                            '60deg'
                        ],
                        [
                            "eid10",
                            "rotateZ",
                            755,
                            745,
                            "linear",
                            "${leaf}",
                            '60deg',
                            '50deg'
                        ],
                        [
                            "eid12",
                            "rotateZ",
                            1500,
                            750,
                            "linear",
                            "${leaf}",
                            '50deg',
                            '40deg'
                        ],
                        [
                            "eid14",
                            "rotateZ",
                            2250,
                            750,
                            "linear",
                            "${leaf}",
                            '40deg',
                            '50deg'
                        ]
                    ]
                }
            }
        };

    AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts);

    if (!window.edge_authoring_mode) AdobeEdge.getComposition(compId).load("index_edgeActions.js");
})("EDGE-16665010");
