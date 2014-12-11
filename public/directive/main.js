require.config(
    {
        paths: {
            "ng.ui.util": DIRECTIVE_LIB_PATH + "ng.ui.util",
            "ng.ui.service": DIRECTIVE_LIB_PATH + "ng.ui.service",
            "ng.ui.extension": DIRECTIVE_LIB_PATH + "ng.ui.extension",
            "ng.ui.hammer-gestures": DIRECTIVE_LIB_PATH + "ng.ui.hammer-gestures",
            "ng.ui.draggable": DIRECTIVE_LIB_PATH + "ng.ui.draggable",
            "ng.ui.multi-transclude": DIRECTIVE_LIB_PATH + "ng.ui.multi-transclude",
            "ng.ui.sketch-widget": DIRECTIVE_LIB_PATH + "ng.ui.sketch-widget",
            "ng.ui.horizontal-ruler": DIRECTIVE_LIB_PATH + "ng.ui.horizontal-ruler",
            "ng.ui.vertical-ruler": DIRECTIVE_LIB_PATH + "ng.ui.vertical-ruler",
            "ng.ui.border-editor": DIRECTIVE_LIB_PATH + "ng.ui.border-editor",
            "ng.ui.color-editor-palette": DIRECTIVE_LIB_PATH + "ng.ui.color-editor-palette",
            "ng.ui.color-picker": DIRECTIVE_LIB_PATH + "ng.ui.color-picker",
            "ng.ui.gradient-editor": DIRECTIVE_LIB_PATH + "ng.ui.gradient-editor",
            "ng.ui.text-shadow-editor": DIRECTIVE_LIB_PATH + "ng.ui.text-shadow-editor",
            "ng.ui.box-shadow-editor": DIRECTIVE_LIB_PATH + "ng.ui.box-shadow-editor",
            "ng.ui.shape": DIRECTIVE_LIB_PATH + "ng.ui.shape",
            "ng.ui.page": DIRECTIVE_LIB_PATH + "ng.ui.page",
            "ng.ui.dock": DIRECTIVE_LIB_PATH + "ng.ui.dock",
            "ng.ui.toolbar": DIRECTIVE_LIB_PATH + "ng.ui.toolbar",
            "ng.ui.simple-dropdown": DIRECTIVE_LIB_PATH + "ng.ui.simple-dropdown",
            "ng.ui.state-transition": DIRECTIVE_LIB_PATH + "ng.ui.state-transition",
            "ng.ui.sidebar": DIRECTIVE_LIB_PATH + "ng.ui.sidebar"
        },
        waitSeconds: 0
    }
);


define([
        "ng.ui.util",
        "ng.ui.service",
        "ng.ui.extension",
        "ng.ui.hammer-gestures",
        "ng.ui.draggable",
        "ng.ui.multi-transclude",
        "ng.ui.sketch-widget",
        "ng.ui.simple-dropdown",
        "ng.ui.horizontal-ruler",
        "ng.ui.vertical-ruler",
        "ng.ui.border-editor",
        "ng.ui.color-editor-palette",
        "ng.ui.color-picker",
        "ng.ui.gradient-editor",
        "ng.ui.text-shadow-editor",
        "ng.ui.box-shadow-editor",
        "ng.ui.shape",
        "ng.ui.page",
        "ng.ui.dock",
        "ng.ui.toolbar",
        "ng.ui.state-transition",
        "ng.ui.sidebar"
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

            //Multi transclude
            directiveConfigs[2](appModule, extension);

            //Sketch widget directive
            directiveConfigs[3](appModule, extension);

            //Simple Dropdown
            directiveConfigs[4](appModule, extension);

            //Horizontal ruler directive
            directiveConfigs[5](appModule, extension);

            //Vertical ruler directive
            directiveConfigs[6](appModule, extension);

            //Border Editor
            directiveConfigs[7](appModule, extension, {
                borderJson: "directive/border.json"
            });

            //Color Editor Palette
            directiveConfigs[8](appModule, extension, {
                colorJson: "directive/color-editor-palette.json"
            });

            //Color Picker
            directiveConfigs[9](appModule, extension);

            //Gradient Editor
            directiveConfigs[10](appModule, extension, {
                colorJson: "directive/gradient-editor-color.json"
            });

            //Text Shadow Editor
            directiveConfigs[11](appModule, extension, {
                textShadowJson: "directive/text-shadow.json"
            });

            //Box Shadow Editor
            directiveConfigs[12](appModule, extension, {
                boxShadowJson: "directive/box-shadow.json"
            });

            //Shape
            directiveConfigs[13](appModule, extension, {
                shapeJson: "directive/shape.json"
            });

            //Page
            directiveConfigs[14](appModule, extension);

            //Dock
            directiveConfigs[15](appModule, extension);

            //Toolbar
            directiveConfigs[16](appModule, extension);

            //State transition
            directiveConfigs[17](appModule, extension, {
                triggerJson: "directive/trigger.json",
                animationJson: "directive/animation.json"
            });

            //Sidebar
            directiveConfigs[18](appModule, extension);
        }
    }
);