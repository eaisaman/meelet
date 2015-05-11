requirejs.config(
    {
        paths: {
            "prettify": PRETTIFY_LIB_PATH + "prettify.min"
        },
        waitSeconds: 0
    }
);

define(
    [
        "prettify"
    ],
    function () {
        return function () {
        }
    }
);