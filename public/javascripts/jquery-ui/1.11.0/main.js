require.config(
    {
        paths: {
            "jquery-ui": JQUERY_UI_LIB_PATH + "jquery-ui.min"
        },
        shim: {
            "jquery-ui": {deps: ["jquery"]}
        }
    }
);

define(
    [
            "jquery-ui"
    ],
    function () {
        return function () {
        }
    }
);