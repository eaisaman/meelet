requirejs.config(
    {
        paths: {
            "app-util": APP_COMMON_LIB_PATH + "util",
            "app-route": APP_COMMON_LIB_PATH + "route",
            "app-extension": APP_COMMON_LIB_PATH + "extension",
            "app-service-registry": APP_COMMON_LIB_PATH + "registry",
            "app-service": APP_COMMON_LIB_PATH + "browser/service",
            "text": APP_COMMON_LIB_PATH + "requirejs-plugins/text",
            "json": APP_COMMON_LIB_PATH + "requirejs-plugins/json"
        },
        waitSeconds: 0
    }
);

define(
    ["json!meta.json", "json!" + APP_COMMON_LIB_PATH + "registry.json", "app-util", "app-route", "app-extension", "app-service-registry", "app-service"],
    function (meta, registry) {
        var utilConfig = arguments[2],
            routeConfig = arguments[3],
            extension = arguments[4],
            registryConfig = arguments[5],
            appConfigs = Array.prototype.slice.call(arguments, 6);

        return function (appModule, callback) {
            if (isBrowser) {
                utilConfig(appModule);

                routeConfig(appModule, meta);

                registryConfig(appModule, registry);

                appConfigs.forEach(function (config) {
                    config(appModule, extension, meta);
                });

                //Load artifact spec and configure each artifact
                var artifacts = meta.artifacts;
                if (artifacts && artifacts.length) {
                    var artifactUrls = [];

                    artifacts.forEach(function (artifact) {
                        artifactUrls.push(APP_LIB_PATH + "repo/" + artifact.type + "/" + artifact.libraryName + "/" + artifact.artifactId + "/" + artifact.version + "/" + "main");
                    });

                    requirejs(artifactUrls, function () {
                        var artifactConfigs = Array.prototype.slice.call(arguments),
                            directiveUrls = [];

                        artifactConfigs.forEach(function (artifactConfig, index) {
                            var repoUrl = artifactUrls[index].replace(/(.+)\/main$/g, "$1"),
                                artifactId = artifacts[index].artifactId;

                            artifactConfig.stylesheets && artifactConfig.stylesheets.forEach(function (href) {
                                var link = document.createElement("link");

                                link.type = "text/css";
                                link.rel = "stylesheet";
                                link.href = "{0}/{1}".format(repoUrl, href);
                                link.setAttribute("artifact", artifactId)

                                document.getElementsByTagName("head")[0].appendChild(link);
                            });

                            artifactConfig.js && artifactConfig.js.forEach(function (src) {
                                var requireUrl = "{0}/{1}".format(repoUrl, src);

                                if (!requirejs.defined(requireUrl)) {
                                    directiveUrls.push({base: repoUrl, absolute: requireUrl});
                                }
                            });
                        });

                        if (directiveUrls.length) {
                            var jsArr = _.pluck(directiveUrls, "absolute");
                            jsArr.splice(0, 0, "app-extension") && requirejs(jsArr, function () {
                                var configs = Array.prototype.slice.call(arguments, 1),
                                    extension = arguments[0];

                                configs.forEach(function (config, index) {
                                    appModule.
                                        config(["$provide", "$controllerProvider", "$compileProvider", "$injector", function ($provide, $controllerProvider, $compileProvider, $injector) {
                                            config($injector, $compileProvider, $controllerProvider, extension, directiveUrls[index].base);
                                        }]);
                                });

                                callback && callback();
                            })
                        } else {
                            callback && callback();
                        }
                    });

                    return;
                }
            }

            callback && callback();
        }
    }
);