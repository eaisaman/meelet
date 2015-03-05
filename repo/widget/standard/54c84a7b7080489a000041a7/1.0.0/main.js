define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.creative-link"],
            stylesheets: [],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/creativeLinkDemo.html"
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
                effect: {
                    name: "Effect",
                    type: "list",
                    options: [
                        {name: "brackets", value: "brackets"},
                        {name: "slideUpLine", value: "slideUpLine"},
                        {name: "slideDownLine", value: "slideDownLine"},
                        {name: "slideUpSecondLine", value: "slideUpSecondLine"},
                        {name: "translateLine", value: "translateLine"},
                        {name: "slightTranslateLine", value: "slightTranslateLine"},
                        {name: "reveal", value: "reveal"},
                        {name: "switchLine", value: "switchLine"},
                        {name: "scaleDown", value: "scaleDown"},
                        {name: "fallDown", value: "fallDown"},
                        {name: "fadeOut", value: "fadeOut"},
                        {name: "flipUp", value: "flipUp"},
                        {name: "slightTranslate", value: "slightTranslate"}
                    ],
                    defaultValue: "brackets"
                },
                handDownConfiguration: {
                    color: {
                        name: "Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#ffffff"
                    },
                    inactiveColor: {
                        name: "Inactive Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#95a5a6"
                    },
                    backgroundColor: {
                        name: "Background Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#ffffff"
                    },
                    inactiveBackgroundColor: {
                        name: "Inactive Background Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#000000"
                    },
                    lineColor: {
                        name: "Line Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#ffffff"
                    },
                    inactiveLineColor: {
                        name: "Inactive Line Color",
                        type: "color",
                        handDown: true,
                        defaultValue: "#95a5a6"
                    }
                }
            }
        };
    }
);