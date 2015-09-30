requirejs.config(
    {
        paths: {
            "app-service-registry": APP_COMMON_LIB_PATH + "registry",
            "app-animation": APP_COMMON_LIB_PATH + "animation",
            "app-svg-animation": APP_COMMON_LIB_PATH + "svg-animation",
            "app-util": APP_COMMON_LIB_PATH + "util",
            "app-route": APP_COMMON_LIB_PATH + "route",
            "app-extension": APP_COMMON_LIB_PATH + "extension",
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
    ["json!meta.json", "json!" + APP_COMMON_LIB_PATH + "registry.json", "app-service-registry", "app-animation", "app-svg-animation", "app-util", "app-route", "app-extension", "app-service", "book-service", "flow-service"],
    function (meta, registry) {
        var registryConfig = arguments[2],
            animationConfig = arguments[3],
            svgAnimationConfig = arguments[4],
            utilConfig = arguments[5],
            routeConfig = arguments[6],
            extension = arguments[7],
            appConfigs = Array.prototype.slice.call(arguments, 8);

        return function (appModule, callback) {
            registryConfig(appModule, registry);

            animationConfig(appModule);

            svgAnimationConfig(appModule);

            utilConfig(appModule);

            routeConfig(appModule, meta);

            appConfigs.forEach(function (config) {
                config(appModule, extension, meta);
            });

            callback && callback();
        }
    }
);