requirejs.config(
    {
        paths: {
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.include.replace": DIRECTIVE_LIB_PATH + "ng.ui.include.replace"
        }
    }
);


define([
        "widget.anchor",
        "ng.ui.include.replace"
    ],
    function () {
        var directiveConfigs = Array.prototype.slice.call(arguments);

        return function (appModule) {
            //widget-anchor directive
            directiveConfigs[0](appModule);

            //Include Replace directive
            directiveConfigs[1](appModule);
        }
    }
);