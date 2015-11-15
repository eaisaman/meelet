requirejs.config(
    {
        paths: {
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.video.include": DIRECTIVE_LIB_PATH + "ng.ui.video.include",
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
        "ng.ui.video.include",
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

            //Include Video Base directive
            directiveConfigs[2](appModule);

            //Include Replace directive
            directiveConfigs[3](appModule);

            //Link Base directive
            directiveConfigs[4](appModule);

            //Data directive
            directiveConfigs[5](appModule, extension);
        }
    }
);
