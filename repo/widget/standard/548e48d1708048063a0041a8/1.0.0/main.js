define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.sidebar"],
            stylesheets: [],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css", "stylesheets/icons.css"],
                url: "demo/sidebarDemo.html"
            },
            template: "app/widget.html",
            anchors: [
                "986F8450-9E40-4DEF-9C2F-05B1547B7A38",
                "80694DA6-8AA6-47D4-A9B0-368900098A97"
            ],
            configuration: {
                state: {
                    name: "State",
                    type: "list",
                    options: [
                        {name: "*", value: "*"},
                        {name: "select", value: "select"}
                    ]
                },
                transition: {
                    name: "Transition",
                    type: "list",
                    options: [
                        {name: "slideInOnTop", value: "slideInOnTop"},
                        {name: "reveal", value: "reveal"},
                        {name: "slideAlong", value: "slideAlong"},
                        {name: "reverseSlideOut", value: "reverseSlideOut"},
                        {name: "scaleDownPusher", value: "scaleDownPusher"},
                        {name: "scaleUp", value: "scaleUp"},
                        {name: "scaleRotatePusher", value: "scaleRotatePusher"},
                        {name: "openDoor", value: "openDoor"},
                        {name: "fallDown", value: "fallDown"},
                        {name: "rotatePusher", value: "rotatePusher"},
                        {name: "rotateIn3D", value: "rotateIn3D"},
                        {name: "rotateOut3D", value: "rotateOut3D"},
                        {name: "delayed3DRotate", value: "delayed3DRotate"}
                    ],
                    defaultValue: "slideInOnTop"
                },
                side: {
                    name: "Side",
                    type: "list",
                    options: [
                        {name: "leftSide", value: "leftSide"},
                        {name: "rightSide", value: "rightSide"}
                    ],
                    defaultValue: "leftSide"
                },
                overlay: {
                    name: "Overlay",
                    type: "list",
                    options: [
                        {name: "overlay", value: "overlay"},
                        {name: "transparent", value: "transparent"}
                    ],
                    defaultValue: "overlay"
                },
                handDownConfiguration: {
                    barContentWidth: {
                        name: "Bar Width",
                        type: "size",
                        handDown: true,
                        defaultValue: "30%"
                    },
                    overlayColor: {
                        name: "Overlay Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#d4d4d4", alpha: 1}
                    },
                    overlayOpacity: {
                        name: "Overlay Opacity",
                        type: "number",
                        handDown: true,
                        defaultValue: 0.5
                    },
                    mainColor: {
                        name: "Main Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#ffffff", alpha: 1}
                    },
                    barColor: {
                        name: "Bar Color",
                        type: "color",
                        handDown: true,
                        defaultValue: {color: "#cccccc", alpha: 1}
                    }
                }
            }
        };
    }
);