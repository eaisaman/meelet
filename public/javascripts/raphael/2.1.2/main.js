requirejs.config(
    {
        paths: {
            "raphael": RAPHAEL_LIB_PATH + "raphael-min"
        },
        waitSeconds: 0
    }
);

define(
    [
        "raphael"
    ],
    function () {
        return function () {
        }
    }
);