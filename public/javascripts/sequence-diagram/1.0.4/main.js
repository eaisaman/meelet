requirejs.config(
    {
        paths: {
            "sequence-diagram": SEQUENCE_DIAGRAM_LIB_PATH + "sequence-diagram-min"
        },
        shim: {
            "sequence-diagram": {
                deps: ["raphael-lib"]
            }
        },
        waitSeconds: 0
    }
);

define(
    [
        "sequence-diagram"
    ],
    function () {
        return function () {
        }
    }
);