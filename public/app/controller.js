define(
    ["angular", "jquery", "jquery-ui", "app-util", "app-route", "app-filter", "app-service"],
    function () {
        return function (appModule, extension) {
            function RootController($scope, $rootScope, $q, appService, urlService, uiUtilService) {
                //For development convenience, we do fake login or restore user info if already authenticated.
                function initMaster() {
                    return $q.all([
                        appService.getRepoLibrary().then(
                            function (result) {
                                $rootScope.repoLibraryList = result && result.data.result == "OK" && result.data.resultValue || [];
                            }, function (err) {
                                return uiUtilService.getRejectDefer(err);
                            }
                        ),
                        appService.restoreUserFromStorage().then(
                            function () {
                                var arr = [];
                                if (!$rootScope.loginUser._id) {
                                    arr.push(
                                        function () {
                                            return appService.doLogin("wangxinyun28", "*").then(
                                                function (userObj) {
                                                    userObj && _.extend($rootScope.loginUser, userObj);

                                                    return uiUtilService.getResolveDefer();
                                                },
                                                function (err) {
                                                    return uiUtilService.getRejectDefer(err);
                                                }
                                            )
                                        }
                                    );
                                }

                                arr.push(function () {
                                    return appService.getUserDetail({"loginName": "wangxinyun28"}).then(
                                        function (result) {
                                            result && result.data.result == "OK" && _.extend($rootScope.userDetail, result.data.resultValue[0]);

                                            return uiUtilService.getResolveDefer();
                                        },
                                        function (err) {
                                            return uiUtilService.getRejectDefer(err);
                                        }
                                    );
                                });

                                return uiUtilService.chain(arr).then(
                                    function (err) {
                                        if (err) {
                                            return uiUtilService.getRejectDefer(err);
                                        } else {
                                            return uiUtilService.getResolveDefer();
                                        }
                                    }
                                );
                            }, function (err) {
                                return uiUtilService.getRejectDefer(err);
                            }
                        )
                    ]);
                }

                $rootScope.repoLibraryList = [];
                $rootScope.effectLibraryList = [];
                $rootScope.iconLibraryList = [];
                $rootScope.widgetLibraryList = [];
                $rootScope.loginUser = {};
                $rootScope.userDetail = {projectList: []};
                $rootScope.loadedProject = {};
                $rootScope.sketchObject = {};
                $rootScope.sketchWidgetSetting = {
                    isPlaying: false
                };
                $rootScope.visiblePseudoEnabledWidgets = [];
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

                initMaster().then(
                    function () {
                        urlService.project();
                    }
                );
            }

            function FrameSketchController($scope, $rootScope, $timeout, $q, $log, $compile, $parse, angularEventTypes, angularConstants, appService, uiService, uiUtilService) {
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

                            if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(angularConstants.widgetClasses.widgetClass) || $to.hasClass(angularConstants.widgetClasses.holderClass) || $to.attr(angularConstants.anchorAttr))) {
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
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement) {
                        var $parent = widgetObj.$element.parent();
                        if ($parent.length) {
                            uiService.copyWidget(widgetObj, $parent).then(function (cloneObj) {
                                var left = ($parent.width() - cloneObj.$element.width()) / 2,
                                    top = ($parent.height() - cloneObj.$element.height()) / 2;

                                left = Math.floor(left * 100) / 100, top = Math.floor(top * 100) / 100;

                                cloneObj.css("left", left + "px");
                                cloneObj.css("top", top + "px");
                            });
                        }
                    }
                }

                $scope.setSelectedButton = function (event) {
                    var $el = $(event.target),
                        $sel = $(event.currentTarget).siblings(".selectedButton");

                    $sel.empty();
                    $sel.append($el.clone());

                    $compile($sel)($scope);
                }

                $scope.alignLeft = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignLeft && widgetObj.alignLeft();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignHorizontalCenter = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignHorizontalCenter && widgetObj.alignHorizontalCenter();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignRight = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignRight && widgetObj.alignRight();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignTop = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignTop && widgetObj.alignTop();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignVerticalCenter = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignVerticalCenter && widgetObj.alignVerticalCenter();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignBottom = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignBottom && widgetObj.alignBottom();
                        widgetObj.disassemble();
                    }
                }

                $scope.fillParent = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                    }
                }

                $scope.fillVertical = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillVertical && widgetObj.fillVertical();
                    }
                }

                $scope.fillHorizontal = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillHorizontal && widgetObj.fillHorizontal();
                    }
                }

                $scope.spanVertical = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanVertical && widgetObj.spanVertical();
                        widgetObj.disassemble();
                    }
                }

                $scope.spanHorizontal = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanHorizontal && widgetObj.spanHorizontal();
                        widgetObj.disassemble();
                    }
                }

                $scope.spaceVertical = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceVertical && widgetObj.spaceVertical();
                        widgetObj.disassemble();
                    }
                }

                $scope.spaceHorizontal = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceHorizontal && widgetObj.spaceHorizontal();
                        widgetObj.disassemble();
                    }
                }

                $scope.groupWidget = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.setTemporary(false);
                    }
                }

                $scope.ungroupWidget = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement) {
                        widgetObj.disassemble();
                    }
                }

                $scope.pickParentWidget = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj) {
                        var parentWidget = widgetObj.parent();

                        if (parentWidget) {
                            if (parentWidget.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                                parentWidget = parentWidget.parent();
                            }

                            $rootScope.sketchObject.pickedWidget = parentWidget;
                            $rootScope.sketchObject.pickedWidget.addOmniClass(angularConstants.widgetClasses.activeClass);

                            widgetObj.removeOmniClass(angularConstants.widgetClasses.activeClass);
                            if (!widgetObj.isTemporary && widgetObj.isElement && widgetObj.$element) {
                                var $text = $("#widgetTextHolder"),
                                    editingWidget = $text.data("widgetObject");

                                $text.toggle(false);
                                if (editingWidget) {
                                    $text.css("width", "auto");
                                    if ($text.width()) {
                                        editingWidget.setHtml($text.html());
                                    }
                                }
                                $text.removeData("widgetObject");
                            }
                        }
                    }
                }

                $scope.moveUpWidget = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveAfter();
                }

                $scope.moveDownWidget = function (event) {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveBefore();
                }

                $scope.toggleRuler = function (event) {
                    $rootScope.sketchWidgetSetting.showRuler = !$rootScope.sketchWidgetSetting.showRuler;
                }

                $scope.canPositionWidget = function (widgetObj) {
                    return widgetObj && widgetObj.isElement;
                }

                $scope.initWidgetPosition = function () {
                    var widgetObj = $scope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement) {
                        $scope.pickedWidgetLeft = null;
                        $scope.pickedWidgetTop = null;
                        $scope.pickedWidgetWidth = null;
                        $scope.pickedWidgetHeight = null;

                        $timeout(function () {
                            $scope.pickedWidgetLeft = widgetObj.css("left");
                            $scope.pickedWidgetTop = widgetObj.css("top");
                            $scope.pickedWidgetWidth = widgetObj.css("width");
                            $scope.pickedWidgetHeight = widgetObj.css("height");
                        });
                    }
                }

                $scope.togglePlayWidget = function (event) {
                    $rootScope.sketchWidgetSetting.isPlaying = !$rootScope.sketchWidgetSetting.isPlaying;
                }

                $scope.saveProject = function (event) {
                    return $rootScope.loadedProject.save();
                }

                $scope.loadProject = function (event) {
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
                    return uiUtilService.whilst(
                        function () {
                            return !$("." + angularConstants.widgetClasses.deviceHolderClass).length || !$rootScope.loadedProject;
                        }, function (callback) {
                            callback();
                        }, function () {
                            uiUtilService.latestOnce(
                                function () {
                                    return $timeout(function () {
                                        if ($rootScope.loadedProject.sketchWorks.pages.length) {
                                            $scope.sketchObject.pickedPage = $rootScope.loadedProject.sketchWorks.pages[0];
                                            uiService.createPages("." + angularConstants.widgetClasses.deviceHolderClass, $rootScope.loadedProject.sketchWorks.pages);
                                        } else {
                                            uiService.createPage("." + angularConstants.widgetClasses.deviceHolderClass).then(function (pageObj) {
                                                $scope.sketchObject.pickedPage = pageObj;
                                                $rootScope.loadedProject.sketchWorks.pages.push(pageObj);
                                            });
                                        }
                                    });
                                },
                                null,
                                angularConstants.unresponsiveInterval,
                                "FrameSketchController.renderProject"
                            )();
                        },
                        angularConstants.checkInterval,
                        "FrameSketchController.renderProject",
                        angularConstants.renderTimeout
                    );
                }

                $scope.toggleLockProject = function (event) {
                    if ($rootScope.loadedProject.projectRecord.lock) {
                        return $rootScope.loadedProject.unlock($rootScope.loginUser._id);
                    } else {
                        return $rootScope.loadedProject.tryLock($rootScope.loginUser._id);
                    }
                }

                $scope.convertToHtml = function (event) {
                    return $rootScope.loadedProject.convertToHtml($rootScope.loginUser._id);
                }

                $scope.showDemo = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "Demo";
                    appService.loadRepoArtifact($rootScope.sketchWidgetSetting.pickedArtifact, $rootScope.sketchWidgetSetting.pickedLibrary._id, $rootScope.sketchWidgetSetting.pickedLibrary.name, "", "#frameSketchWidgetDemoArea").then(function () {
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
                            $rootScope.sketchWidgetSetting[name] = value;
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
                    } else {
                        $scope.initWidgetPosition();
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
                            var m = prop.match(/sketchWidgetSetting\.(\w+)$/);
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
                    function createWidgetPositionInputAssign(name, cssName) {
                        var fn = $parse(name),
                            assign = fn.assign;

                        if (!fn.assign.customized) {
                            fn.assign = function ($scope, value) {
                                function positionInputHandler(value) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        var widgetObj = $scope.sketchObject.pickedWidget;

                                        if (widgetObj && widgetObj.isElement) {
                                            widgetObj.css(cssName, value);
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                if (value) {
                                    var m = (value || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) {
                                        uiUtilService.once(positionInputHandler, null, angularConstants.unresponsiveInterval, "FrameSketchController.initMaster.createWidgetPositionInputAssign.positionInputHandler." + name)(value);
                                    }

                                    var args = Array.prototype.slice.call(arguments),
                                        result = assign.apply(fn, args);

                                    return result;
                                }
                            }

                            fn.assign.customized = true;
                        }
                        return fn;
                    }

                    createWidgetPositionInputAssign("pickedWidgetLeft", "left");
                    createWidgetPositionInputAssign("pickedWidgetTop", "top");
                    createWidgetPositionInputAssign("pickedWidgetWidth", "width");
                    createWidgetPositionInputAssign("pickedWidgetHeight", "height");

                    $rootScope.$on(angularEventTypes.switchProjectEvent, function () {
                        $scope.renderProject();
                    });
                }

                initMaster();

                var widgetSettingList = [];

                $scope.uiService = uiService;
                $scope.Math = Math;
                $scope.classie = classie;
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
            }

            function ProjectController($scope, $rootScope, $timeout, $q, angularConstants, appService, uiService, urlService, uiUtilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "uiUtilService": uiUtilService,
                    "element": $(".projectContainer"),
                    "scope": $scope
                });

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

                $scope.toggleCheck = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    projectItem.checked = !projectItem.checked;
                    !projectItem.checked && delete projectItem.checked;
                }

                $scope.toggleQrCode = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();


                    $scope.toggleDisplay("#{0} .projectItemQrCode".format(projectItem.id));
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

                $scope.removeProject = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $(".topbarToggleButton.select").removeClass("select");

                    appService.deleteProject($rootScope.loginUser._id, projectItem).then(function (result) {
                        var index;
                        if (!$rootScope.userDetail.projectList.every(function (p, i) {
                                if (p._id === projectItem._id) {
                                    index = i;
                                    return false;
                                }
                                return true;
                            })) {
                            $rootScope.userDetail.projectList.splice(index, 1);
                        }
                    });
                }

                $scope.selectProject = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    uiService.loadProject(projectItem).then(function (projectObj) {
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

                $scope.$on("$routeChangeSuccess", function (scope, next, current) {
                    current && initMaster();
                });


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

                    var library = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: repoLib._id});
                    if (library) {
                        if ($rootScope.loadedProject.removeLibrary(repoLib._id)) {
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

                                if (artifactList.length && $rootScope.loadedProject.addLibrary(repoLib._id, repoLib.name, repoLib.type, artifactList)) {
                                    repoLib._selected = true;
                                }
                            }
                        });
                    }

                    return true;
                }

                function initMaster() {
                }

                initMaster();

                $scope.repoTypes = angularConstants.repoTypes;
                $scope.classie = classie;
                $scope._ = _;
            }

            appModule.
                controller('RootController', ["$scope", "$rootScope", "$q", "appService", "urlService", "uiUtilService", RootController]).
                controller('FrameSketchController', ["$scope", "$rootScope", "$timeout", "$q", "$log", "$compile", "$parse", "angularEventTypes", "angularConstants", "appService", "uiService", "uiUtilService", FrameSketchController]).
                controller('ProjectController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "uiService", "urlService", "uiUtilService", ProjectController]).
                controller('RepoController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoController]).
                controller('RepoLibController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoLibController]);
        }
    });