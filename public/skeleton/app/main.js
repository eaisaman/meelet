requirejs.config(
    {
        paths: {
            "app-route": APP_LIB_PATH + "route",
            "app-util": APP_LIB_PATH + "util",
            "app-filter": APP_LIB_PATH + "filter",
            "app-service": window.cordova && APP_LIB_PATH + "embedded/service" || APP_LIB_PATH + "browser/service",
            "app-controller": APP_LIB_PATH + "controller",
            "text": APP_LIB_PATH + "requirejs-plugins/text",
            "json": APP_LIB_PATH + "requirejs-plugins/json"
        }
    }
);

window.modouleLogger && window.modouleLogger.debug("App modules " + ["app-route", "app-util", "app-filter", "app-service", "app-controller"].join(" ") + " Loading.");

define(
    ["json!" + APP_LIB_PATH + "meta.json", "app-route", "app-util", "app-filter", "app-service", "app-controller"],
    function (meta) {
        window.modouleLogger && window.modouleLogger.debug("App modules " + ["app-route", "app-util", "app-filter", "app-service", "app-controller"].join(" ") + " Load Complete.");

        if (isBrowser) {
            var routeConfig = arguments[1],
                appConfigs = Array.prototype.slice.call(arguments, 2);

            return function (appModule, callback) {
                //Configure route
                routeConfig(appModule, meta);

                //Load app relevant controller, filter, service, etc.
                appConfigs && appConfigs.forEach(function (config) {
                    config(appModule, meta);
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
                            jsArr.splice(0, 0, "ng.ui.extension") && requirejs(jsArr, function () {
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
                } else {
                    callback && callback();
                }
            }
        } else {
            return function () {
            }
        }
    }
);