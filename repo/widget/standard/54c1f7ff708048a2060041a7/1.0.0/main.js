define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.tab"],
            stylesheets: ["stylesheets/widget.css"],
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
                    listName: "tabTitles"
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
                    ]
                }
            }
        };
    }
);