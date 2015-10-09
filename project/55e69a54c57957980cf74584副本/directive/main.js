requirejs.config(
    {
        paths: {
            "ng.ui.util": DIRECTIVE_LIB_PATH + "ng.ui.util",
            "ng.ui.animation": DIRECTIVE_LIB_PATH + "ng.ui.animation",
            "ng.ui.service": DIRECTIVE_LIB_PATH + "ng.ui.service",
            "ng.ui.extension": DIRECTIVE_LIB_PATH + "ng.ui.extension",
            "ng.ui.hammer-gestures": DIRECTIVE_LIB_PATH + "ng.ui.hammer-gestures",
            "ng.ui.draggable": DIRECTIVE_LIB_PATH + "ng.ui.draggable",
            "widget.anchor": DIRECTIVE_LIB_PATH + "widget.anchor",
            "ng.ui.include.replace": DIRECTIVE_LIB_PATH + "ng.ui.include.replace"
        }
    }
);


define([
        "ng.ui.util",
        "ng.ui.animation",
        "ng.ui.service",
        "ng.ui.extension",
        "ng.ui.hammer-gestures",
        "ng.ui.draggable",
        "widget.anchor",
        "ng.ui.include.replace"
    ],
    function () {
        var utilConfig = arguments[0],
            animationConfig = arguments[1],
            serviceConfig = arguments[2],
            extension = arguments[3],
            directiveConfigs = Array.prototype.slice.call(arguments, 4);

        return function (appModule) {
            utilConfig(appModule);

            animationConfig(appModule);

            serviceConfig(appModule);

            //Hammer gestures
            directiveConfigs[0](appModule);

            //Draggable directive
            directiveConfigs[1](appModule);

            //widget-anchor directive
            directiveConfigs[2](appModule);

            //Include Replace directive
            directiveConfigs[3](appModule);
        }
    }
);