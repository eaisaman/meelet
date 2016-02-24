requirejs.config(
    {
        paths: {
            "app-service-registry": APP_COMMON_LIB_PATH + "registry",
            "app-util": APP_COMMON_LIB_PATH + "util",
            "app-pinyin": APP_COMMON_LIB_PATH + "pinyin",
            "app-route": APP_COMMON_LIB_PATH + "route",
            "app-extension": APP_COMMON_LIB_PATH + "extension",
            "app-service": APP_COMMON_LIB_PATH + "browser/service",
            "book-service": APP_COMMON_LIB_PATH + "browser/service.book",
            "flow-service": APP_COMMON_LIB_PATH + "browser/service.flow",
            "app-embedded-service": APP_COMMON_LIB_PATH + "embedded/service",
            "text": APP_COMMON_LIB_PATH + "requirejs-plugins/text",
            "json": APP_COMMON_LIB_PATH + "requirejs-plugins/json"
        },
        waitSeconds: 0
    }
);

define(
    ["json!meta.json", "json!" + APP_COMMON_LIB_PATH + "registry.json", "app-service-registry", "app-util", "app-pinyin", "app-route", "app-extension", "app-service", "book-service", "flow-service", "app-embedded-service"],
    function (meta, registry) {
        var registryConfig = arguments[2],
            utilConfig = arguments[3],
            pinyinConfig = arguments[4],
            routeConfig = arguments[5],
            extension = arguments[6],
            appConfigs = Array.prototype.slice.call(arguments, 7);

        return function (appModule, callback) {
            registryConfig(appModule, registry);

            pinyinConfig(appModule);

            utilConfig(appModule);

            routeConfig(appModule, meta);

            appConfigs.forEach(function (config) {
                config(appModule, extension, meta);
            });

            callback && callback();
        }
    }
);