define(
    [],
    function () {

        return {
            directiveName: "ui-effect-page-transition",
            js: [],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js", "demo/jquery.dlmenu.js"],
                stylesheets: ["stylesheets/demo.css", "stylesheets/icons.css", "stylesheets/multilevelmenu.css"],
                url: "demo/pageTransitionDemo.html"
            },
            json: "app/effect.json"
        };
    }
);