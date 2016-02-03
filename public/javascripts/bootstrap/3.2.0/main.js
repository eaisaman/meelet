requirejs.config(
    {
        paths: {
            "bootstrap": BOOTSTRAP_LIB_PATH + "bootstrap"
        },
        shim: {
            "bootstrap": {deps: ["jquery-lib"]}
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