define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $compile, $cookies, $cookieStore) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$compile", "$cookies", "$cookieStore"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        };

        appService.prototype.loadRepoArtifact = function (repoArtifact, repoLibName, version, demoSelector) {
            version = version || repoArtifact.versionList[repoArtifact.versionList.length - 1].name;

            var self = this,
                defer = self.$q.defer(),
                loadedSpec = {
                    name: repoArtifact.name,
                    artifactId: repoArtifact._id,
                    libraryName: repoLibName,
                    version: version,
                    type: repoArtifact.type
                },
                repoUrl = "repo/{0}/{1}/{2}/{3}".format(
                    repoArtifact.type,
                    repoLibName,
                    repoArtifact._id,
                    version);

            require(["{0}/main".format(repoUrl)],
                function (artifact) {
                    function requireArtifact(artifact) {
                        artifact.stylesheets && artifact.stylesheets.forEach(function (href) {
                            var link = document.createElement("link");
                            link.type = "text/css";
                            link.rel = "stylesheet";
                            link.href = "{0}/{1}".format(repoUrl, href);
                            document.getElementsByTagName("head")[0].appendChild(link);

                            (loadedSpec.stylesheets = loadedSpec.stylesheets || []).push(link.href);
                        });

                        if (artifact.template)
                            loadedSpec.template = "{0}/{1}".format(repoUrl, artifact.template);

                        loadedSpec.configuration = artifact.configuration;

                        var jsArr = [],
                            qArr = [];

                        if (artifact.json) {
                            loadedSpec.json = "{0}/{1}".format(repoUrl, artifact.json);

                            qArr.push(self.$http.get("{0}/{1}".format(repoUrl, artifact.json)).then(
                                function (result) {
                                    var jsonDefer = self.$q.defer();

                                    repoArtifact.json = result.data;
                                    self.$timeout(function () {
                                        jsonDefer.resolve();
                                    });

                                    return jsonDefer.promise;
                                }, function () {
                                    var errDefer = self.$q.defer();

                                    self.$timeout(function () {
                                        errDefer.reject();
                                    });

                                    return errDefer.promise;
                                }
                            ));
                        }

                        artifact.js && artifact.js.forEach(function (src) {
                            var requireUrl = "{0}/{1}".format(repoUrl, src);
                            (loadedSpec.js = loadedSpec.js || []).push(requireUrl);

                            if (!require.defined(requireUrl)) {
                                jsArr.push(requireUrl);
                            }
                        });
                        if (jsArr.length) {
                            qArr.push((function () {
                                var jsDefer = self.$q.defer();

                                jsArr.splice(0, 0, "ng.ui.extension") && require(jsArr, function () {
                                    var args = Array.prototype.slice.apply(arguments),
                                        configs = Array.prototype.slice.call(args, 1),
                                        extension = args[0];

                                    configs.forEach(function (config) {
                                        config(self.$injector, self.$compileProvider, self.$controllerProvider, extension, repoUrl);
                                    });

                                    jsDefer.resolve();
                                })

                                return jsDefer.promise;
                            })());
                        }

                        return self.$q.all(qArr).then(
                            function () {
                                var artifactDefer = self.$q.defer();

                                self.$timeout(function () {
                                    artifactDefer.resolve(loadedSpec);
                                });

                                return artifactDefer.promise;

                            }, function () {
                                var errDefer = self.$q.defer();

                                self.$timeout(function () {
                                    errDefer.reject();
                                });

                                return errDefer.promise;
                            }
                        );
                    }

                    function requireDemo(artifact, loadedSpec) {
                        var demoSpec = artifact.demo,
                            demoDefer = self.$q.defer();

                        if (demoSpec && demoSpec.url && demoSelector) {
                            loadedSpec.demo = {};

                            demoSpec.stylesheets && demoSpec.stylesheets.forEach(function (href) {
                                var link = document.createElement("link");
                                link.type = "text/css";
                                link.rel = "stylesheet";
                                link.href = "{0}/{1}".format(repoUrl, href);
                                document.getElementsByTagName("head")[0].appendChild(link);

                                (loadedSpec.demo.stylesheets = loadedSpec.demo.stylesheets || []).push(link.href);
                            });

                            var jsArr = [],
                                demoRequireDefer = self.$q.defer();

                            demoSpec.js && demoSpec.js.forEach(function (src) {
                                jsArr.push("{0}/{1}".format(repoUrl, src));

                                (loadedSpec.demo.js = loadedSpec.demo.js || []).push("{0}/{1}".format(repoUrl, src));
                            });
                            if (jsArr.length) {
                                jsArr.splice(0, 0, "ng.ui.extension") && require(jsArr, function () {
                                    var configs = Array.prototype.slice.call(arguments, 1),
                                        extension = arguments[0];

                                    configs.forEach(function (config) {
                                        config(self.$injector, self.$compileProvider, self.$controllerProvider, extension, repoUrl);
                                    });

                                    demoRequireDefer.resolve();
                                })
                            } else {
                                self.$timeout(function () {
                                    demoRequireDefer.resolve();
                                });
                            }

                            demoRequireDefer.promise.then(function () {
                                var $el;
                                if (typeof demoSelector == "string")
                                    $el = $(demoSelector);
                                else if (demoSelector && typeof demoSelector === "object")
                                    $el = demoSelector.jquery && demoSelector || $(demoSelector);

                                if ($el) {
                                    $el.empty();
                                    $el.attr("ng-include", "'{0}/{1}'".format(repoUrl, demoSpec.url));
                                    var scope = angular.element($el.parent()).scope();
                                    self.$compile($el.parent())(scope);
                                }

                                demoDefer.resolve(loadedSpec);
                            });
                        } else {
                            self.$timeout(function () {
                                demoDefer.resolve(loadedSpec);
                            });
                        }

                        return demoDefer.promise;
                    }

                    requireArtifact(artifact).then(
                        function (loadedSpec) {
                            return requireDemo(artifact, loadedSpec);
                        }, function () {
                            defer.reject();
                        }
                    ).then(
                        function (loadedSpec) {
                            defer.resolve(loadedSpec);
                        }, function () {
                            defer.reject();
                        }
                    );
                }
            );

            return defer.promise;
        }

        appService.prototype.loadArtifactList = function (type) {
            var self = this,
                listName = type + "LibraryList",
                artifactLibraryList = self.$rootScope[listName] || [],
                libraryFilter = {type: type};
            self.$rootScope[listName] = artifactLibraryList;

            if (artifactLibraryList.length) {
                var updateTime = _.max(artifactLibraryList, function (library) {
                    return library.updateTime;
                });
                libraryFilter.updateTime = {$gte: updateTime};
            }

            return self.getRepoLibrary(libraryFilter).then(function (result) {
                var libraryList = result.data.result == "OK" && result.data.resultValue || [],
                    reloadCount = 0,
                    defer = self.$q.defer();

                //Update already loaded library, append recent library
                artifactLibraryList.forEach(function (loadedLibrary) {
                    var index;
                    if (!libraryList.every(function (library, i) {
                            if (library._id === loadedLibrary._id) {
                                index = i;
                                return false;
                            }

                            return true;
                        })) {
                        _.extend(loadedLibrary, libraryList[index]);
                        libraryList.splice(index, 1);
                        reloadCount++;
                        libraryList.splice(0, 0, loadedLibrary);
                    }
                });
                if (libraryList.length > reloadCount) {
                    var recentLoadedList = libraryList.slice(reloadCount, libraryList.length - reloadCount);
                    recentLoadedList.splice(0, 0, artifactLibraryList.length, 0);
                    Array.prototype.splice.apply(artifactLibraryList, recentLoadedList);
                }

                //Load each library's artifacts
                var promiseArr = [];
                libraryList.forEach(function (library) {
                    var artifactFilter = {library: library._id};
                    if (library.artifactList && library.artifactList.length) {
                        var updateTime = _.max(library.artifactList, function (artifact) {
                            return artifact.updateTime;
                        });

                        artifactFilter.updateTime = {$gte: updateTime};
                    }

                    promiseArr.push(self.getRepoArtifact(artifactFilter));
                });
                promiseArr.length && self.$q.all(promiseArr).then(
                    function (result) {
                        var artifactArr = [];

                        for (var i = 0; i < reloadCount; i++) {
                            var artifactList = result[i].data.result == "OK" && result[i].data.resultValue || [],
                                recentArtifactList = [];
                            artifactList.forEach(function (artifact) {
                                artifactArr.push({artifact: artifact, libraryName: libraryList[i].name});

                                if (libraryList[i].artifactList.every(function (loadedArtifact) {
                                        if (artifact._id === loadedArtifact._id) {
                                            _.extend(loadedArtifact, artifact);
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    recentArtifactList.push(artifact);
                                }
                            });

                            if (recentArtifactList.length) {
                                recentArtifactList.splice(0, 0, libraryList[i].artifactList.length, 0);
                                Array.prototype.apply(libraryList[i].artifactList, recentArtifactList);
                            }
                        }
                        for (var i = reloadCount; i < result.length; i++) {
                            libraryList[i].artifactList = result[i].data.result == "OK" && result[i].data.resultValue || [];

                            libraryList[i].artifactList.forEach(function (artifact) {
                                artifactArr.push({artifact: artifact, libraryName: libraryList[i].name});
                            });
                        }

                        defer.resolve(artifactArr);
                    }, function () {
                        defer.reject();
                    }
                ) || self.$timeout(function () {
                    defer.resolve();
                });

                return defer.promise;
            }).then(function (artifactArr) {
                var artifactPromiseArr = [],
                    aDefer = self.$q.defer();

                artifactArr && artifactArr.forEach(function (item) {
                    artifactPromiseArr.push(self.loadRepoArtifact(item.artifact, item.libraryName));
                });
                artifactPromiseArr && self.$q.all(artifactPromiseArr).then(
                    function () {
                        aDefer.resolve();
                    }, function () {
                        aDefer.reject();
                    }
                ) || self.$timeout(function () {
                    aDefer.resolve();
                });

                return aDefer.promise;
            }, function () {
                var errorDefer = self.$q.defer();

                self.$timeout(function () {
                    errorDefer.reject();
                });

                return errorDefer.promise;
            });
        }

        appService.prototype.loadIconArtifactList = function () {
            return this.loadArtifactList("icon");
        }

        appService.prototype.loadWidgetArtifactList = function () {
            return this.loadArtifactList("widget");
        }

        appService.prototype.addConfigurableArtifact = function (projectId, widgetId, libraryName, artifactId, type, version) {
            var self = this;

            return self.$http({
                method: 'POST',
                url: '/api/public/configurableArtifact',
                params: {
                    projectId: projectId,
                    widgetId: widgetId,
                    libraryName: libraryName,
                    artifactId: artifactId,
                    type: type,
                    version: version
                }
            }).then(function (result) {
                var defer = self.$q.defer();

                if (result.data.result === "OK") {
                    defer.resolve();
                } else {
                    self.$timeout(function () {
                        defer.reject();
                    });
                }

                return defer.promise;
            }, function () {
                var errDefer = self.$q.defer();

                self.$timeout(function () {
                    errDefer.reject();
                });

                return errDefer.promise;
            });
        };

        appService.prototype.deleteConfigurableArtifact = function (projectId, widgetId, artifactId) {
            var self = this;

            return self.$http({
                method: 'DELETE',
                url: '/api/public/configurableArtifact',
                params: {
                    projectId: projectId,
                    widgetId: widgetId,
                    artifactId: artifactId
                }
            }).then(function (result) {
                var defer = self.$q.defer();

                if (result.data.result === "OK") {
                    defer.resolve();
                } else {
                    self.$timeout(function () {
                        defer.reject();
                    });
                }

                return defer.promise;
            }, function () {
                var errDefer = self.$q.defer();

                self.$timeout(function () {
                    errDefer.reject();
                });

                return errDefer.promise;
            });
        };

        appService.prototype.updateConfigurableArtifact = function (projectId, widgetId, artifactId, configurationArray) {
            var self = this,
                configuration = {};

            _.each(configurationArray, function (obj) {
                configuration[obj.key] = obj.value;
            });

            return self.$http({
                method: 'PUT',
                url: '/api/public/configurableArtifact',
                params: {
                    projectId: projectId,
                    widgetId: widgetId,
                    artifactId: artifactId,
                    configuration: JSON.stringify(configuration)
                }
            }).then(function (result) {
                var defer = self.$q.defer();

                if (result.data.result === "OK") {
                    configurationArray && configurationArray.splice(0, configurationArray.length);
                    defer.resolve();
                } else {
                    self.$timeout(function () {
                        defer.reject();
                    });
                }

                return defer.promise;
            }, function () {
                var errDefer = self.$q.defer();

                self.$timeout(function () {
                    errDefer.reject();
                });

                return errDefer.promise;
            });
        };

        appService.prototype.saveSketch = function (projectId, sketchWorks) {
            return this.$http({
                method: 'POST',
                url: '/api/public/sketch',
                params: {projectId: projectId, sketchWorks: JSON.stringify(sketchWorks)}
            });
        }

        appService.prototype.loadSketch = function (projectId) {
            var self = this;

            return self.$http({
                method: 'GET',
                url: '/api/public/sketch',
                params: {projectId: projectId}
            }).then(function (result) {
                var defer = self.$q.defer();

                if (result.data.result === "OK") {
                    var resultValue = JSON.parse(result.data.resultValue);
                    self.$timeout(function () {
                        defer.resolve(resultValue.pages);
                    });
                } else {
                    self.$timeout(function () {
                        defer.reject();
                    });
                }

                return defer.promise;
            });
        }

        appService.prototype.removeProjectImage = function (projectId, fileName) {
            fileName = fileName.replace(/(.+\/)?([^\/]+)$/, "$2");
            return this.$http({
                method: 'DELETE',
                url: '/api/public/projectImage',
                params: {projectId: projectId, fileName: fileName}
            });
        }

        appService.prototype.getUser = function (userFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/user',
                params: {userFilter: JSON.stringify(userFilter || {})}
            });

        }

        appService.prototype.getRepoLibrary = function (libraryFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/repoLibrary',
                params: {libraryFilter: JSON.stringify(libraryFilter || {})}
            });

        }

        appService.prototype.getRepoArtifact = function (artifactFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/repoArtifact',
                params: {artifactFilter: JSON.stringify(artifactFilter || {})}
            });

        }

        appService.prototype.getUserDetail = function (userFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/userDetail',
                params: {userFilter: JSON.stringify(userFilter || {})}
            });

        }

        appService.prototype.getProjectDetail = function (projectFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/projectDetail',
                params: {projectFilter: JSON.stringify(projectFilter || {})}
            });

        }

        appService.prototype.createProject = function (project) {
            return this.$http({
                method: 'POST',
                url: '/api/public/project',
                params: {project: JSON.stringify(_.omit(project, "$$hashKey", "artifactList"))}
            });

        }

        appService.prototype.modifyProject = function (project) {
            return this.$http({
                method: 'PUT',
                url: '/api/public/project',
                params: {
                    projectFilter: JSON.stringify({_id: project._id}),
                    project: JSON.stringify(_.omit(project, "$$hashKey", "artifactList"))
                }
            });

        }

        appService.prototype.deleteProject = function (project) {
            return this.$http({
                method: 'DELETE',
                url: '/api/public/project',
                params: {projectFilter: JSON.stringify({_id: project._id})}
            });

        }

        appService.prototype.selectRepoArtifact = function (artifactList, projectFilter) {
            if (!artifactList.length) {
                return appService.prototype.NOOP;
            } else {
                return this.$http({
                    method: 'POST',
                    url: '/api/public/userArtifactXref',
                    params: {
                        artifactList: JSON.stringify(artifactList),
                        projectFilter: JSON.stringify(projectFilter || {})
                    }
                });
            }
        }

        appService.prototype.unselectRepoArtifact = function (artifactIds, projectFilter) {
            if (!artifactIds.length || _.isEmpty(projectFilter)) {
                return appService.prototype.NOOP;
            } else {
                return this.$http({
                    method: 'DELETE',
                    url: '/api/public/userArtifactXref',
                    params: {
                        artifactIds: JSON.stringify(artifactIds),
                        projectFilter: JSON.stringify(projectFilter || {})
                    }
                });
            }
        }

        return function (appModule) {
            appModule.
                config(['$httpProvider',
                    function ($httpProvider) {
                        $httpProvider.defaults.useXDomain = true;
                        $httpProvider.defaults.withCredentials = true;
                        delete $httpProvider.defaults.headers.common['X-Requested-With'];
                    }
                ]).
                config(["$provide", "$controllerProvider", "$compileProvider", "$injector", function ($provide, $controllerProvider, $compileProvider, $injector) {
                    $provide.service('appService', appService);
                    appService.prototype.$controllerProvider = $controllerProvider;
                    appService.prototype.$compileProvider = $compileProvider;
                    appService.prototype.$injector = $injector;
                }]);
        }
    }
)
;