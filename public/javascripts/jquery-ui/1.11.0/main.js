require.config(
    {
        paths: {
            "jquery-ui": JQUERY_UI_LIB_PATH + "jquery-ui.min"
        },
        waitSeconds: 0
    }
);

define(
    [
        "jquery-ui"
    ],
    function () {
        [
                JQUERY_UI_LIB_PATH + "jquery-ui.min.css",
                JQUERY_UI_LIB_PATH + "jquery-ui.structure.min.css"
        ].forEach(function (href) {
                var link = document.createElement("link");
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = href;
                document.getElementsByTagName("head")[0].appendChild(link);
            }
        );

        return function () {
        }
    }
);