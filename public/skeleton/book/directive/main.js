requirejs.config(
    {
        paths: {
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.include": DIRECTIVE_LIB_PATH + "ng.ui.include",
            "ng.ui.include.replace": DIRECTIVE_LIB_PATH + "ng.ui.include.replace",
            "ng.ui.link": DIRECTIVE_LIB_PATH + "ng.ui.link",
            "ng.ui.data": DIRECTIVE_LIB_PATH + "ng.ui.data"
        }
    }
);

define([
        "app-extension",
        "widget.anchor",
        "ng.ui.include",
        "ng.ui.include.replace",
        "ng.ui.link",
        "ng.ui.data"
    ],
    function () {
        var extension = arguments[0],
            directiveConfigs = Array.prototype.slice.call(arguments, 1);

        return function (appModule) {
            //widget-anchor directive
            directiveConfigs[0](appModule, extension);

            //Include Base directive
            directiveConfigs[1](appModule);

            //Include Replace directive
            directiveConfigs[2](appModule);

            //Link Base directive
            directiveConfigs[3](appModule);

            //Data directive
            directiveConfigs[4](appModule, extension);
        }
    }
);
