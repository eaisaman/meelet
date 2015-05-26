requirejs.config(
    {
        paths: {
            "app-util": APP_LIB_PATH + "util",
            "app-route": APP_LIB_PATH + "route",
            "app-filter": APP_LIB_PATH + "filter",
            "app-service": window.cordova && APP_LIB_PATH + "embedded/service" || APP_LIB_PATH + "browser/service",
            "app-controller": APP_LIB_PATH + "controller"
        },
        shim: {
            "app-service": {deps: ["app-util"]}
        },
        waitSeconds: 0
    }
);

define(
    ["ng.ui.extension", "app-util", "app-route", "app-filter", "app-service", "app-controller"],
    function () {
        var extension = arguments[0],
            appConfigs = Array.prototype.slice.call(arguments, 1);

        return function (appModule) {
            appConfigs.forEach(function (config) {
                config(appModule, extension);
            });
        }
    }
);