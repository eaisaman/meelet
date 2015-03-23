define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.modal-window"],
            stylesheets: [],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/modalWindowDemo.html"
            },
            template: "app/widget.html",
            anchors: [
                "A3D9E528-879D-4012-80C6-26743933D343",
                "8E1D416B-6F65-445E-9398-E9F0F6D30FF8"
            ],
            configuration: {
                state: {
                    name: "State",
                    type: "list",
                    options: [
                        {name: "*", value: "*"},
                        {name: "show", value: "show"}
                    ]
                },
                transition: {
                    name: "Transition",
                    type: "list",
                    options: [
                        {name: "fadeInScaleUp", value: "fadeInScaleUp"},
                        {name: "slideFromRight", value: "slideFromRight"},
                        {name: "slideFromBottom", value: "slideFromBottom"},
                        {name: "newspaper", value: "newspaper"},
                        {name: "fall", value: "fall"},
                        {name: "sideFall", value: "sideFall"},
                        {name: "slideStickTop", value: "slideStickTop"},
                        {name: "flipHorizontal3D", value: "flipHorizontal3D"},
                        {name: "flipVertical3D", value: "flipVertical3D"},
                        {name: "sign3D", value: "sign3D"},
                        {name: "superScaled", value: "superScaled"},
                        {name: "justMe", value: "justMe"},
                        {name: "slit3D", value: "slit3D"},
                        {name: "rotateFromBottom3D", value: "rotateFromBottom3D"},
                        {name: "rotateFromLeft3D", value: "rotateFromLeft3D"},
                        {name: "blur", value: "blur"},
                        {name: "slideFromBottomPerspective", value: "slideFromBottomPerspective"},
                        {name: "slideFromRightPerspective", value: "slideFromRightPerspective"},
                        {name: "slipFromTopPerspective", value: "slipFromTopPerspective"}
                    ],
                    defaultValue: "fadeInScaleUp"
                },
                setPerspective: {
                    name: "Perspective",
                    type: "boolean"
                },
                handDownConfiguration: {
                    modalContentWidth: {
                        name: "Modal Width",
                        type: "size",
                        handDown: true,
                        defaultValue: "50%"
                    },
                    modalContentHeight: {
                        name: "Modal Height",
                        type: "size",
                        handDown: true,
                        defaultValue: "50%"
                    },
                    overlayColor: {
                        name: "Overlay Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#d4d4d4"
                    },
                    mainColor: {
                        name: "Main Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#ffffff"
                    },
                    modalColor: {
                        name: "Modal Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#cccccc"
                    }
                }
            }
        };
    }
);