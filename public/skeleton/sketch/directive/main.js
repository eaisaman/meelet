requirejs.config(
    {
        paths: {
            "ng.ui.animation": DIRECTIVE_LIB_PATH + "ng.ui.animation",
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.include.replace": DIRECTIVE_LIB_PATH + "ng.ui.include.replace"
        }
    }
);

define([
        "ng.ui.animation",
        "widget.anchor",
        "ng.ui.include.replace"
    ],
    function () {
        var animationConfig = arguments[0],
            directiveConfigs = Array.prototype.slice.call(arguments, 1);

        return function (appModule) {
            if (isBrowser) {
                animationConfig(appModule);

                //widget-anchor directive
                directiveConfigs[0](appModule);

                //Include Replace directive
                directiveConfigs[1](appModule);
            }
        }
    }
);