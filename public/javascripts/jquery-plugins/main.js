require.config(
    {
        paths: {
            "icheck": JQUERY_PLUGINS_LIB_PATH + "icheck/1.0.2/icheck.min"
        },
        shim: {
            "icheck": {deps: ["jquery"]}
        }
    }
);

define(
    [
        "icheck"
    ],
    function () {
        [
                JQUERY_PLUGINS_LIB_PATH + "icheck/1.0.2/skins/" + "all.css",
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