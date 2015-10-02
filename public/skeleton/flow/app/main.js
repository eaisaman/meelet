requirejs.config(
    {
        paths: {
            "flow-util": APP_LIB_PATH + "flow-util",
            "app-filter": APP_LIB_PATH + "filter",
            "app-controller": APP_LIB_PATH + "controller"
        },
        waitSeconds: 0
    }
);

define(
    ["flow-util", "app-filter", "app-controller"],
    function (extension) {
        var appConfigs = Array.prototype.slice.call(arguments, 1);

        return function (appModule, callback) {
            appConfigs.forEach(function (config) {
                config(appModule, extension);
            });

            callback && callback();
        }
    }
);