define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.creative-button"],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/creativeButtonDemo.html"
            },
            template: "app/widget.html",
            configuration: {
                tabTitles: {
                    name: "Tabs",
                    type: "writableList"
                },
                pickedTabTitle: {
                    name: "Active Tab",
                    type: "readableList",
                    "listName": "tabTitles"
                },
                align: {
                    name: "Align",
                    type: "list",
                    options: [
                        {name: "alignTop", value: "alignTop"},
                        {name: "alignBottom", value: "alignBottom"},
                        {name: "alignLeft", value: "alignLeft"},
                        {name: "alignRight", value: "alignRight"}
                    ]
                }
            }
        };
    }
);