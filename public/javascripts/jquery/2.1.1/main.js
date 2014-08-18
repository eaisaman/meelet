require.config(
    {
        paths: {
            "jquery": JQUERY_LIB_PATH + "jquery.min"
        },
        shim: {
            "jquery": {exports: "jquery"}
        }
    }
);

define(
    [
            "jquery"
    ],
    function () {
        return function () {
        }
    }
);