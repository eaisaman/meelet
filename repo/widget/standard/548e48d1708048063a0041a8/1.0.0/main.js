define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.sidebar"],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css", "stylesheets/icons.css"],
                url: "demo/sidebarDemo.html"
            },
            template: "app/widget.html",
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
                    ]
                },
                side: {
                    name: "Side",
                    type: "list",
                    options: [
                        {name: "leftSide", value: "leftSide"},
                        {name: "rightSide", value: "rightSide"}
                    ]
                },
                overlay: {
                    name: "Overlay",
                    type: "list",
                    options: [
                        {name: "overlay", value: "overlay"},
                        {name: "transparent", value: ""}
                    ]
                },
                barContentWidth: {
                    name: "Bar Width",
                    type: "size"
                }
            }
        };
    }
);