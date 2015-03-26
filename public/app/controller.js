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
            $rootScope.effectLibraryList = [];
            $rootScope.iconLibraryList = [];
            $rootScope.widgetLibraryList = [];
            $rootScope.loginUser = {};
            $rootScope.userDetail = {projectList: []};
            $rootScope.loadedProject = null;
            $scope.urlService = urlService;

            $scope.markSelection = function (target, source, props) {
                if (toString.call(target) === '[object Array]' && target.length) {
                    target.forEach(function (item) {
                        item._selected = false;
                    });

                    if (source && source.length) {
                        if (props) {
                            target.forEach(function (item) {
                                if (!source.every(function (o) {
                                        return !props.every(function (prop) {
                                            return o[prop.source] === item[prop.target];
                                        });
                                    })) {
                                    item._selected = true;
                                }
                            });
                        } else {
                            target.forEach(function (item) {
                                item._selected = false;

                                if (!source.every(function (o) {
                                        return o !== item;
                                    })) {
                                    item._selected = true;
                                }
                            });
                        }
                    }
                }

                return target;
            };

        }

        function FrameSketchController($scope, $rootScope, $timeout, $q, $log, angularEventTypes, angularConstants, appService, uiService, uiUtilService) {
            $scope.zoomWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                if ($scope.sketchObject.pickedPage && $scope.sketchObject.pickedPage.$element) {
                    var id = $scope.zoomId,
                        widgetObj;

                    if (id) {
                        widgetObj = $("#" + id).data("widgetObject");

                        widgetObj && widgetObj.zoomOut && widgetObj.zoomOut();
                        $scope.scale = undefined;
                        $scope.zoomId = null;
                    } else {
                        widgetObj = $scope.sketchObject.pickedWidget;

                        if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                            $scope.scale = widgetObj.zoomIn($scope.sketchObject.pickedPage.$element);
                            $scope.zoomId = widgetObj.id;
                        }
                    }
                }
            }

            $scope.removeWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && !widgetObj.isTemporary && !widgetObj.isKindOf("PageSketchWidget")) {
                    widgetObj.dispose().then(function () {
                        $scope.sketchObject.pickedWidget = null;
                    });
                }
            }

            $scope.enableAddWidget = function (event) {
                function addWidgetHandler(event) {
                    var $container = $("." + angularConstants.widgetClasses.containerClass),
                        touchX = $shapeElement && $shapeElement.data("touchX") || 0,
                        touchY = $shapeElement && $shapeElement.data("touchY") || 0;

                    if (event.type === "panstart") {

                        $shapeElement = $("<div />");

                        $shapeElement.addClass("pickerPaneShape squarePane")
                            .css("z-index", angularConstants.draggingShapeZIndex);
                        $shapeElement.appendTo($container);

                        touchX = event.srcEvent.offsetX;
                        touchY = event.srcEvent.offsetY;
                        $shapeElement.data("touchX", touchX);
                        $shapeElement.data("touchY", touchY);
                    } else if ($shapeElement && event.type === "panmove") {
                        var left = event.srcEvent.clientX - $shapeElement.parent().offset().left + touchX,
                            top = event.srcEvent.clientY - $shapeElement.parent().offset().top + touchY;

                        $shapeElement.css("left", left + "px");
                        $shapeElement.css("top", top + "px");

                        var $to = $(event.srcEvent.toElement);
                        if ($to.hasClass(angularConstants.widgetClasses.widgetClass)) {
                            if (!$to.hasClass(angularConstants.widgetClasses.hoverClass)) {
                                $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                                $to.addClass(angularConstants.widgetClasses.hoverClass);
                            }
                        } else if ($to.hasClass(angularConstants.widgetClasses.holderClass)) {
                            $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                        }
                    } else if ($shapeElement && event.type === "panend") {
                        $shapeElement.remove();
                        $shapeElement = null;
                        $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);

                        var $to = $(event.srcEvent.toElement);

                        if (!$scope.sketchWidgetSetting.isPlaying && ($to.hasClass(angularConstants.widgetClasses.widgetClass) || $to.hasClass(angularConstants.widgetClasses.holderClass) || $to.attr(angularConstants.anchorAttr))) {
                            var x = event.srcEvent.clientX - $to.offset().left,
                                y = event.srcEvent.clientY - $to.offset().top;

                            x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                            y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                            uiUtilService.broadcast($scope,
                                angularEventTypes.beforeWidgetCreationEvent,
                                function (name) {
                                    if (name) {
                                        var widgetObj = uiService.createWidget($to);
                                        widgetObj.name = name;

                                        if (widgetObj) {
                                            widgetObj.css("left", x + "px");
                                            widgetObj.css("top", y + "px");
                                        }
                                    }
                                }
                            );
                        }
                    }

                    return uiUtilService.getResolveDefer();
                }

                event && event.stopPropagation && event.stopPropagation();

                var $el = $(event.target),
                    mc = $el.data("hammer"),
                    $shapeElement;

                if (!mc) {
                    mc = new Hammer.Manager(event.target);
                    mc.add(new Hammer.Press());
                    mc.add(new Hammer.Pan());
                    mc.on("panstart panmove panend", addWidgetHandler);
                    $el.data("hammer", mc);

                    $scope.$on('$destroy', function () {
                        mc.off("panstart panmove panend", addWidgetHandler);
                    });
                }
            }

            $scope.locateWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

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

                var widgetObj = $scope.sketchObject.pickedWidget;

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

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignLeft && widgetObj.alignLeft();
                }
            }

            $scope.alignCenter = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignCenter && widgetObj.alignCenter();
                }
            }

            $scope.alignRight = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.alignRight && widgetObj.alignRight();
                }
            }

            $scope.fillParent = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && !widgetObj.isTemporary) {
                    widgetObj.fillParent && widgetObj.fillParent();
                }
            }

            $scope.groupWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                    widgetObj.setTemporary(false);
                }
            }

            $scope.ungroupWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                if (widgetObj && widgetObj.isElement) {
                    widgetObj.disassemble();
                }
            }

            $scope.moveUpWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                widgetObj && widgetObj.moveAfter();
            }

            $scope.moveDownWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var widgetObj = $scope.sketchObject.pickedWidget;

                widgetObj && widgetObj.moveBefore();
            }

            $scope.toggleRuler = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                $scope.sketchWidgetSetting.showRuler = !$scope.sketchWidgetSetting.showRuler;
            }

            $scope.togglePlayWidget = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                $scope.sketchWidgetSetting.isPlaying = !$scope.sketchWidgetSetting.isPlaying;
            }

            $scope.saveProject = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                return $rootScope.loadedProject.save();
            }

            $scope.loadProject = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                $rootScope.loadedProject.unload();

                return uiUtilService.chain(
                    [
                        function () {
                            return $rootScope.loadedProject.load();
                        },
                        function () {
                            return $scope.renderProject();
                        }
                    ]
                );
            }

            $scope.renderProject = function () {
                return uiUtilService.whilst(function () {
                    return !$("." + angularConstants.widgetClasses.deviceHolderClass).length;
                }, function (callback) {
                    callback();
                }, function () {
                    if ($rootScope.loadedProject.sketchWorks.pages.length) {
                        uiService.createPage("." + angularConstants.widgetClasses.deviceHolderClass, $rootScope.loadedProject.sketchWorks.pages[0]).then(function (pageObj) {
                            $scope.sketchObject.pickedPage = pageObj;

                            CKEDITOR.inline('widgetText');
                        });
                    } else {
                        uiService.createPage("." + angularConstants.widgetClasses.deviceHolderClass).then(function (pageObj) {
                            $scope.sketchObject.pickedPage = pageObj;
                            $rootScope.loadedProject.sketchWorks.pages.push(pageObj);

                            CKEDITOR.inline('widgetText');
                        });
                    }
                }, angularConstants.checkInterval, "FrameSketchController.renderProject");
            }

            $scope.toggleLockProject = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                if ($rootScope.loadedProject.projectRecord.lock) {
                    return $rootScope.loadedProject.unlock($rootScope.loginUser._id);
                } else {
                    return $rootScope.loadedProject.tryLock($rootScope.loginUser._id);
                }
            }

            $scope.showDemo = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                $scope.modalUsage = "Demo";
                appService.loadRepoArtifact($scope.sketchWidgetSetting.pickedArtifact, $scope.sketchWidgetSetting.pickedLibrary._id, $scope.sketchWidgetSetting.pickedLibrary.name, "", "#frameSketchWidgetDemoArea").then(function () {
                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                    scope.toggleModalWindow();
                });
            }

            $scope.showWidgetName = function (callback, event) {
                event && event.stopPropagation && event.stopPropagation();

                $scope.modalUsage = "WidgetName";
                $("#newWidgetName").val("");
                if (callback) {
                    $scope.onModalClose = function () {
                        callback($("#newWidgetName").val());
                    };
                }
                var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                scope.toggleModalWindow();
            }

            $scope.hideModal = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                scope.toggleModalWindow().then(function () {
                    $scope.onModalClose = null;
                });
            }

            $scope.confirmWidgetName = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                scope.toggleModalWindow().then(function () {
                    $scope.onModalClose && $scope.onModalClose();
                    $scope.onModalClose = null;
                });
            }

            $scope.isConfigurable = function (widgetObj) {
                return uiService.isConfigurable(widgetObj);
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
                    $rootScope.loadedProject.sketchWorks.pages.forEach(function (p) {
                        p.id != to.id && p.showHide(false);
                    });
                    to.showHide(true);
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

            $scope.$on(angularEventTypes.beforeWidgetCreationEvent, function (event, fn) {
                $scope.showWidgetName(fn);
            });

            function initMaster() {
                $scope.project = $rootScope.loadedProject;
                $scope.renderProject();
            }

            initMaster();

            var widgetSettingList = [];

            $scope.uiService = uiService;
            $scope.Math = Math;
            $scope.sketchWidgetSetting = {
                isPlaying: false
            };
            $scope.sketchObject = {};
            $scope.sketchDevice = {
                type: "desktop",
                width: 1024,
                height: 768,
                img: "device_ipad_horizontal.svg",
                rulerMarkerCount: 12
            };
            $scope.dockAlign = "align-left";
            $scope.iconLibraryList = $rootScope.iconLibraryList;
            $scope.effectLibraryList = $rootScope.effectLibraryList;

            $rootScope.visiblePseudoEnabledWidgets = [];
        }

        function ProjectController($scope, $rootScope, $timeout, $q, angularConstants, appService, uiService, urlService) {
            $scope.displayProjectCreation = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                $(".topbarToggleButton.select").removeClass("select");
                $(".projectActionConfirmBar").removeClass("select");
                $scope.toggleCheckMode = false;
                $scope.toggleEditMode = false;
                $scope.pickedProject = {forbidden: false, userId: $rootScope.loginUser._id, lock: true};

                var scope = angular.element($(".projectContainer > .modalWindowContainer > .md-modal")).scope();
                scope.toggleModalWindow();

                return true;
            }

            $scope.displayProjectEdit = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                $scope.selectedProject = project;
                $scope.pickedProject = _.clone($scope.selectedProject);

                var scope = angular.element($(".projectContainer .md-modal")).scope();
                scope.toggleModalWindow();

                return true;
            }

            $scope.hideProjectModal = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var scope = angular.element($(".projectContainer .md-modal")).scope();
                scope.toggleModalWindow();
            }

            $scope.toggleProjectButton = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el = $(event.target);
                !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                $el.toggleClass("select");
                $scope.toggleCheckMode = $el.hasClass("select");
                $scope.toggleEditMode = false;
            }

            $scope.toggleProjectEditButton = function (event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el = $(event.target);
                !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                $el.toggleClass("select");
                $scope.toggleCheckMode = false;
                $scope.toggleEditMode = !$scope.toggleEditMode;
            }

            $scope.toggleCheck = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                project.checked = !project.checked;
                !project.checked && delete project.checked;
            }

            $scope.addProject = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                appService.createProject(
                    project,
                    {
                        pages: []
                    }
                ).then(
                    function (result) {
                        if (result.data.result == "OK") {
                            _.extend(project, result.data.resultValue);
                            $rootScope.userDetail.projectList.push(project);
                        }

                        $scope.hideProjectModal();
                    }, function () {
                        $scope.hideProjectModal();
                    }
                );

                return true;
            }

            $scope.modifyProject = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                appService.modifyProject(project).then(function (result) {
                    _.extend($scope.selectedProject, project);

                    $scope.hideProjectModal();
                });

                return true;
            }

            $scope.removeProject = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                $(".topbarToggleButton.select").removeClass("select");

                appService.deleteProject($rootScope.loginUser._id, project).then(function (result) {
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
                });
            }

            $scope.selectProject = function (project, event) {
                event && event.stopPropagation && event.stopPropagation();

                uiService.loadProject(project).then(function (projectObj) {
                    urlService.frameSketch(false, {project: projectObj});
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
                event && event.stopPropagation && event.stopPropagation();

                var library = _.findWhere($scope.project.xrefRecord, {libraryId: repoLib._id});
                if (library) {
                    if ($scope.project.removeLibrary(repoLib._id)) {
                        delete repoLib._selected;
                    }
                } else {
                    var artifactFilter = {
                        library: repoLib._id,
                        forbidden: false
                    };

                    appService.getRepoArtifact(artifactFilter).then(function (result) {
                        if (result.data.result == "OK") {
                            var artifactList = [];
                            result.data.resultValue.forEach(function (artifact) {
                                var version = artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name || "";

                                version && artifactList.push({
                                    artifactId: artifact._id,
                                    name: artifact.name,
                                    version: version
                                });
                            });

                            if (artifactList.length && $scope.project.addLibrary(repoLib._id, repoLib.name, repoLib.type, artifactList)) {
                                repoLib._selected = true;
                            }
                        }
                    });
                }

                return true;
            }

            function initMaster() {
                $scope.project = $rootScope.loadedProject;
            };

            initMaster();

            $scope.repoTypes = angularConstants.repoTypes;
            $scope.classie = classie;
            $scope._ = _;
        }

        function RepoLibController($scope, $rootScope, $timeout, $q, angularConstants, appService, urlService) {
            $scope.getCurrentVersion = function (repoArtifact) {
                if ($scope.dependencyRecord) {
                    var artifact = _.findWhere($scope.dependencyRecord.artifactList, {artifactId: repoArtifact._id});

                    if (artifact) {
                        repoArtifact._version = artifact.version;
                        return;
                    }
                }

                delete repoArtifact._version;
            }

            $scope.toggleRepoArtifactSelection = function (repoArtifact, event) {
                event && event.stopPropagation && event.stopPropagation();

                repoArtifact._version = repoArtifact._version || (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                if (repoArtifact._version) {
                    if ($scope.dependencyRecord) {
                        var artifact = _.findWhere($scope.dependencyRecord.artifactList, {artifactId: repoArtifact._id});
                        if (artifact) {
                            var result = $rootScope.loadedProject.unselectArtifact($scope.repoLib._id, repoArtifact._id);
                            if (result.artifactUnselect) {
                                delete repoArtifact._selected;
                                delete repoArtifact._version;
                            }
                        } else {
                            if ($rootScope.loadedProject.selectArtifact($scope.repoLib._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                repoArtifact._selected = true;
                            }
                        }
                    } else {
                        if (repoArtifact._version) {
                            $scope.dependencyRecord = $rootScope.loadedProject.addLibrary(
                                $scope.repoLib._id,
                                $scope.repoLib.name,
                                $scope.repoLib.type,
                                [
                                    {
                                        artifactId: repoArtifact._id,
                                        name: repoArtifact.name,
                                        version: repoArtifact._version
                                    }
                                ]
                            );

                            repoArtifact._selected = true;
                        }
                    }
                }

                return true;
            }

            $scope.showDemo = function (repoArtifact, event) {
                event && event.stopPropagation && event.stopPropagation();

                appService.loadRepoArtifact(repoArtifact, $scope.repoLib._id, $scope.repoLib.name, "", "#demoArea").then(function () {
                    var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                    scope.toggleModalWindow();
                });
            }

            $scope.hideDemo = function (repoArtifact, event) {
                event && event.stopPropagation && event.stopPropagation();

                var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                scope.toggleModalWindow();
            }

            function initMaster() {
                var urlParams = $rootScope.urlParams && $rootScope.urlParams["repoLib"] || null,
                    repoLib = urlParams && urlParams.repoLib || null;

                $scope.repoLib = repoLib;
                $scope.project = $rootScope.loadedProject;
                $scope.dependencyRecord = $rootScope.loadedProject && _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: repoLib._id}) || {};

                if (repoLib) {
                    var artifactFilter = {
                        library: repoLib._id,
                        forbidden: false
                    };

                    repoLib.artifactList = repoLib.artifactList || [];
                    if (repoLib.updateTime) {
                        artifactFilter.updateTime = {$gte: repoLib.updateTime}
                    }

                    appService.getRepoArtifact(artifactFilter).then(function (result) {
                        if (result.data.result == "OK") {
                            var recentArtifactList = [];

                            result.data.resultValue.forEach(function (artifact) {
                                if (repoLib.artifactList.every(function (loadedArtifact) {
                                        if (artifact._id === loadedArtifact._id) {
                                            _.extend(loadedArtifact, artifact);
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    recentArtifactList.push(artifact);
                                }
                            });

                            recentArtifactList.splice(0, 0, 0, 0);
                            Array.prototype.splice.apply(repoLib.artifactList, recentArtifactList);
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
                controller('FrameSketchController', ["$scope", "$rootScope", "$timeout", "$q", "$log", "angularEventTypes", "angularConstants", "appService", "uiService", "uiUtilService", FrameSketchController]).
                controller('ProjectController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "uiService", "urlService", ProjectController]).
                controller('RepoController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoController]).
                controller('RepoLibController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoLibController]);
        }
    });