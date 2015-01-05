define(
    [],
    function () {

        return {
            js: ["directive/ng.ui.widget.sidebar", "demo/demo.js"],
            stylesheets: ["stylesheets/widget.css", "stylesheets/demo.css", "stylesheets/icons.css"],
            demo: "demo/sidebarDemo.html",
            template: "app/widget.html"
        };
    }
);