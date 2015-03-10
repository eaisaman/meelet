define(
    [],
    function () {

        return {
            directiveName: "ui-effect-standard-box-shadow",
            js: [],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/boxShadowDemo.html"
            },
            json: "app/effect.json"
        };
    }
);