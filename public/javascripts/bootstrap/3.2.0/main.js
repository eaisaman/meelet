requirejs.config(
    {
        paths: {
            "bootstrap": BOOTSTRAP_LIB_PATH + "bootstrap"
        },
        waitSeconds: 0
    }
);

define(
    [
        "bootstrap"
    ],
    function () {
        return function () {
        }
    }
);