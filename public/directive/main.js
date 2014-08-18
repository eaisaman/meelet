require.config(
    {
        paths: {
            "ng.ui.util": DIRECTIVE_LIB_PATH + "ng.ui.util",
            "ng.ui.common": DIRECTIVE_LIB_PATH + "ng.ui.common",
            "ng.ui.color-picker": DIRECTIVE_LIB_PATH + "ng.ui.color-picker",
            "ng.ui.gradient-editor": DIRECTIVE_LIB_PATH + "ng.ui.gradient-editor"
        },
        shim: {
            "ng.ui.util": {deps: ["angular"]},
            "ng.ui.common": {deps: ["angular"]},
            "ng.ui.color-picker": {deps: ["ng.ui.util", "ng.ui.common"]},
            "ng.ui.gradient-editor": {deps: ["ng.ui.util", "ng.ui.common"]}
        }
    }
);


define(
    ["ng.ui.util", "ng.ui.common", "ng.ui.color-picker", "ng.ui.gradient-editor"],
    function () {
        var util = arguments[0],
            common = arguments[1],
            directiveConfigs = Array.prototype.slice.call(arguments, 2);

        return function (appModule) {
            //Color Picker
            directiveConfigs[0](appModule, util, common, {
                colorJson: "directive/color-picker.json"
            });

            //Gradient Editor
            directiveConfigs[1](appModule, util, common);
        }
    }
);