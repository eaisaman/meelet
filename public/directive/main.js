requirejs.config(
    {
        paths: {
            "ng.ui.util": DIRECTIVE_LIB_PATH + "ng.ui.util",
            "ng.ui.canvas": DIRECTIVE_LIB_PATH + "ng.ui.canvas",
            "ng.ui.svg": DIRECTIVE_LIB_PATH + "ng.ui.svg",
            "ng.ui.wave.visualizer": DIRECTIVE_LIB_PATH + "ng.ui.wave.visualizer",
            "ng.ui.animation": DIRECTIVE_LIB_PATH + "ng.ui.animation",
            "ng.ui.service": DIRECTIVE_LIB_PATH + "ng.ui.service",
            "ng.ui.service.flow": DIRECTIVE_LIB_PATH + "ng.ui.service.flow",
            "ng.ui.service.book": DIRECTIVE_LIB_PATH + "ng.ui.service.book",
            "ng.ui.extension": DIRECTIVE_LIB_PATH + "ng.ui.extension",
            "ng.ui.hammer-gestures": DIRECTIVE_LIB_PATH + "ng.ui.hammer-gestures",
            "ng.ui.multi-transclude": DIRECTIVE_LIB_PATH + "ng.ui.multi-transclude",
            "ng.ui.multilevel-menu": DIRECTIVE_LIB_PATH + "ng.ui.multilevel-menu",
            "ng.ui.sketch-widget": DIRECTIVE_LIB_PATH + "ng.ui.sketch-widget",
            "ng.ui.simple-dropdown": DIRECTIVE_LIB_PATH + "ng.ui.simple-dropdown",
            "ng.ui.horizontal-ruler": DIRECTIVE_LIB_PATH + "ng.ui.horizontal-ruler",
            "ng.ui.vertical-ruler": DIRECTIVE_LIB_PATH + "ng.ui.vertical-ruler",
            "ng.ui.border-editor": DIRECTIVE_LIB_PATH + "ng.ui.border-editor",
            "ng.ui.simple-style-editor": DIRECTIVE_LIB_PATH + "ng.ui.simple-style-editor",
            "ng.ui.color-editor-palette": DIRECTIVE_LIB_PATH + "ng.ui.color-editor-palette",
            "ng.ui.color-picker": DIRECTIVE_LIB_PATH + "ng.ui.color-picker",
            "ng.ui.background-image": DIRECTIVE_LIB_PATH + "ng.ui.background-image",
            "ng.ui.gradient-editor": DIRECTIVE_LIB_PATH + "ng.ui.gradient-editor",
            "ng.ui.text-shadow-editor": DIRECTIVE_LIB_PATH + "ng.ui.text-shadow-editor",
            "ng.ui.box-shadow-editor": DIRECTIVE_LIB_PATH + "ng.ui.box-shadow-editor",
            "ng.ui.shape": DIRECTIVE_LIB_PATH + "ng.ui.shape",
            "ng.ui.widget": DIRECTIVE_LIB_PATH + "ng.ui.widget",
            "ng.ui.widget-configurator": DIRECTIVE_LIB_PATH + "ng.ui.widget-configurator",
            "ng.ui.page": DIRECTIVE_LIB_PATH + "ng.ui.page",
            "ng.ui.dock": DIRECTIVE_LIB_PATH + "ng.ui.dock",
            "ng.ui.topbar": DIRECTIVE_LIB_PATH + "ng.ui.topbar",
            "ng.ui.modal-window": DIRECTIVE_LIB_PATH + "ng.ui.modal-window",
            "ng.ui.sidebar": DIRECTIVE_LIB_PATH + "ng.ui.sidebar",
            "ng.ui.resource.editor": DIRECTIVE_LIB_PATH + "ng.ui.resource-editor",
            "ng.ui.state-transition": DIRECTIVE_LIB_PATH + "ng.ui.state-transition",
            "ng.ui.state-action": DIRECTIVE_LIB_PATH + "ng.ui.state-action"
        },
        waitSeconds: 0
    }
);


define([
        "ng.ui.util",
        "ng.ui.canvas",
        "ng.ui.svg",
        "ng.ui.wave.visualizer",
        "ng.ui.animation",
        "ng.ui.service",
        "ng.ui.service.flow",
        "ng.ui.service.book",
        "ng.ui.extension",
        "ng.ui.hammer-gestures",
        "ng.ui.multi-transclude",
        "ng.ui.multilevel-menu",
        "ng.ui.sketch-widget",
        "ng.ui.simple-dropdown",
        "ng.ui.horizontal-ruler",
        "ng.ui.vertical-ruler",
        "ng.ui.border-editor",
        "ng.ui.simple-style-editor",
        "ng.ui.color-editor-palette",
        "ng.ui.color-picker",
        "ng.ui.background-image",
        "ng.ui.gradient-editor",
        "ng.ui.text-shadow-editor",
        "ng.ui.box-shadow-editor",
        "ng.ui.shape",
        "ng.ui.widget",
        "ng.ui.widget-configurator",
        "ng.ui.page",
        "ng.ui.dock",
        "ng.ui.topbar",
        "ng.ui.modal-window",
        "ng.ui.sidebar",
        "ng.ui.resource.editor",
        "ng.ui.state-transition",
        "ng.ui.state-action"
    ],
    function () {
        var utilConfig = arguments[0],
            canvasConfig = arguments[1],
            svgConfig = arguments[2],
            waveVisualizerConfig = arguments[3],
            animationConfig = arguments[4],
            serviceConfig = arguments[5],
            flowServiceConfig = arguments[6],
            bookServiceConfig = arguments[7],
            extension = arguments[8],
            directiveConfigs = Array.prototype.slice.call(arguments, 9);

        return function (appModule) {
            utilConfig(appModule);

            canvasConfig(appModule);

            svgConfig(appModule);

            waveVisualizerConfig(appModule);

            animationConfig(appModule);

            serviceConfig(appModule);

            flowServiceConfig(appModule);

            bookServiceConfig(appModule);

            //Hammer gestures
            directiveConfigs[0](appModule);

            //Multi transclude
            directiveConfigs[1](appModule, extension);

            //Multilevel Menu
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

            //Simple Style Editor
            directiveConfigs[8](appModule, extension);

            //Color Editor Palette
            directiveConfigs[9](appModule, extension, {
                colorJson: "directive/color-editor-palette.json"
            });

            //Color Picker
            directiveConfigs[10](appModule, extension);

            //Background Image
            directiveConfigs[11](appModule, extension);

            //Gradient Editor
            directiveConfigs[12](appModule, extension, {
                colorJson: "directive/gradient-editor-color.json"
            });

            //Text Shadow Editor
            directiveConfigs[13](appModule, extension);

            //Box Shadow Editor
            directiveConfigs[14](appModule, extension);

            //Shape
            directiveConfigs[15](appModule, extension);

            //Widget
            directiveConfigs[16](appModule, extension);

            //Widget Configurator
            directiveConfigs[17](appModule, extension);

            //Page
            directiveConfigs[18](appModule, extension);

            //Dock
            directiveConfigs[19](appModule, extension);

            //Topbar
            directiveConfigs[20](appModule, extension);

            //Modal window
            directiveConfigs[21](appModule, extension);

            //Sidebar
            directiveConfigs[22](appModule, extension);

            //Resource Editor
            directiveConfigs[23](appModule, extension);

            //State transition
            directiveConfigs[24](appModule, extension, {
                triggerJson: "directive/trigger.json",
                animationJson: "directive/animation.json"
            });

            //State action
            directiveConfigs[25](appModule, extension);
        }
    }
);