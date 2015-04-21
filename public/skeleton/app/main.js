requirejs.config(
    {
        paths: {
            "app-route": APP_LIB_PATH + "route",
            "app-service": window.cordova && APP_LIB_PATH + "embedded/service" || APP_LIB_PATH + "browser/service",
            "app-controller": APP_LIB_PATH + "controller"
        }
    }
);

window.modouleLogger && window.modouleLogger.debug("App modules " + ["app-route", "app-service", "app-controller"].join(" ") + " Loading.");

define(
    ["app-route", "app-service", "app-controller"],
    function (appConfigs) {
        window.modouleLogger && window.modouleLogger.debug("App modules " + ["app-route", "app-service", "app-controller"].join(" ") + " Load Complete.");

        if (isBrowser) {
            return function (appModule) {
                //Load Artifacts
                window.modouleLogger && window.modouleLogger.debug("Artifacts Loading.");
                requirejs(APP_LIB_PATH + "repo/" + "artifacts.json", function (artifacts) {
                    window.modouleLogger && window.modouleLogger.debug("Artifacts Load Complete.");

                    //Load artifact spec and configure each artifact
                    artifacts && artifacts.forEach(function (artifact) {
                        var repoUrl = REPO_PATH + "/" + artifact.type + "/" + artifact.libraryName + "/" + artifact.artifactId + "/" + artifact.version,
                            artifactUrl = repoUrl + "/" + "main";

                        requirejs([artifactUrl], function (artifactConfig) {
                            artifactConfig.stylesheets && artifactConfig.stylesheets.forEach(function (href) {
                                var link = document.createElement("link");

                                link.type = "text/css";
                                link.rel = "stylesheet";
                                link.href = "{0}/{1}".format(repoUrl, href);
                                link.setAttribute("artifact", artifact.artifactId)

                                document.getElementsByTagName("head")[0].appendChild(link);
                            });

                            var jsArr = [];
                            artifactConfig.js && artifactConfig.js.forEach(function (src) {
                                var requireUrl = "{0}/{1}".format(repoUrl, src);

                                if (!requirejs.defined(requireUrl)) {
                                    jsArr.push(requireUrl);
                                }
                            });
                            if (jsArr.length) {
                                jsArr.splice(0, 0, "ng.ui.extension") && requirejs(jsArr, function () {
                                    var args = Array.prototype.slice.apply(arguments),
                                        configs = Array.prototype.slice.call(args, 1),
                                        extension = args[0];

                                    configs.forEach(function (config) {
                                        appModule.
                                            config(["$provide", "$controllerProvider", "$compileProvider", "$injector", function ($provide, $controllerProvider, $compileProvider, $injector) {
                                                config($injector, $compileProvider, $controllerProvider, extension, repoUrl);
                                            }]);
                                    });
                                })
                            }

                        });
                    });
                });

                //Load app relevant controller, filter, service, etc.
                appConfigs && appConfigs.forEach(function (config) {
                    config(appModule);
                });
            }
        } else {
            return function () {
            }
        }
    }
);