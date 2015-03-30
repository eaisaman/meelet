define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.tab"],
            stylesheets: [],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/tabDemo.html"
            },
            template: "app/widget.html",
            configuration: {
                tabTitles: {
                    name: "Tabs",
                    type: "boundWriteList",
                    listName: "tabTitles",
                    defaultValue: []
                },
                pickedTabTitle: {
                    name: "Active Tab",
                    type: "boundReadList",
                    listName: "tabTitles"
                },
                align: {
                    name: "Align",
                    type: "list",
                    options: [
                        {name: "alignTop", value: "alignTop"},
                        {name: "alignBottom", value: "alignBottom"},
                        {name: "alignLeft", value: "alignLeft"},
                        {name: "alignRight", value: "alignRight"}
                    ],
                    defaultValue: "alignTop"
                },
                transition: {
                    name: "Transition",
                    type: "multilevel-list",
                    options: [
                        {
                            name: "MOVE",
                            list: [{
                                name: "moveToLeft",
                                value: "moveToLeft"
                            }, {
                                name: "moveToRight",
                                value: "moveToRight"
                            }, {
                                name: "moveToTop",
                                value: "moveToTop"
                            }, {
                                name: "moveToBottom",
                                value: "moveToBottom"
                            }]
                        },
                        {
                            name: "FADE",
                            list: [
                                {
                                    name: "fadeToLeft",
                                    value: "fadeToLeft"
                                }, {
                                    name: "fadeToRight",
                                    value: "fadeToRight"
                                }, {
                                    name: "fadeToTop",
                                    value: "fadeToTop"
                                }, {
                                    name: "fadeToBottom",
                                    value: "fadeToBottom"
                                },
                                {
                                    name: "moveToLeftFade",
                                    value: "moveToLeftFade"
                                }, {
                                    name: "moveToRightFade",
                                    value: "moveToRightFade"
                                }, {
                                    name: "moveToBottomFade",
                                    value: "moveToBottomFade"
                                }, {
                                    name: "moveToTopFade",
                                    value: "moveToTopFade"
                                }
                            ]
                        },
                        {
                            name: "SCALE",
                            list: [
                                {
                                    name: "moveToLeftScaleDown",
                                    value: "moveToLeftScaleDown"
                                }, {
                                    name: "moveToRightScaleDown",
                                    value: "moveToRightScaleDown"
                                }, {
                                    name: "moveToBottomScaleDown",
                                    value: "moveToBottomScaleDown"
                                }, {
                                    name: "moveToTopScaleDown",
                                    value: "moveToTopScaleDown"
                                },
                                {
                                    name: "scaleUpAtLeft",
                                    value: "scaleUpAtLeft"
                                }, {
                                    name: "scaleUpAtRight",
                                    value: "scaleUpAtRight"
                                }, {
                                    name: "scaleUpAtTop",
                                    value: "scaleUpAtTop"
                                }, {
                                    name: "scaleUpAtBottom",
                                    value: "scaleUpAtBottom"
                                }, {
                                    name: "scaleUp",
                                    value: "scaleUp"
                                }, {
                                    name: "scaleUpCenter",
                                    value: "scaleUpCenter"
                                }
                            ]
                        },
                        {
                            name: "ROTATE",
                            list: [
                                {
                                    name: "GLUE",
                                    list: [{
                                        name: "moveToLeftAfterRotation",
                                        value: "moveToLeftAfterRotation"
                                    }, {
                                        name: "moveToRightAfterRotation",
                                        value: "moveToRightAfterRotation"
                                    }, {
                                        name: "moveToTopAfterRotation",
                                        value: "moveToTopAfterRotation"
                                    }, {
                                        name: "moveToBottomAfterRotation",
                                        value: "moveToBottomAfterRotation"
                                    }]
                                },
                                {
                                    name: "FLIP",
                                    list: [{
                                        name: "flipInLeftOutRight",
                                        value: "flipInLeftOutRight"
                                    }, {
                                        name: "flipInRightOutLeft",
                                        value: "flipInRightOutLeft"
                                    }, {
                                        name: "flipInBottomOutTop",
                                        value: "flipInBottomOutTop"
                                    }, {
                                        name: "flipInTopOutBottom",
                                        value: "flipInTopOutBottom"
                                    }]
                                },
                                {
                                    name: "PUSH",
                                    list: [{
                                        name: "pushLeft",
                                        value: "pushLeft"
                                    }, {
                                        name: "pushRight",
                                        value: "pushRight"
                                    }, {
                                        name: "pushTop",
                                        value: "pushTop"
                                    }, {
                                        name: "pushBottom",
                                        value: "pushBottom"
                                    }]
                                },
                                {
                                    name: "PULL",
                                    list: [{
                                        name: "pullLeft",
                                        value: "pullLeft"
                                    }, {
                                        name: "pullRight",
                                        value: "pullRight"
                                    }, {
                                        name: "pullTop",
                                        value: "pullTop"
                                    }, {
                                        name: "pullBottom",
                                        value: "pullBottom"
                                    }]
                                },
                                {
                                    name: "FOLD",
                                    list: [{
                                        name: "foldLeft",
                                        value: "foldLeft"
                                    }, {
                                        name: "foldRight",
                                        value: "foldRight"
                                    }, {
                                        name: "foldTop",
                                        value: "foldTop"
                                    }, {
                                        name: "foldBottom",
                                        value: "foldBottom"
                                    }]
                                },
                                {
                                    name: "UNFOLD",
                                    list: [{
                                        name: "unfoldLeft",
                                        value: "unfoldLeft"
                                    }, {
                                        name: "unfoldRight",
                                        value: "unfoldRight"
                                    }, {
                                        name: "unfoldTop",
                                        value: "unfoldTop"
                                    }, {
                                        name: "unfoldBottom",
                                        value: "unfoldBottom"
                                    }]
                                },
                                {
                                    name: "ROOM",
                                    list: [{
                                        name: "roomToLeft",
                                        value: "roomToLeft"
                                    }, {
                                        name: "roomToRight",
                                        value: "roomToRight"
                                    }, {
                                        name: "roomToTop",
                                        value: "roomToTop"
                                    }, {
                                        name: "roomToBottom",
                                        value: "roomToBottom"
                                    }]
                                },
                                {
                                    name: "CUBE",
                                    list: [{
                                        name: "cubeToLeft",
                                        value: "cubeToLeft"
                                    }, {
                                        name: "cubeToRight",
                                        value: "cubeToRight"
                                    }, {
                                        name: "cubeToTop",
                                        value: "cubeToTop"
                                    }, {
                                        name: "cubeToBottom",
                                        value: "cubeToBottom"
                                    }]
                                },
                                {
                                    name: "CAROUSEL",
                                    list: [{
                                        name: "carouselToLeft",
                                        value: "carouselToLeft"
                                    }, {
                                        name: "carouselToRight",
                                        value: "carouselToRight"
                                    }, {
                                        name: "carouselToTop",
                                        value: "carouselToTop"
                                    }, {
                                        name: "carouselToBottom",
                                        value: "carouselToBottom"
                                    }]
                                },
                                {
                                    name: "sides",
                                    value: "sides"
                                }
                            ]
                        },
                        {
                            name: "fall",
                            value: "fall"
                        }, {
                            name: "newspaper",
                            value: "newspaper"
                        }, {
                            name: "slide",
                            value: "slide"
                        }
                    ],
                    defaultValue: "moveToLeft"
                },
                handDownConfiguration: {
                    tabBackgroundColor: {
                        name: "Background Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#d4d4d4", alpha: 1}
                    },
                    titleBackgroundColor: {
                        name: "Title Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#838383", alpha: 1}
                    },
                    activeTitleBackgroundColor: {
                        name: "Active Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#fffff", alpha: 1}
                    }
                }
            }
        };
    }
);