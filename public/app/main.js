requirejs.config(
    {
        paths: {
            "app-util": APP_LIB_PATH + "util",
            "app-route": APP_LIB_PATH + "route",
            "app-filter": APP_LIB_PATH + "filter",
            "app-service": window.cordova && APP_LIB_PATH + "embedded/service" || APP_LIB_PATH + "browser/service",
            "app-controller": APP_LIB_PATH + "controller"
        },
        waitSeconds: 0
    }
);

define(
    ["app-util", "app-route", "app-filter", "app-service", "app-controller"],
    function () {
        var appConfigs = Array.prototype.slice.call(arguments);

        return function (appModule) {
            appConfigs.forEach(function (config) {
                config(appModule);
            });
        }
    }
);