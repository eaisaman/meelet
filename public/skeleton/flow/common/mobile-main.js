define(
    ["json!" + APP_PROJECT_PATH + "meta.json"],
    function (meta) {
        return function (appModule, inject, callback) {
            if (isBrowser) {
                //Load artifact spec and configure each artifact
                var artifacts = meta.artifacts;
                if (artifacts && artifacts.length) {
                    var artifactUrls = [];

                    artifacts.forEach(function (artifact) {
                        artifactUrls.push(APP_PROJECT_PATH + "app/" + "repo/" + artifact.type + "/" + artifact.libraryName + "/" + artifact.artifactId + "/" + artifact.version + "/" + "main");
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
                                link.setAttribute("artifact", artifactId);

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
                                	config(inject.$injector, inject.$compileProvider, inject.$controllerProvider, extension, directiveUrls[index].base);
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