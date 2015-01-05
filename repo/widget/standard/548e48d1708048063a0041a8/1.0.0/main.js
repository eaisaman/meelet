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
            template: "app/widget.html"
        };
    }
);