require.config(
    {
        paths: {
            "ng.ui.util": DIRECTIVE_LIB_PATH + "ng.ui.util",
            "ng.ui.service": DIRECTIVE_LIB_PATH + "ng.ui.service",
            "ng.ui.extension": DIRECTIVE_LIB_PATH + "ng.ui.extension",
            "ng.ui.hammer-gestures": DIRECTIVE_LIB_PATH + "ng.ui.hammer-gestures",
            "ng.ui.draggable": DIRECTIVE_LIB_PATH + "ng.ui.draggable",
            "ng.ui.sketch-widget": DIRECTIVE_LIB_PATH + "ng.ui.sketch-widget",
            "ng.ui.horizontal-ruler": DIRECTIVE_LIB_PATH + "ng.ui.horizontal-ruler",
            "ng.ui.vertical-ruler": DIRECTIVE_LIB_PATH + "ng.ui.vertical-ruler",
            "ng.ui.color-picker": DIRECTIVE_LIB_PATH + "ng.ui.color-picker",
            "ng.ui.gradient-editor": DIRECTIVE_LIB_PATH + "ng.ui.gradient-editor",
            "ng.ui.shape": DIRECTIVE_LIB_PATH + "ng.ui.shape",
            "ng.ui.page": DIRECTIVE_LIB_PATH + "ng.ui.page",
            "ng.ui.dock": DIRECTIVE_LIB_PATH + "ng.ui.dock",
            "ng.ui.toolbar": DIRECTIVE_LIB_PATH + "ng.ui.toolbar",
            "ng.ui.simple-dropdown": DIRECTIVE_LIB_PATH + "ng.ui.simple-dropdown",
            "ng.ui.state-transition": DIRECTIVE_LIB_PATH + "ng.ui.state-transition"
        }
    }
);


define([
        "ng.ui.util",
        "ng.ui.service",
        "ng.ui.extension",
        "ng.ui.hammer-gestures",
        "ng.ui.draggable",
        "ng.ui.sketch-widget",
        "ng.ui.horizontal-ruler",
        "ng.ui.vertical-ruler",
        "ng.ui.color-picker",
        "ng.ui.gradient-editor",
        "ng.ui.shape",
        "ng.ui.page",
        "ng.ui.dock",
        "ng.ui.toolbar",
        "ng.ui.simple-dropdown",
        "ng.ui.state-transition"
    ],
    function () {
        var utilConfig = arguments[0],
            serviceConfig = arguments[1],
            extension = arguments[2],
            directiveConfigs = Array.prototype.slice.call(arguments, 3);

        return function (appModule) {
            utilConfig(appModule);

            serviceConfig(appModule);

            //Hammer gestures
            directiveConfigs[0](appModule);

            //Draggable directive
            directiveConfigs[1](appModule);

            //Sketch widget directive
            directiveConfigs[2](appModule, extension);

            //Horizontal ruler directive
            directiveConfigs[3](appModule, extension);

            //Vertical ruler directive
            directiveConfigs[4](appModule, extension);

            //Color Picker
            directiveConfigs[5](appModule, extension, {
                colorJson: "directive/color-picker.json"
            });

            //Gradient Editor
            directiveConfigs[6](appModule, extension, {
                colorJson: "directive/gradient-editor-color.json"
            });

            //Shape
            directiveConfigs[7](appModule, extension, {
                shapeJson: "directive/shape.json"
            });

            //Page
            directiveConfigs[8](appModule, extension);

            //Dock
            directiveConfigs[9](appModule, extension);

            //Toolbar
            directiveConfigs[10](appModule, extension);

            //Simple Dropdown
            directiveConfigs[11](appModule, extension);

            //State transition
            directiveConfigs[12](appModule, extension, {
                triggerJson: "directive/trigger.json",
                animationJson: "directive/animation.json"
            });
        }
    }
);