define(
    ["angular", "jquery", "jquery-ui", "app-util", "app-route", "app-filter", "app-service"],
    function () {
        function RootController($scope, $rootScope, $q, appService, urlService) {
            $q.all([appService.getRepoLibrary(), appService.getUserDetail({"_id": "52591a12c763d5e4585563d0"}), appService.getUser({"loginName": "wangxinyun28"})]).then(function (result) {
                $rootScope.repoLibraryList = result[0] && result[0].data.result == "OK" && result[0].data.resultValue || [];
                result[1] && result[1].data.result == "OK" && _.extend($rootScope.userDetail, result[1].data.resultValue[0]);
                result[2] && result[2].data.result == "OK" && _.extend($rootScope.loginUser, result[2].data.resultValue[0]);

                urlService.project();
            });
            $rootScope.repoLibraryList = [];
            $rootScope.iconLibraryList = [];
            $rootScope.myRepoList = [];
            $rootScope.loginUser = {};
            $rootScope.userDetail = {projectList: []};
            $scope.urlService = urlService;

            $scope.markSelection = function (array, others, props) {
                if (toString.call(array) === '[object Array]' && array.length) {
                    array.forEach(function (item) {
                        item._selected = false;
                    });

                    if (others && others.length) {
                        if (props) {
                            if (typeof props === "string") {
                                props = [props];
                            }

                            if (toString.call(props) === '[object Array]') {
                                array.forEach(function (item) {
                                    if (!others.every(function (o) {
                                            return !props.every(function (prop) {
                                                return o[prop] === item[prop];
                                            });
                                        })) {
                                        item._selected = true;
                                    }
                                });
                            }
                        } else {
                            array.forEach(function (item) {
                                item._selected = false;

                                if (!others.every(function (o) {
                                        return o !== item;
                                    })) {
                                    item._selected = true;
                                }
                            });
                        }
                    }
                }

                return array;
            };
        }

        function FrameSketchController($scope, $rootScope, $timeout, $q, angularEventTypes, uiService) {
            $scope.zoomWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                if (scope.sketchObject.pickedPage && scope.sketchObject.pickedPage.$element) {
                    var id = scope.zoomId,
                        widgetObj;

                    if (id) {
                        widgetObj = $("#" + id).data("widgetObject");

                        widgetObj && widgetObj.zoomOut && widgetObj.zoomOut();
                        scope.scale = undefined;
                        scope.zoomId = null;
                    } else {
                        widgetObj = scope.sketchObject.pickedWidget;

                        if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                            scope.scale = widgetObj.zoomIn(scope.sketchObject.pickedPage.$element);
                            scope.zoomId = widgetObj.id;
                        }
                    }
                }
            }

            $scope.locateWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                    var nodeScope = angular.element($("#" + angularConstants.treeNodeIdPrefix + widgetObj.id)).scope();
                    if (nodeScope) {
                        nodeScope.exclusiveSelect && nodeScope.exclusiveSelect();
                        nodeScope.expandVisible && nodeScope.expandVisible();
                    }
                }
            }

            $scope.duplicateWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement) {
                    var $parent = widgetObj.$element.parent();
                    if ($parent.length) {
                        var cloneObj = uiService.copyWidget(widgetObj, $parent),
                            left = ($parent.width() - cloneObj.$element.width()) / 2,
                            top = ($parent.height() - cloneObj.$element.height()) / 2;

                        left = Math.floor(left * 100) / 100, top = Math.floor(top * 100) / 100;

                        cloneObj.css("left", left + "px");
                        cloneObj.css("top", top + "px");

                        $timeout(function () {
                            var manager = cloneObj.$element.data("hammer"),
                                element = cloneObj.$element.get(0);

                            manager.emit("tap", {target: element, srcEvent: {target: element}});
                        });
                    }
                }
            }

            $scope.alignLeft = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignLeft && widgetObj.alignLeft();
                }
            }

            $scope.alignCenter = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignCenter && widgetObj.alignCenter();
                }
            }

            $scope.alignRight = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignRight && widgetObj.alignRight();
                }
            }

            $scope.groupWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.setTemporary(false);
                }
            }

            $scope.ungroupWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement) {
                    widgetObj.disassemble();
                }
            }

            $scope.toggleRuler = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                scope.sketchWidgetSetting.showRuler = !scope.sketchWidgetSetting.showRuler;
            }

            $scope.togglePlayWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                scope.sketchWidgetSetting.isPlaying = !scope.sketchWidgetSetting.isPlaying;
            }

            $scope.saveSketch = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                return appService.saveSketch(scope.sketchObject.sketchWorks);
            }

            $scope.loadSketch = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                return appService.loadSketch(scope.sketchObject.sketchWorks);
            }

            $scope.loadProject = function (event) {
                event && event.stopPropagation && event.stopPropagation();
            }

            function setterFactory(obj, name, source) {
                return function (to) {
                    var setterName = source && "setTrackablePseudoStyle" || ("set" + name.charAt(0).toUpperCase() + name.substr(1)),
                        setter = obj[setterName];
                    if (setter) {
                        if (source)
                            setter.apply(obj, [source, to]);
                        else
                            setter.apply(obj, [to]);
                    }
                }
            }

            function initWidgetSettingWatch(setting) {
                if ($scope.sketchObject.pickedWidget) {
                    setting.deregisterWatch && setting.deregisterWatch();

                    var name = setting.name,
                        source = setting.source,
                        getterName = source && "getTrackablePseudoStyle" || ("get" + name.charAt(0).toUpperCase() + name.substr(1));

                    var getter = $scope.sketchObject.pickedWidget[getterName];
                    if (getter) {
                        var value;
                        if (source)
                            value = getter.apply($scope.sketchObject.pickedWidget, [source]);
                        else
                            value = getter.apply($scope.sketchObject.pickedWidget);
                        $scope.sketchWidgetSetting[name] = value;
                        setting.initFn && setting.initFn(value);
                    }

                    $timeout(function () {
                        setting.deregisterWatch = $scope.$watch("sketchWidgetSetting" + "." + name, setterFactory($scope.sketchObject.pickedWidget, name, source));
                    });
                }
            }

            $scope.$watch("sketchObject.pickedWidget", function (to) {
                if (!to) {
                    $scope.sketchObject.pickedWidget = $scope.sketchObject.pickedPage;
                }
            });

            $scope.$watch("sketchObject.pickedWidget.state", function (to) {
                if (to) {
                    widgetSettingList.forEach(function (setting) {
                        initWidgetSettingWatch(setting);
                    });
                }
            });

            $scope.$watch("sketchObject.pickedPage", function (to) {
                if (to) {
                    $scope.sketchObject.pickedWidget = to;
                    $scope.sketchObject.sketchWorks.pages.forEach(function (p) {
                        p.id != to.id && p.showHide(false);
                    });
                    to.showHide(true);
                }
            });

            $scope.$watch("sketchObject.sketchWorks.pages", function (to, from) {
                if (from !== to) {
                    from && from.forEach(function (oldPageObj) {
                        oldPageObj.remove();
                    });

                    if (to && to.length) {
                        var $deviceHolder = $(".deviceHolder");
                        to.forEach(function (pageObj) {
                            uiService.createPage($deviceHolder, pageObj);
                        });

                        $scope.sketchObject.pickedPage = to[0];
                    }
                }
            });

            //Receive control directive settings of bound properties
            $scope.$on(angularEventTypes.boundPropertiesEvent, function (event, data) {
                for (var key in data) {
                    var prop = data[key].prop;
                    if (typeof prop === "string") {
                        var m = prop.match(/^sketchWidgetSetting\.(\w+)/);
                        if (m && m.length == 2) {
                            var name = m[1],
                                setting = {name: name, initFn: data[key].initFn, source: data[key].source};

                            widgetSettingList.push(setting);
                            initWidgetSettingWatch(setting);
                        }
                    }
                }
            });

            function initMaster() {
                var urlParams = $rootScope.urlParams && $rootScope.urlParams["frameSketch"] || null,
                    project = urlParams && urlParams.project || null;

                $scope.project = project;
            }

            initMaster();

            function initSketch() {
                var defer = $q.defer();

                $timeout(function () {
                    var pageObj = uiService.createPage($(".deviceHolder"));
                    pageObj.addClass("pageHolder");
                    $scope.sketchObject.pickedPage = pageObj;
                    $scope.sketchObject.sketchWorks.pages.push(pageObj);

                    CKEDITOR.inline('widgetText');

                    defer.resolve();
                });

                return defer.promise;
            }

            $scope.$on("$routeChangeSuccess", function (scope, next, current) {
                $q.all([initSketch()]);
            });

            var widgetSettingList = [];

            $scope.Math = Math;
            $scope.sketchWidgetSetting = {};
            $scope.sketchPageSetting = {};
            $scope.sketchObject = {sketchWorks: {pages: []}};
            $scope.sketchDevice = {
                type: "desktop",
                width: 1024,
                height: 768,
                img: "device_ipad_horizontal.svg",
                rulerMarkerCount: 12
            };
            $scope.dockAlign = "align-left";
            $scope.iconLibraryList = $rootScope.iconLibraryList;

            $rootScope.visiblePseudoEnabledWidgets = [];
        }

        function ProjectController($scope, $rootScope, $timeout, $q, angularConstants, appService, urlService) {
            $scope.displayProjectCreation = function (event) {
                event && event.stopPropagation();

                $(".topbarToggleButton.select").removeClass("select");
                $(".projectActionConfirmBar").removeClass("select");
                $scope.toggleCheckMode = false;
                $scope.toggleEditMode = false;
                $scope.pickedProject = {forbidden: false, userId: $scope.loginUser._id};

                var scope = angular.element($(".projectContainer > .modalWindowContainer > .md-modal")).scope();
                scope.toggleModalWindow();

                return true;
            }

            $scope.displayProjectEdit = function (project, event) {
                event && event.stopPropagation();

                $scope.selectedProject = project;
                $scope.pickedProject = _.clone($scope.selectedProject);

                var scope = angular.element($(".projectContainer .md-modal")).scope();
                scope.toggleModalWindow();

                return true;
            }

            $scope.hideProjectModal = function (event) {
                event && event.stopPropagation();

                var scope = angular.element($(".projectContainer .md-modal")).scope();
                scope.toggleModalWindow();
            }

            $scope.toggleProjectButton = function (event) {
                event && event.stopPropagation();

                var $el = $(event.target);
                !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                $el.toggleClass("select");
                $scope.toggleCheckMode = $el.hasClass("select");
                $scope.toggleEditMode = false;
            }

            $scope.toggleProjectEditButton = function (event) {
                event && event.stopPropagation();

                var $el = $(event.target);
                !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                $el.toggleClass("select");
                $scope.toggleCheckMode = false;
                $scope.toggleEditMode = !$scope.toggleEditMode;
            }

            $scope.toggleCheck = function (project, event) {
                event && event.stopPropagation();

                project.checked = !project.checked;
                !project.checked && delete project.checked;
            }

            $scope.addProject = function (project, event) {
                event && event.stopPropagation();

                appService.createProject(project).then(function (result) {
                    result && result.data.result == "OK" && _.extend(project, result.data.resultValue);

                    $rootScope.userDetail.projectList.push(project);
                    $scope.hideProjectModal();
                });
            }

            $scope.modifyProject = function (project, event) {
                event && event.stopPropagation();

                appService.modifyProject(project).then(function (result) {
                    result && result.data.result == "OK" && _.extend($scope.selectedProject, result.data.resultValue[0]);

                    $scope.hideProjectModal();
                });
            }

            $scope.removeProject = function (project, event) {
                event && event.stopPropagation();

                $(".topbarToggleButton.select").removeClass("select");

                appService.deleteProject(project).then(function (result) {
                    if (result && result.data.result == "OK") {
                        var index;
                        if (!$rootScope.userDetail.projectList.every(function (p, i) {
                                if (p._id === project._id) {
                                    index = i;
                                    return false;
                                }
                                return true;
                            })) {
                            $rootScope.userDetail.projectList.splice(index, 1);
                        }
                    }
                });
            }

            function initMaster() {
                var urlParams = $rootScope.urlParams && $rootScope.urlParams["project"] || null,
                    projectAction = urlParams && urlParams.projectAction || "";

                if (projectAction === "create") {
                    delete urlParams.projectAction;

                    $timeout(function () {
                        $scope.displayProjectCreation();
                    }, angularConstants.actionDelay);
                }
            }

            initMaster();

            $scope.classie = classie;
            $scope._ = _;
        }

        function RepoController($scope, $rootScope, $timeout, $q, angularConstants, appService, urlService) {
            $scope.setRepoType = function (repoTypeValue) {
                appService.getRepoLibrary(repoTypeValue && {type: repoTypeValue} || {}).then(function (result) {
                    $rootScope.repoLibraryList = result.data.result == "OK" && result.data.resultValue || [];
                });
            }

            $scope.toggleRepoLibSelection = function (repoLib, event) {
                event && event.stopPropagation();

                var index;
                if (!$rootScope.myRepoList.every(function (r, i) {
                        if (r._id === repoLib._id) {
                            index = i;
                            return false;
                        }

                        return true;
                    })) {
                    $rootScope.myRepoList.splice(index, 1);
                } else {
                    $rootScope.myRepoList.push(repoLib);
                }

                return true;
            }

            function initMaster() {
                var urlParams = $rootScope.urlParams && $rootScope.urlParams["repo"] || null,
                    project = urlParams && urlParams.project || null;

                $scope.project = project;
            };

            initMaster();

            $scope.repoTypes = angularConstants.repoTypes;
            $scope.classie = classie;
            $scope._ = _;
        }

        function RepoLibController($scope, $rootScope, $timeout, $q, angularConstants, appService, urlService) {
            $scope.getCurrentVersion = function (repoArtifact) {
                if (repoArtifact._selected) {
                    $scope.project.artifactList.every(function (a) {
                        if (a._id === repoArtifact._id) {
                            repoArtifact._version = a.version;
                            return false;
                        }
                        return true;
                    });
                } else {
                    delete repoArtifact._version;
                }
            }

            $scope.toggleRepoArtifactSelection = function (repoArtifact, event) {
                event && event.stopPropagation();

                var index;
                if (!$scope.project.artifactList.every(function (a, i) {
                        if (a._id === repoArtifact._id) {
                            index = i;
                            return false;
                        }

                        return true;
                    })) {
                    appService.unselectRepoArtifact([repoArtifact._id], {_id: $scope.project._id}).then(function () {
                        $scope.project.artifactList.splice(index, 1);
                        delete repoArtifact._version;
                    });
                } else {
                    var artifact = _.clone(repoArtifact);
                    artifact.version = (repoArtifact.versionList.length && repoArtifact.versionList[0].name);
                    artifact.version && appService.selectRepoArtifact([artifact], {_id: $scope.project._id}).then(function () {
                        $scope.project.artifactList.push(artifact);
                        repoArtifact._version = artifact.version;
                    });
                }

                return true;
            }

            $scope.showDemo = function (repoArtifact, event) {
                event && event.stopPropagation();

                appService.loadRepoArtifact(repoArtifact, $scope.repoLib.name, "#demoArea").then(function () {
                    var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                    scope.toggleModalWindow();
                });
            }

            $scope.hideDemo = function (repoArtifact, event) {
                event && event.stopPropagation();

                var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                scope.toggleModalWindow();
            }

            $scope.setArtifactVersion = function (repoArtifact) {
                var version = repoArtifact._version;

                if (version && $scope.project) {
                    var artifact;
                    if (!$scope.project.artifactList.every(function (a, i) {
                            if (a._id == repoArtifact._id) {
                                artifact = a;
                                return false;
                            }

                            return true;
                        })) {
                        if (artifact.version !== version) {
                            artifact.version = version;
                            appService.unselectRepoArtifact({_id: artifact._id}, {_id: $scope.project._id}).then(function () {
                                return appService.selectRepoArtifact([artifact], {_id: $scope.project._id});
                            });
                        }
                    }
                }

                $("#artifactVersionDropdown").toggleClass("select");
            }

            function initMaster() {
                var urlParams = $rootScope.urlParams && $rootScope.urlParams["repoLib"] || null,
                    repoLib = urlParams && urlParams.repoLib || null,
                    project = urlParams && urlParams.project || null;

                $scope.repoLib = repoLib;
                $scope.project = project;

                if (repoLib) {
                    var artifactFilter, projectFilter,
                        promiseArr = [];

                    repoLib.artifactList = repoLib.artifactList || [];
                    artifactFilter = {
                        library: repoLib._id,
                        forbidden: false
                    };
                    if (repoLib.updateTime) {
                        artifactFilter.updateTime = {$gte: repoLib.updateTime}
                    }

                    promiseArr.push(appService.getRepoArtifact(artifactFilter));

                    if (project) {
                        projectFilter = {_id: project._id};
                        if (project.updateTime) {
                            projectFilter.updateTime = {$gte: project.updateTime}
                        }
                        promiseArr.push(appService.getProjectDetail(projectFilter));
                    }

                    $q.all(promiseArr).then(function (result) {
                        if (result[0].data.result == "OK") {
                            repoLib.artifactList = result[0].data.resultValue;
                        }

                        if (result.length > 1) {
                            result[1].data.result == "OK" && _.extend(project, result[1].data.resultValue[0]);
                        }
                    });
                }
            };

            initMaster();

            $scope.classie = classie;
            $scope._ = _;
        }

        return function (appModule) {
            appModule.
                controller('RootController', ["$scope", "$rootScope", "$q", "appService", "urlService", RootController]).
                controller('FrameSketchController', ["$scope", "$rootScope", "$timeout", "$q", "angularEventTypes", "uiService", FrameSketchController]).
                controller('ProjectController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", ProjectController]).
                controller('RepoController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoController]).
                controller('RepoLibController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoLibController]);
        }
    });