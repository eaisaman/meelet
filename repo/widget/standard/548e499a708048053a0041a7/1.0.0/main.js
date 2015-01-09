define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.modal-window"],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/modalWindowDemo.html"
            },
            template: "app/widget.html",
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
                    ]
                },
                setPerspective: {
                    name: "Perspective",
                    type: "boolean"
                },
                modalContentWidth: {
                    name: "Modal Width",
                    type: "number"
                },
                modalContentHeight: {
                    name: "Modal Height",
                    type: "number"
                }
            }
        };
    }
);