requirejs.config(
    {
        paths: {
            "sketch-util": APP_LIB_PATH + "sketch-util",
            "app-filter": APP_LIB_PATH + "filter",
            "app-controller": APP_LIB_PATH + "controller"
        },
        waitSeconds: 0
    }
);

define(
    ["app-extension", "sketch-util", "app-filter", "app-controller"],
    function (extension) {
        var appConfigs = Array.prototype.slice.call(arguments, 1);

        return function (appModule, callback) {
            if (isBrowser) {
                appConfigs.forEach(function (config) {
                    config(appModule, extension);
                });
            }

            callback && callback();
        }
    }
);