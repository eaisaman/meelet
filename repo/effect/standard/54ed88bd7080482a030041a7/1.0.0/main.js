define(
    [],
    function () {

        return {
            directiveName: "ui-effect-magic-animation",
            js: [],
            stylesheets: ["stylesheets/widget.css"],
            demo: {
                js: ["demo/demo.js"],
                stylesheets: ["stylesheets/demo.css"],
                url: "demo/magicAnimationDemo.html"
            },
            json: "app/effect.json"
        };
    }
);