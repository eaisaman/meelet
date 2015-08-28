define(
    ["angular", "jquery", "jquery-ui", "app-util", "app-route", "app-filter", "app-service"],
    function () {
        return function (appModule, extension) {
            function RootController($scope, $rootScope, $q, $timeout, angularEventTypes, angularConstants, appService, urlService, uiUtilService) {
                //For development convenience, we do fake login or restore user info if already authenticated.

                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "uiUtilService": uiUtilService,
                    "element": $("#rootBody"),
                    "scope": $scope
                });

                function initMaster() {
                    $rootScope.showAlert = function (alertObj) {
                        alertObj.id = $scope.alertUidGen();
                        $rootScope.alertList.splice(0, 0, alertObj);

                        return $scope.toggleDisplay("#alertBar", null, true);
                    }

                    $rootScope.hideAlert = function (id, event) {
                        $scope.toggleDisplay("#alertBar", null, false).then(function () {
                            var index;
                            if (!$rootScope.alertList.every(function (a, i) {
                                    if (a.id === id) {
                                        index = i;
                                        return false;
                                    }

                                    return true;
                                })) {
                                $rootScope.alertList.splice(index, 1);
                            }
                        });
                    }

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

                $scope.alertUidGen = uiUtilService.uniqueIdGen("alert-");
                $rootScope.alertList = [];
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

            function FrameSketchController($scope, $rootScope, $timeout, $q, $log, $exceptionHandler, $compile, $parse, angularEventTypes, angularConstants, appService, uiService, uiUtilService, uiCanvasService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "uiUtilService": uiUtilService,
                    "element": $("#frameSketchContainer"),
                    "scope": $scope
                });

                $scope.zoomWidget = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    if ($rootScope.sketchObject.pickedPage && $rootScope.sketchObject.pickedPage.$element) {
                        var id = $scope.zoomId,
                            widgetObj;

                        if (id) {
                            widgetObj = $("#" + id).data("widgetObject");

                            widgetObj && widgetObj.zoomOut && widgetObj.zoomOut();
                            $scope.scale = undefined;
                            $scope.zoomId = null;
                        } else {
                            widgetObj = $rootScope.sketchObject.pickedWidget;

                            if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                                $scope.scale = widgetObj.zoomIn($rootScope.sketchObject.pickedPage.$element);
                                $scope.zoomId = widgetObj.id;
                            }
                        }
                    }
                }

                $scope.removeWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary && !widgetObj.isKindOf("PageSketchWidget")) {
                        widgetObj.dispose().then(function () {
                            $rootScope.sketchObject.pickedWidget = null;
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
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                        var nodeScope = angular.element($("#" + angularConstants.treeNodeIdPrefix + widgetObj.id)).scope();
                        if (nodeScope) {
                            nodeScope.exclusiveSelect && nodeScope.exclusiveSelect();
                            nodeScope.expandVisible && nodeScope.expandVisible();
                        }
                    }
                }

                $scope.duplicateWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

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
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignLeft && widgetObj.alignLeft();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignHorizontalCenter = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignHorizontalCenter && widgetObj.alignHorizontalCenter();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignRight = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignRight && widgetObj.alignRight();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignTop = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignTop && widgetObj.alignTop();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignVerticalCenter = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignVerticalCenter && widgetObj.alignVerticalCenter();
                        widgetObj.disassemble();
                    }
                }

                $scope.alignBottom = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignBottom && widgetObj.alignBottom();
                        widgetObj.disassemble();
                    }
                }

                $scope.fillParent = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                    }
                }

                $scope.fillVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillVertical && widgetObj.fillVertical();
                    }
                }

                $scope.fillHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillHorizontal && widgetObj.fillHorizontal();
                    }
                }

                $scope.spanVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanVertical && widgetObj.spanVertical();
                        widgetObj.disassemble();
                    }
                }

                $scope.spanHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanHorizontal && widgetObj.spanHorizontal();
                        widgetObj.disassemble();
                    }
                }

                $scope.spaceVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceVertical && widgetObj.spaceVertical();
                        widgetObj.disassemble();
                    }
                }

                $scope.spaceHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceHorizontal && widgetObj.spaceHorizontal();
                        widgetObj.disassemble();
                    }
                }

                $scope.groupWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.setTemporary(false);
                    }
                }

                $scope.ungroupWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement) {
                        widgetObj.disassemble();
                    }
                }

                $scope.pickParentWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj) {
                        var parentWidget = widgetObj.parent();

                        if (parentWidget) {
                            if (parentWidget.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                                parentWidget = parentWidget.parent();
                            }

                            $rootScope.sketchObject.pickedWidget = parentWidget;
                            $rootScope.sketchObject.pickedWidget.$element.addClass(angularConstants.widgetClasses.activeClass);

                            widgetObj.$element.removeClass(angularConstants.widgetClasses.activeClass);
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
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveAfter();
                }

                $scope.moveDownWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveBefore();
                }

                $scope.toggleRuler = function (event) {
                    $rootScope.sketchWidgetSetting.showRuler = !$rootScope.sketchWidgetSetting.showRuler;
                }

                $scope.canPositionWidget = function (widgetObj) {
                    return widgetObj && widgetObj.isElement;
                }

                $scope.initWidgetPosition = function () {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

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

                    $rootScope.$broadcast(angularEventTypes.playProjectEvent, $rootScope.sketchWidgetSetting.isPlaying);
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
                            return !document.getElementsByClassName(angularConstants.widgetClasses.deviceHolderClass).length;
                        }, function (callback) {
                            callback();
                        }, function () {
                            uiUtilService.latestOnce(
                                function () {
                                    return $timeout(function () {
                                        if ($rootScope.loadedProject.sketchWorks.pages.length) {
                                            $rootScope.sketchObject.pickedPage = $rootScope.loadedProject.sketchWorks.pages[0];
                                            uiService.loadPages($rootScope.loadedProject.sketchWorks.pages);
                                        } else {
                                            uiService.loadPage(null, uiService.createPage(), true).then(function (pageObj) {
                                                $rootScope.sketchObject.pickedPage = pageObj;
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

                $scope.toggleDisplayRoute = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $canvasContainer = $('#canvasContainer'),
                        $editButton = $("#toggleCanvasEditButton");

                    $rootScope.sketchWidgetSetting.isDefingRoute = !$rootScope.sketchWidgetSetting.isDefingRoute;
                    $canvasContainer.removeClass("select"), $editButton.removeClass("select");

                    if ($rootScope.sketchWidgetSetting.isDefingRoute) {
                        $timeout(function () {
                            uiCanvasService.initCanvas();

                            $rootScope.$broadcast(angularEventTypes.defineWidgetRouteEvent, $rootScope.sketchWidgetSetting.isDefingRoute);
                            $rootScope.sketchObject.pickedWidget && $rootScope.sketchObject.pickedWidget.displayRoute();
                        }, angularConstants.actionDelay);
                    } else {
                        $rootScope.$broadcast(angularEventTypes.defineWidgetRouteEvent, $rootScope.sketchWidgetSetting.isDefingRoute);
                        $rootScope.sketchObject.pickedWidget && $rootScope.sketchObject.pickedWidget.hideRoute();
                    }
                }

                $scope.toggleDefineRoute = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $canvasContainer = $('#canvasContainer'),
                        $editButton = $("#toggleCanvasEditButton");

                    $canvasContainer.toggleClass("select"), $editButton.toggleClass("select");

                }

                $scope.startLink = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var offset = $("#sketchCanvas").offset();

                    uiCanvasService.startLink(event.clientX - offset.left, event.clientY - offset.top), uiCanvasService.hideMenu();
                }

                $scope.removePoint = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    uiCanvasService.removePoint(), uiCanvasService.hideMenu();
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

                    return scope.toggleModalWindow();
                }

                $scope.showResourceEditor = function (el, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "ResourceEditor";
                    $scope.onModalClose = function () {
                        uiUtilService.broadcast(scope,
                            angularEventTypes.resourceEditEndEvent
                        );
                    };

                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope(),
                        $containerEl = $("#frameSketchContainer > .modalWindowContainer > .md-modal #frameSketchResourceArea"),
                        $el;
                    if (angular.isElement(el)) {
                        $el = $(el);
                        $containerEl.append($el);
                    } else {
                        $el = $containerEl.find(".resourceEditor");
                    }

                    return scope.toggleModalWindow().then(function () {
                        return uiUtilService.getResolveDefer($el);
                    });
                }

                $scope.hideModal = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                    scope.toggleModalWindow().then(function () {
                        $scope.onModalClose && $scope.onModalClose();
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

                $scope.nextPage = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    uiUtilService.latestOnce(
                        function () {
                            return uiService.nextPage($rootScope.sketchObject.pickedPage);
                        },
                        null,
                        angularConstants.unresponsiveInterval,
                        "FrameSketchController.nextPage." + $rootScope.sketchObject.pickedPage.id
                    )();
                }

                $scope.prevPage = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    uiUtilService.latestOnce(
                        function () {
                            return uiService.prevPage($rootScope.sketchObject.pickedPage);
                        },
                        null,
                        angularConstants.unresponsiveInterval,
                        "FrameSketchController.prevPage." + $rootScope.sketchObject.pickedPage.id
                    )();
                }

                $scope.onPseudoChange = function (pseudo) {
                    $rootScope.$broadcast(angularEventTypes.widgetPseudoChangeEvent, pseudo);
                }

                function setterFactory(obj, name, source) {
                    return function (to) {
                        var setterName = source && "setTrackablePseudoStyle" || ("set" + name.charAt(0).toUpperCase() + name.substr(1)),
                            setter = obj[setterName];
                        if (setter) {
                            uiUtilService.once(function (widgetObj, styleSource, setterFn, value) {
                                return $timeout(function () {
                                    if (styleSource)
                                        setterFn.apply(widgetObj, [styleSource, value]);
                                    else
                                        setterFn.apply(widgetObj, [value]);
                                });
                            }, null, angularConstants.unresponsiveInterval, "FrameSketchController.setterFactory.{0}.{1}".format(obj.id, name))(obj, source, setter, to);
                        }
                    }
                }

                function initWidgetSettingWatch(setting) {
                    if ($rootScope.sketchObject.pickedWidget) {
                        setting.deregisterWatch && setting.deregisterWatch();

                        var name = setting.name,
                            source = setting.source,
                            getterName = source && "getTrackablePseudoStyle" || ("get" + name.charAt(0).toUpperCase() + name.substr(1));

                        var getter = $rootScope.sketchObject.pickedWidget[getterName];
                        if (getter) {
                            var value;
                            if (source)
                                value = getter.apply($rootScope.sketchObject.pickedWidget, [source]);
                            else
                                value = getter.apply($rootScope.sketchObject.pickedWidget);
                            $rootScope.sketchWidgetSetting[name] = value;
                            setting.initFn && setting.initFn(value);
                        }

                        $timeout(function () {
                            setting.deregisterWatch = $scope.$watch("sketchWidgetSetting" + "." + name, setterFactory($rootScope.sketchObject.pickedWidget, name, source));
                        });
                    }
                }

                function initMaster() {
                    function createWidgetPositionInputAssign(name, cssName) {
                        var fn = $parse(name),
                            assign = fn.assign;

                        if (!fn.assign.customized) {
                            fn.assign = function ($scope, value) {
                                function positionInputHandler(value) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        var widgetObj = $rootScope.sketchObject.pickedWidget;

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

                    $scope.pickedPageWatcher = $rootScope.$watch("sketchObject.pickedPage", function (to) {
                        if (to) {
                            $rootScope.sketchObject.pickedWidget = to;
                        }
                    });

                    $scope.pickedWidgetWatcher = $rootScope.$watch("sketchObject.pickedWidget", function (to) {
                        if (!to) {
                            $rootScope.sketchObject.pickedWidget = $rootScope.sketchObject.pickedPage;
                        } else {
                            $scope.initWidgetPosition();

                            if ($rootScope.sketchWidgetSetting.isDefingRoute) {
                                if ($rootScope.sketchObject.pickedWidget && !$rootScope.sketchObject.pickedWidget.isTemporary && $rootScope.sketchObject.pickedWidget.isKindOf("ElementSketchWidget")) {
                                    $rootScope.sketchObject.pickedWidget.displayRoute();
                                }
                            }
                        }
                    });

                    $scope.pickedWidgetStateWatcher = $rootScope.$watch("sketchObject.pickedWidget.state", function (to) {
                        if (to) {
                            widgetSettingList.forEach(function (setting) {
                                initWidgetSettingWatch(setting);
                            });
                        }
                    });

                    //Receive control directive settings of bound properties
                    $scope.boundPropertiesWatcher = $scope.$on(angularEventTypes.boundPropertiesEvent, function (event, data) {
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

                    $scope.beforeWidgetCreationWatcher = $scope.$on(angularEventTypes.beforeWidgetCreationEvent, function (event, fn) {
                        uiUtilService.once(function (fn) {
                            return $scope.showWidgetName(fn);
                        }, null, angularConstants.unresponsiveInterval, "FrameSketchController.initMaster.beforeWidgetCreation")(fn);
                    });

                    $scope.resourceEditWatcher = $scope.$on(angularEventTypes.resourceEditEvent, function (event, obj) {
                        uiUtilService.once(function (obj) {
                            return $scope.showResourceEditor(obj.editor).then(function ($editorEl) {
                                try {
                                    obj.callback && obj.callback($editorEl);
                                } catch (e) {
                                    $exceptionHandler(e);
                                }

                                return uiUtilService.getResolveDefer();
                            })
                        }, null, angularConstants.unresponsiveInterval, "FrameSketchController.initMaster.resourceEditWatcher")(obj);
                    });

                    $scope.switchProjectWatcher = $scope.$on(angularEventTypes.switchProjectEvent, function () {
                        $scope.renderProject();
                    });

                    if ($rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id) {
                        $scope.renderProject();
                    }

                    $scope.$on('$destroy', function () {
                        if ($scope.pickedPageWatcher) {
                            $scope.pickedPageWatcher();
                            $scope.pickedPageWatcher = null;
                        }
                        if ($scope.pickedWidgetWatcher) {
                            $scope.pickedWidgetWatcher();
                            $scope.pickedWidgetWatcher = null;
                        }
                        if ($scope.pickedWidgetStateWatcher) {
                            $scope.pickedWidgetStateWatcher();
                            $scope.pickedWidgetStateWatcher = null;
                        }
                        if ($scope.boundPropertiesWatcher) {
                            $scope.boundPropertiesWatcher();
                            $scope.boundPropertiesWatcher = null;
                        }
                        if ($scope.beforeWidgetCreationWatcher) {
                            $scope.beforeWidgetCreationWatcher();
                            $scope.beforeWidgetCreationWatcher = null;
                        }
                        if ($scope.resourceEditWatcher) {
                            $scope.resourceEditWatcher();
                            $scope.resourceEditWatcher = null;
                        }
                        if ($scope.switchProjectWatcher) {
                            $scope.switchProjectWatcher();
                            $scope.switchProjectWatcher = null;
                        }

                        uiCanvasService.setCanvas(null);
                    });
                }

                initMaster();

                var widgetSettingList = [];

                $scope.uiService = uiService;
                $scope.Math = Math;
                $scope.classie = classie;
                $scope.dockAlign = "align-left";
                $scope.pseudoOptions = ["", "before", "after"];
                $scope.pseudo = "";
                $scope.iconLibraryList = $rootScope.iconLibraryList;
                $scope.effectLibraryList = $rootScope.effectLibraryList;
                $scope.sketchDevice = {
                    type: "desktop",
                    width: 1024,
                    height: 768,
                    img: "device_ipad_horizontal.svg",
                    rulerMarkerCount: 12
                };
            }

            function ProjectController($scope, $rootScope, $timeout, $q, angularConstants, appService, uiService, uiFlowService, urlService, uiUtilService) {
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
                    return scope.toggleModalWindow();
                }

                $scope.hideProjectModal = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($(".projectContainer .md-modal")).scope();
                    return scope.toggleModalWindow();
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
                        function (projectRecord) {
                            return $scope.hideProjectModal().then(function () {
                                _.extend(project, projectRecord);
                                $rootScope.userDetail.projectList.push(project);
                                return $scope.showAlert(
                                    {
                                        title: "Project {0} is created.".format(project.name),
                                        category: 1
                                    }
                                );
                            });
                        }, function (err) {
                            return $scope.hideProjectModal().then(function () {
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );

                            });
                        }
                    );

                    return true;
                }

                $scope.modifyProject = function (project, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    appService.modifyProject(project).then(
                        function () {
                            return $scope.hideProjectModal().then(function () {
                                _.extend($scope.selectedProject, project);

                                return $scope.showAlert(
                                    {
                                        title: "Project {0} has been modified.".format(project.name),
                                        category: 1
                                    }
                                );
                            });
                        }, function (err) {
                            return $scope.hideProjectModal().then(function () {
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );

                            });
                        }
                    );

                    return true;
                }

                $scope.removeProject = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $(".topbarToggleButton.select").removeClass("select");

                    appService.deleteProject($rootScope.loginUser._id, projectItem).then(
                        function () {
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

                            return $scope.showAlert(
                                {
                                    title: "Project {0} has been removed.".format(projectItem.name),
                                    category: 1
                                }
                            );
                        }, function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );
                }

                $scope.selectProject = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    switch (projectItem.type) {
                        case "sketch":
                            uiService.loadProject(projectItem).then(function (err) {
                                if (!err) {
                                    urlService.frameSketch(false, {project: projectItem});
                                }
                            });
                            break;
                        case "flow":
                            uiFlowService.loadProject(projectItem).then(function (err) {
                                if (!err) {
                                    urlService.flow(false, {project: projectItem});
                                }
                            });
                            break;
                    }
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

            function FlowController($scope, $rootScope, $timeout, $q, angularConstants, appService, uiService, uiFlowService, urlService, uiUtilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "uiUtilService": uiUtilService,
                    "element": $(".flowContainer"),
                    "scope": $scope
                });

                $scope.selectEditor = function (editor, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    if (editor && $scope.activeEditor !== editor) {
                        $scope.activeEditor = editor;

                        var $el = $(event.currentTarget),
                            $content = $(".flowEditorContent");

                        $el.siblings().removeClass("select");
                        $el.addClass("select");

                        $content.children(".show").removeClass("show");
                        $content.children("[editor='{0}']".format(editor)).addClass("show");
                    }
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
                            }
                        ]
                    );
                }

                $scope.toggleLockProject = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    if ($rootScope.loadedProject.projectRecord.lock) {
                        return $rootScope.loadedProject.unlock($rootScope.loginUser._id);
                    } else {
                        return $rootScope.loadedProject.tryLock($rootScope.loginUser._id);
                    }
                }

                $scope.clearSelection = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element(document.querySelector("#flowStepTree [ui-tree-node].selected")).scope();
                    scope && scope.unselect();

                    $("#flowStepTree [ui-tree-handle].edit").removeClass("edit");
                }

                $scope.deactivateNameEdit = function () {
                    $("#flowStepTree [ui-tree-handle].edit").removeClass("edit");
                }

                $scope.activateNameEdit = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $el = $(event.currentTarget);
                    $el.addClass("edit");
                }

                $scope.getSelectedFlowItem = function () {
                    var scope = angular.element(document.querySelector("#flowStepTree [ui-tree-node].selected")).scope();

                    return scope && scope.item;
                }

                $scope.getParentFlowItem = function () {
                    var el = document.querySelector("#flowStepTree [ui-tree-node].selected");
                    if (el) {
                        var parentElement = el.parentElement.parentElement;
                        if (parentElement.hasAttribute("ui-tree-node")) {
                            var scope = angular.element(parentElement).scope();
                            return scope && scope.item;
                        }
                    }
                }

                $scope.insertAfterFlow = function () {
                    var item = $scope.getSelectedFlowItem();

                    if (item) {
                        if (item.isKindOf("Flow")) {
                            var index = $rootScope.loadedProject.flowIndexOf(item);

                            $rootScope.loadedProject.addFlow(uiFlowService.createFlow(), $rootScope.loadedProject.getFlow(index + 1));
                        }
                    } else {
                        $rootScope.loadedProject.addFlow(uiFlowService.createFlow());
                    }
                }

                $scope.insertAfterFlowStep = function (step) {
                    var item = $scope.getSelectedFlowItem();

                    if (item) {
                        if (item.isKindOf("Flow")) {
                            item.addStep(uiFlowService.createFlowStep(step));
                        } else if (item.isKindOf("BaseFlowStep")) {
                            var parentItem = $scope.getParentFlowItem();

                            if (parentItem) {
                                var index = parentItem.indexOf(item);
                                parentItem.addStep(uiFlowService.createFlowStep(step), parentItem.getItem(index + 1));
                            }
                        }
                    }
                }

                $scope.insertAfterInvokeFlowStep = function (event) {
                    $scope.insertAfterFlowStep("InvokeFlowStep");
                }

                $scope.insertAfterMapFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.insertAfterFlowStep("MapFlowStep");
                }

                $scope.insertAfterSwitchFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.insertAfterFlowStep("SwitchFlowStep");
                }

                $scope.insertAfterRepeatFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.insertAfterFlowStep("RepeatFlowStep");
                }

                $scope.insertAfterSequenceFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.insertAfterFlowStep("SequenceFlowStep");
                }

                $scope.insertAfterExitFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.insertAfterFlowStep("ExitFlowStep");
                }

                $scope.removeFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var el = document.querySelector("#flowStepTree [ui-tree-node].selected"),
                        scope = angular.element(el).scope(),
                        item = scope && scope.item;

                    if (item) {
                        scope.unselect();

                        if (item.isKindOf("Flow")) {
                            $rootScope.loadedProject.removeFlow(item);
                        } else if (item.isKindOf("BaseFlowStep")) {
                            var parentElement = el.parentElement.parentElement;
                            if (parentElement.hasAttribute("ui-tree-node")) {
                                var parentScope = angular.element(parentElement).scope(),
                                    parentItem = parentScope && parentScope.item;

                                parentItem && parentItem.removeStep(item);
                            }
                        }
                    }

                }

                $scope.moveFlowStepUp = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var item = $scope.getSelectedFlowItem();

                    if (item) {
                        if (item.isKindOf("Flow")) {
                            $rootScope.loadedProject.moveUpFlow(item);
                        } else if (item.isKindOf("BaseFlowStep")) {
                            var parentItem = $scope.getParentFlowItem();
                            parentItem && parentItem.moveUpStep(item);
                        }
                    }
                }

                $scope.moveFlowStepDown = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var item = $scope.getSelectedFlowItem();

                    if (item) {
                        if (item.isKindOf("Flow")) {
                            $rootScope.loadedProject.moveDownFlow(item);
                        } else if (item.isKindOf("BaseFlowStep")) {
                            var parentItem = $scope.getParentFlowItem();
                            parentItem && parentItem.moveDownStep(item);
                        }
                    }
                }

                $scope.moveFlowStepLeft = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var el = document.querySelector("#flowStepTree [ui-tree-node].selected"),
                        scope = angular.element(el).scope(),
                        item = scope && scope.item;

                    if (item && item.isKindOf("BaseFlowStep")) {
                        var parentElement = el.parentElement.parentElement;
                        if (parentElement.hasAttribute("ui-tree-node")) {
                            var grandElement = parentElement.parentElement.parentElement;
                            if (grandElement.hasAttribute("ui-tree-node")) {
                                var parentScope = angular.element(parentElement).scope(),
                                    parentItem = parentScope && parentScope.item,
                                    grandScope = angular.element(grandElement).scope(),
                                    grandItem = grandScope && grandScope.item;

                                if (parentItem && grandItem) {
                                    scope.unselect();

                                    $timeout(function () {
                                        parentItem.removeStep(item);
                                        grandItem.addStep(item, parentItem);
                                        grandItem.moveDownStep(item);
                                    });
                                }
                            }
                        }
                    }
                }

                $scope.moveFlowStepRight = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var el = document.querySelector("#flowStepTree [ui-tree-node].selected"),
                        scope = angular.element(el).scope(),
                        item = scope && scope.item;

                    if (item && item.isKindOf("BaseFlowStep")) {
                        var parentElement = el.parentElement.parentElement;
                        if (parentElement.hasAttribute("ui-tree-node")) {
                            var parentScope = angular.element(parentElement).scope(),
                                parentItem = parentScope && parentScope.item;

                            if (parentItem) {
                                var index = parentItem.indexOf(item);
                                if (index != null && index > 0) {
                                    var prevItem = parentItem.getItem(index - 1);
                                    if (prevItem.isKindOf("SequenceFlowStep") || prevItem.isKindOf("SwitchFlowStep") || prevItem.isKindOf("RepeatFlowStep")) {
                                        scope.unselect();

                                        $timeout(function () {
                                            parentItem.removeStep(item);
                                            prevItem.addStep(item);
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                function initMaster() {
                }

                initMaster();

                $scope.classie = classie;
                $scope._ = _;
                $scope.activeEditor = "process";
            }

            appModule.
                controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "angularEventTypes", "angularConstants", "appService", "urlService", "uiUtilService", RootController]).
                controller('FrameSketchController', ["$scope", "$rootScope", "$timeout", "$q", "$log", "$exceptionHandler", "$compile", "$parse", "angularEventTypes", "angularConstants", "appService", "uiService", "uiUtilService", "uiCanvasService", FrameSketchController]).
                controller('ProjectController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "uiService", "uiFlowService", "urlService", "uiUtilService", ProjectController]).
                controller('RepoController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoController]).
                controller('RepoLibController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "urlService", RepoLibController]).
                controller('FlowController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "appService", "uiService", "uiFlowService", "urlService", "uiUtilService", FlowController]);
        }
    });