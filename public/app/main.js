requirejs.config(
    {
        paths: {
            "app-util": APP_LIB_PATH + "util",
            "app-route": APP_LIB_PATH + "route",
            "app-filter": APP_LIB_PATH + "filter",
            "app-service-registry": APP_LIB_PATH + "registry",
            "app-service": APP_LIB_PATH + "browser/service",
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
    ["json!" + APP_LIB_PATH + "meta.json", "json!" + APP_LIB_PATH + "registry.json", "app-route", "ng.ui.extension", "app-service-registry", "app-util", "app-filter", "app-service", "app-controller"],
    function (meta, registry) {
        var routeConfig = arguments[2],
            extension = arguments[3],
            registryConfig = arguments[4],
            appConfigs = Array.prototype.slice.call(arguments, 5);

        return function (appModule, callback) {
            routeConfig(appModule, meta);

            registryConfig(appModule, registry);

            appConfigs.forEach(function (config) {
                config(appModule, extension, meta);
            });

            callback && callback();
        }
    }
);