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
            template: "app/widget.html"
        };
    }
);