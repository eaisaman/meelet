requirejs.config(
    {
        paths: {
            "ng.ui.animation": DIRECTIVE_LIB_PATH + "ng.ui.animation",
            "ng.ui.service": DIRECTIVE_LIB_PATH + "ng.ui.service",
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.include.replace": DIRECTIVE_LIB_PATH + "ng.ui.include.replace"
        }
    }
);


define([
        "ng.ui.animation",
        "ng.ui.service",
        "widget.anchor",
        "ng.ui.include.replace"
    ],
    function () {
        var animationConfig = arguments[0],
            serviceConfig = arguments[1],
            directiveConfigs = Array.prototype.slice.call(arguments, 2);

        return function (appModule) {
            animationConfig(appModule);

            serviceConfig(appModule);

            //widget-anchor directive
            directiveConfigs[0](appModule);

            //Include Replace directive
            directiveConfigs[1](appModule);
        }
    }
);