require.config(
    {
        paths: {
            "angular-ui-tree": ANGULAR_PLUGINS_LIB_PATH + "angular-ui-tree"
        }
    }
);

define(
    [
        "angular-ui-tree"
    ],
    function () {
        var directiveConfigs = Array.prototype.slice.call(arguments);

        return function (appModule) {
            directiveConfigs.forEach(function (config) {
                config(appModule);
            });
        }
    }
);