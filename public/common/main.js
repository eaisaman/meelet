requirejs.config(
    {
        paths: {
            "app-util": APP_COMMON_LIB_PATH + "util",
            "app-route": APP_COMMON_LIB_PATH + "route",
            "app-extension": APP_COMMON_LIB_PATH + "extension",
            "app-service-registry": APP_COMMON_LIB_PATH + "registry",
            "app-service": APP_COMMON_LIB_PATH + "browser/service",
            "book-service": APP_COMMON_LIB_PATH + "browser/service.book",
            "flow-service": APP_COMMON_LIB_PATH + "browser/service.flow",
            "text": APP_COMMON_LIB_PATH + "requirejs-plugins/text",
            "json": APP_COMMON_LIB_PATH + "requirejs-plugins/json"
        },
        waitSeconds: 0
    }
);

define(
    ["json!meta.json", "json!" + APP_COMMON_LIB_PATH + "registry.json", "app-util", "app-route", "app-extension", "app-service-registry", "app-service", "book-service", "flow-service"],
    function (meta, registry) {
        var utilConfig = arguments[2],
            routeConfig = arguments[3],
            extension = arguments[4],
            registryConfig = arguments[5],
            appConfigs = Array.prototype.slice.call(arguments, 6);

        return function (appModule, callback) {
            utilConfig(appModule);

            routeConfig(appModule, meta);

            registryConfig(appModule, registry);

            appConfigs.forEach(function (config) {
                config(appModule, extension, meta);
            });

            callback && callback();
        }
    }
);