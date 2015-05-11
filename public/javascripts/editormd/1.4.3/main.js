requirejs.config(
    {
        paths: {
            "editormd": EDITORMD_LIB_PATH + "editormd"
        },
        shim: {
            "editormd": {
                exports: "editormd",
                deps: ["codemirror-lib", "marked-lib", "prettify-lib", "raphael-lib", "flowchart-lib", "jquery-flowchart-lib", "sequence-diagram-lib"]
            }
        },
        waitSeconds: 0
    }
);

define(
    [
        "editormd"
    ],
    function () {
        return function () {
        }
    }
);