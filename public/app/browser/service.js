define(
    ["jquery", "angular"],
    function () {
        var FEATURE = "BaseService",
            PLATFORM = "browser",
            appService = function ($rootScope, $http, $timeout, $q, $exceptionHandler, $compile, $cookies, $cookieStore, utilService, serviceRegistry) {
                this.$rootScope = $rootScope;
                this.$http = $http;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$exceptionHandler = $exceptionHandler;
                this.$compile = $compile;
                this.$cookies = $cookies;
                this.$cookieStore = $cookieStore;
                this.utilService = utilService;
                this.serviceRegistry = serviceRegistry;
            };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$compile", "$cookies", "$cookieStore", "utilService"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        }

        appService.prototype.getResolveDefer = function (result) {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve(result);
            });

            return defer.promise;
        }

        appService.prototype.getRejectDefer = function (err) {
            var self = this,
                errorDefer = self.$q.defer();

            self.$timeout(function () {
                errorDefer.reject(err);
            });

            return errorDefer.promise;
        }

        appService.prototype.registerService = function () {
            this.serviceRegistry && this.serviceRegistry.register(this, FEATURE, PLATFORM);
        }

        appService.prototype.unregisterService = function () {
            this.serviceRegistry && this.serviceRegistry.unregister(FEATURE, PLATFORM);
        }

        appService.prototype.loadRepoArtifact = function (repoArtifact, repoLibId, repoLibName, version, demoSelector) {
            version = version || repoArtifact.versionList[repoArtifact.versionList.length - 1].name;

            var self = this,
                defer = self.$q.defer(),
                loadedSpec = {
                    name: repoArtifact.name,
                    artifactId: repoArtifact._id,
                    libraryId: repoLibId,
                    libraryName: repoLibName,
                    version: version,
                    type: repoArtifact.type,
                    projectId: self.$rootScope.loadedProject && self.$rootScope.loadedProject.projectRecord && self.$rootScope.loadedProject.projectRecord._id || ""
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
                            link.setAttribute("artifact", repoArtifact._id)

                            document.getElementsByTagName("head")[0].appendChild(link);

                            (loadedSpec.stylesheets = loadedSpec.stylesheets || []).push(link.href);
                        });

                        if (artifact.template)
                            loadedSpec.template = "{0}/{1}".format(repoUrl, artifact.template);

                        if (artifact.directiveName)
                            repoArtifact.directiveName = artifact.directiveName;

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

                            if (!requirejs.defined(requireUrl)) {
                                jsArr.push(requireUrl);
                            }
                        });
                        if (jsArr.length) {
                            qArr.push((function () {
                                var jsDefer = self.$q.defer();

                                jsArr.splice(0, 0, "ng.ui.extension") && requirejs(jsArr, function () {
                                    var args = Array.prototype.slice.apply(arguments),
                                        configs = Array.prototype.slice.call(args, 1),
                                        extension = args[0];

                                    configs.forEach(function (config) {
                                        config && config(self.$injector, self.$compileProvider, self.$controllerProvider, extension, repoUrl);
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
                                link.setAttribute("artifact", repoArtifact._id)

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
                                jsArr.splice(0, 0, "ng.ui.extension") && requirejs(jsArr, function () {
                                    var configs = Array.prototype.slice.call(arguments, 1),
                                        extension = arguments[0];

                                    configs.forEach(function (config) {
                                        config && config(self.$injector, self.$compileProvider, self.$controllerProvider, extension, repoUrl);
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

                    $("head link[type='text/css'][artifact={0}]".format(repoArtifact._id)).remove();
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

            return self.getRepoLibrary(libraryFilter).then(
                function (result) {
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
                                    artifactArr.push({
                                        artifact: artifact,
                                        libraryId: libraryList[i]._id,
                                        libraryName: libraryList[i].name
                                    });

                                    if ((libraryList[i].artifactList = libraryList[i].artifactList || []).every(function (loadedArtifact) {
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
                                    artifactArr.push({
                                        artifact: artifact,
                                        libraryId: libraryList[i]._id,
                                        libraryName: libraryList[i].name
                                    });
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
                },
                function (err) {
                    var errorDefer = self.$q.defer();

                    self.$timeout(function () {
                        errorDefer.reject(err);
                    });

                    return errorDefer.promise;
                }
            );
        }

        appService.prototype.loadEffectArtifactList = function () {
            var self = this;

            return this.loadArtifactList("effect").then(function (artifactArr) {
                    //Load each artifact's stylesheets
                    var promiseArr = [];
                    artifactArr && artifactArr.forEach(function (artifactObj) {
                        promiseArr.push(self.loadRepoArtifact(artifactObj.artifact, artifactObj.libraryId, artifactObj.libraryName));
                    });


                    return promiseArr.length && self.$q.all(promiseArr) || self.getResolveDefer();
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
        }

        appService.prototype.loadIconArtifactList = function () {
            var self = this;

            return this.loadArtifactList("icon").then(function (artifactArr) {
                    //Load each artifact's stylesheets
                    var promiseArr = [];
                    artifactArr && artifactArr.forEach(function (artifactObj) {
                        promiseArr.push(self.loadRepoArtifact(artifactObj.artifact, artifactObj.libraryId, artifactObj.libraryName));
                    });

                    return promiseArr.length && self.$q.all(promiseArr) || self.getResolveDefer();
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
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
                    $("head link[type='text/css'][widget='{0}']".format(widgetId)).remove();

                    self.$timeout(function () {
                        var link = document.createElement("link");
                        link.type = "text/css";
                        link.rel = "stylesheet";
                        link.href = "project/{0}/stylesheets/{1}".format(projectId, result.data.resultValue.css);
                        link.setAttribute("artifact", artifactId);
                        link.setAttribute("widget", widgetId);
                        link.setAttribute("projectId", projectId);

                        document.getElementsByTagName("head")[0].appendChild(link);

                        defer.resolve();
                    });
                } else {
                    self.$timeout(function () {
                        defer.reject(result.data.reason);
                    });
                }

                return defer.promise;
            }, function (err) {
                var errDefer = self.$q.defer();

                self.$timeout(function () {
                    errDefer.reject(err);
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
                if (result.data.result === "OK") {
                    $("head link[type='text/css'][widget='{0}']".format(widgetId)).remove();

                    return self.$timeout(function () {
                        var link = document.createElement("link");
                        link.type = "text/css";
                        link.rel = "stylesheet";
                        link.href = "project/{0}/stylesheets/{1}".format(projectId, result.data.resultValue.css);
                        link.setAttribute("artifact", artifactId);
                        link.setAttribute("widget", widgetId);

                        document.getElementsByTagName("head")[0].appendChild(link);
                    });
                } else {
                    return self.getRejectDefer(result.data.reason);
                }
            }, function (err) {
                return self.getRejectDefer(err);
            });
        };

        //FIXME Cache sketch to cookies

        appService.prototype.saveSketch = function (projectId, sketchWorks, stagingContent) {
            return this.$http({
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: 'POST',
                url: '/api/public/sketch',
                data: $.param({
                    projectId: projectId,
                    sketchWorks: JSON.stringify(sketchWorks),
                    stagingContent: JSON.stringify(stagingContent)
                })
            });
        }

        appService.prototype.loadSketch = function (projectId) {
            var self = this;

            return self.$http({
                method: 'GET',
                url: '/api/public/sketch',
                params: {projectId: projectId}
            }).then(function (result) {
                    if (result.data.result === "OK") {
                        var resultValue = JSON.parse(result.data.resultValue);
                        return self.getResolveDefer(resultValue);
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
        }

        appService.prototype.loadExternal = function (projectId) {
            var self = this;

            return self.$http({
                method: 'GET',
                url: '/api/public/external',
                params: {projectId: projectId}
            }).then(function (result) {
                    if (result.data.result === "OK") {
                        var resultValue = JSON.parse(result.data.resultValue);
                        return self.getResolveDefer(resultValue);
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
        }

        appService.prototype.saveFlow = function (projectId, flowWorks) {
            return this.$http({
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: 'POST',
                url: '/api/public/flow',
                data: $.param({
                    projectId: projectId,
                    flowWorks: JSON.stringify(flowWorks)
                })
            });
        }

        appService.prototype.loadFlow = function (projectId) {
            var self = this;

            return self.$http({
                method: 'GET',
                url: '/api/public/flow',
                params: {projectId: projectId}
            }).then(function (result) {
                    if (result.data.result === "OK") {
                        var resultValue = JSON.parse(result.data.resultValue);
                        return self.getResolveDefer(resultValue);
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
        }

        appService.prototype.lockProject = function (userId, projectId) {
            var self = this;

            return self.$http({
                method: 'PUT',
                url: '/api/public/project',
                params: {projectFilter: {_id: projectId, lock: false}, project: {lock: true, lockUser: userId}}
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        if (result.data.resultValue > 0) {
                            return self.getResolveDefer();
                        } else {
                            return self.getRejectDefer();
                        }
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            );
        }

        appService.prototype.unlockProject = function (userId, projectId) {
            var self = this;

            return self.$http({
                method: 'PUT',
                url: '/api/public/project',
                params: {projectFilter: {_id: projectId, lockUser: userId}, project: {lock: false, lockUser: null}}
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        if (result.data.resultValue > 0) {
                            return self.getResolveDefer();
                        } else {
                            return self.getRejectDefer();
                        }
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            )
        }

        appService.prototype.removeProjectImage = function (projectId, fileName) {
            fileName = fileName.replace(/(.+\/)?([^\/]+)$/, "$2");
            return this.$http({
                method: 'DELETE',
                url: '/api/public/projectImage',
                params: {projectId: projectId, fileName: fileName}
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

        appService.prototype.getProjectResource = function (projectId) {
            return this.$http({
                method: 'GET',
                url: '/api/public/projectResource',
                params: {projectId: projectId}
            });

        }

        appService.prototype.deleteProjectResource = function (projectId, resourceType, fileName) {
            return this.$http({
                method: 'DELETE',
                url: '/api/public/projectResource',
                params: {projectId: projectId, resourceType: resourceType, fileName: fileName}
            });

        }

        appService.prototype.getProjectDependency = function (xrefFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/projectArtifactXref',
                params: {xrefFilter: JSON.stringify(xrefFilter || {})}
            });

        }

        appService.prototype.updateProjectDependency = function (projectId, libraryId, artifactList) {
            return this.$http({
                method: 'POST',
                url: '/api/public/projectArtifactXref',
                params: {projectId: projectId, libraryId: libraryId, artifactList: JSON.stringify(artifactList || [])}
            });

        }

        appService.prototype.deleteProjectDependency = function (xrefFilter) {
            return this.$http({
                method: 'DELETE',
                url: '/api/public/projectArtifactXref',
                params: {xrefFilter: JSON.stringify(xrefFilter || {})}
            });
        }

        appService.prototype.createProject = function (project, sketchWorks) {
            var self = this;

            return this.$http({
                method: 'POST',
                url: '/api/public/project',
                params: {
                    project: JSON.stringify(_.omit(project, "$$hashKey", "artifactList")),
                    sketchWorks: JSON.stringify(sketchWorks)
                }
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        return self.getResolveDefer(result.data.resultValue);
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            )

        }

        appService.prototype.modifyProject = function (project) {
            var self = this;

            return self.$http({
                method: 'PUT',
                url: '/api/public/project',
                params: {
                    projectFilter: JSON.stringify({_id: project._id}),
                    project: JSON.stringify(_.omit(project, "$$hashKey", "artifactList"))
                }
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        return self.getResolveDefer();
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            )

        }

        appService.prototype.deleteProject = function (userId, project) {
            var self = this;

            return self.$http({
                method: 'DELETE',
                url: '/api/public/project',
                params: {projectFilter: JSON.stringify({userId: userId, _id: project._id})}
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        return self.getResolveDefer();
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            )
        }

        appService.prototype.convertToHtml = function (userId, projectId) {
            var self = this;

            return self.$http({
                method: 'POST',
                url: '/api/public/convertToHtml',
                params: {userId: userId, projectId: projectId}
            }).then(
                function (result) {
                    if (result.data.result === "OK") {
                        return self.getResolveDefer();
                    } else {
                        return self.getRejectDefer(result.data.reason);
                    }
                },
                function (err) {
                    return self.getRejectDefer(err);
                }
            )
        }

        appService.prototype.validateUrl = function (url) {
            var self = this;

            return self.$http.get(url).then(
                function () {
                    return self.getResolveDefer();
                }, function (err) {
                    return self.getRejectDefer(err);
                }
            )
        }

        /* Services managed by registry are visible to designer who can invoke in widget's action. */
        appService.prototype.refreshUser = function (loginName) {
            var self = this;

            return self.$http({
                method: 'get',
                url: '/api/private/user',
                params: {
                    userFilter: JSON.stringify({loginName: loginName})
                }
            }).then(function (result) {
                var defer = self.$q.defer(),
                    userObj = result.data && result.data.resultValue && result.data.resultValue.length && result.data.resultValue[0];

                self.$timeout(function () {
                    if (userObj) {
                        localStorage.loginUser = JSON.stringify(userObj);
                        self.$rootScope.loginUser = self.$rootScope.loginUser || {};
                        for (var key in self.$rootScope.loginUser) {
                            delete self.$rootScope.loginUser[key];
                        }

                        _.extend(self.$rootScope.loginUser, userObj);

                        defer.resolve(userObj);
                    } else {
                        defer.reject("User object not returned.");
                    }
                });

                return defer.promise;
            }, function (err) {
                return self.getRejectDefer(err);
            });
        }

        appService.prototype.doLogin = function (loginName, password) {
            var self = this,
                encoded = self.utilService.encode(loginName + ':' + password);

            this.$http.defaults.headers.common.Authorization = 'Basic ' + encoded;

            return self.refreshUser(loginName);
        }

        appService.prototype.doLogout = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                delete localStorage.loginUser;

                for (var key in self.$rootScope.loginUser) {
                    delete self.$rootScope.loginUser[key];
                }
                self.$cookieStore.remove("connect.sid");
                self.$http.defaults.headers.common.Authorization = "";

                defer.resolve();
            });

            return defer.promise;
        }

        appService.prototype.restoreUserFromStorage = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(
                function () {
                    var sid = self.$cookies["connect.sid"];

                    !sid && delete localStorage.loginUser;

                    self.$rootScope.loginUser = self.$rootScope.loginUser || {};

                    var userObj = eval("(" + localStorage.loginUser + ")");

                    for (var key in self.$rootScope.loginUser) {
                        delete self.$rootScope.loginUser[key];
                    }

                    _.extend(self.$rootScope.loginUser, userObj);

                    defer.resolve(userObj);
                }
            );

            return defer.promise;
        }

        appService.prototype.getUserDetail = function (userFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/private/userDetail',
                params: {userFilter: JSON.stringify(userFilter || {})}
            });

        }

        appService.prototype.getProject = function (projectFilter) {
            return this.$http({
                method: 'GET',
                url: '/api/public/project',
                params: {projectFilter: JSON.stringify(projectFilter || {})}
            });

        }

        appService.prototype.playSound = function (url) {
            var self = this;

            if (!self.soundDelegate) {
                var Constructor = function () {
                    this.audioSourceNode = null;
                    this.audioScriptNode = null;
                    this.audioContext = null;
                    this.offlineAudioContext = null;
                };

                Constructor.prototype.PLAYING_STATE = 0;
                Constructor.prototype.PAUSED_STATE = 1;
                Constructor.prototype.FINISHED_STATE = 2;
                Constructor.prototype.soundSeekPrecision = 100000;

                Constructor.prototype.createAudioProcessHandler = function (handler) {
                    var instance = this;

                    return function (event) {
                        var time = instance.audioContext.currentTime - instance.audioSourceNode.lastPlay,
                            duration = instance.audioSourceNode.buffer.duration;

                        if (time >= duration) {
                            instance.progress = 1;
                            self.$timeout(function () {
                                instance.stop();
                            });
                        } else {
                            instance.progress = Math.floor((time / duration) * instance.soundSeekPrecision) / instance.soundSeekPrecision;
                        }

                        handler && handler(instance.progress);
                    }
                }

                Constructor.prototype.init = function (buffer, callback) {
                    this.audioSourceNode = this.audioContext.createBufferSource();
                    this.audioSourceNode.playbackRate.value = 1;
                    this.audioSourceNode.buffer = buffer;

                    this.audioScriptNode = this.audioContext.createScriptProcessor(256);
                    this.audioScriptNode.onaudioprocess = this.createAudioProcessHandler(callback);

                    this.audioSourceNode.connect(this.audioContext.destination);
                    this.audioScriptNode.connect(this.audioContext.destination);
                }

                Constructor.prototype.play = function (url, callback) {
                    if (!this.offlineAudioContext) {
                        this.offlineAudioContext = new (
                            window.OfflineAudioContext || window.webkitOfflineAudioContext
                        )(1, 2, 44100);
                    }

                    if (!this.audioContext) {
                        this.audioContext = new (
                            window.AudioContext || window.webkitAudioContext
                        );
                    }

                    if (this.playState === this.PLAYING_STATE) {
                        if (this.url === url) {
                            return self.getResolveDefer();
                        }
                    }

                    if (this.url !== url) {
                        this.stop();

                        this.url = url;
                        var instance = this;
                        instance.playDefer = self.$q.defer();
                        self.$http({url: url, method: "GET", responseType: "arraybuffer"}).then(
                            function (result) {
                                instance.offlineAudioContext.decodeAudioData(result.data, function (buffer) {
                                    instance.playState = instance.PLAYING_STATE;
                                    instance.init(buffer, callback);
                                    instance.audioSourceNode.start(0, 0);
                                    instance.audioSourceNode.lastPlay = instance.audioContext.currentTime;
                                });
                            },
                            function (err) {
                                self.$exceptionHandler(err);
                                instance.playDefer.reject(err);
                                instance.playDefer = null;
                            }
                        );
                    } else {
                        this.playDefer = self.$q.defer();
                        this.audioSourceNode.start(0, this.audioSourceNode.buffer.duration * this.progress);
                        this.playState = this.PLAYING_STATE;
                    }

                    return this.playDefer.promise;
                }

                Constructor.prototype.pause = function () {
                    if (this.playState === this.PLAYING_STATE) {
                        if (this.audioSourceNode) {
                            this.audioSourceNode.stop(0);
                            this.playState = this.PAUSED_STATE;
                        }

                        if (this.playDefer) {
                            this.playDefer.resolve(this.progress);
                            this.playDefer = null;
                        }
                    }
                }

                Constructor.prototype.stop = function () {
                    if (this.audioSourceNode) {
                        this.audioSourceNode.stop(0);
                        this.audioSourceNode.disconnect();
                        this.audioSourceNode = null;
                    }
                    if (this.audioScriptNode) {
                        this.audioScriptNode.disconnect();
                        this.audioScriptNode.onaudioprocess = null;
                        this.audioScriptNode = null;
                    }
                    if (this.playDefer) {
                        this.playDefer.resolve(this.progress);
                        this.playDefer = null;
                    }
                    this.playState = this.FINISHED_STATE;
                    this.progress = 0;
                    this.url = null;
                }

                self.soundDelegate = new Constructor();
            }

            return self.soundDelegate.play(url);
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