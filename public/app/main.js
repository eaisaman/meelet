requirejs.config(
    {
        paths: {
            "app-util": APP_LIB_PATH + "util",
            "app-route": APP_LIB_PATH + "route",
            "app-filter": APP_LIB_PATH + "filter",
            "app-service": window.cordova && APP_LIB_PATH + "embedded/service" || APP_LIB_PATH + "browser/service",
            "app-controller": APP_LIB_PATH + "controller",
            "text": APP_LIB_PATH + "requirejs-plugins/text",
            "json": APP_LIB_PATH + "requirejs-plugins/json"
        },
        shim: {
            "app-service": {deps: ["app-util"]}
        },
        waitSeconds: 0
    }
);

define(
    ["json!" + APP_LIB_PATH + "meta.json", "app-route", "ng.ui.extension", "app-util", "app-filter", "app-service", "app-controller"],
    function (meta) {
        var routeConfig = arguments[1],
            extension = arguments[2],
            appConfigs = Array.prototype.slice.call(arguments, 3);

        return function (appModule, callback) {
            routeConfig(appModule, meta);

            appConfigs.forEach(function (config) {
                config(appModule, extension, meta);
            });

            callback && callback();
        }
    }
);