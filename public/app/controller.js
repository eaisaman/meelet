define(
    ["angular", "jquery", "jquery-ui", "app-util", "app-route", "app-filter", "app-service"],
    function () {
        return function (appModule, extension) {

            function RootController($scope, $rootScope, $q, $timeout, $interval, angularEventTypes, angularConstants, appService, serviceRegistry, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $("#rootBody"),
                    "scope": $scope
                });

                function init() {
                    serviceRegistry.makeGlobal();

                    $rootScope.showAlert = function (alertObj) {
                        alertObj.id = $scope.alertUidGen();
                        $rootScope.alertList.splice(0, 0, alertObj);

                        return $scope.toggleDisplay("#alertBar", null, true);
                    };

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
                    };

                    return $q.all([
                        appService.getRepoLibrary().then(
                            function (result) {
                                $rootScope.repoLibraryList = result && result.data.result == "OK" && result.data.resultValue || [];
                            }, function (err) {
                                return utilService.getRejectDefer(err);
                            }
                        ),
                        //For development convenience, we do fake login or restore user info if already authenticated.
                        appService.restoreUserFromStorage().then(
                            function () {
                                if ($rootScope.loginUser._id) {
                                    return appService.getUserDetail({"loginName": $rootScope.loginUser.loginName}).then(
                                        function (result) {
                                            result && result.data.result == "OK" && _.extend($rootScope.userDetail, result.data.resultValue[0]);

                                            return utilService.getResolveDefer("project");
                                        },
                                        function (err) {
                                            return utilService.getRejectDefer(err);
                                        }
                                    );
                                } else {
                                    return utilService.getResolveDefer("login");
                                }
                            }, function (err) {
                                return utilService.getRejectDefer(err);
                            }
                        )
                    ]);
                }

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
                $scope.alertUidGen = utilService.uniqueIdGen("alert-");
                $scope.urlService = urlService;
                $scope.sketchDevice = {
                    type: "desktop",
                    width: 1024,
                    height: 768,
                    img: "device_ipad_horizontal.svg",
                    rulerMarkerCount: 12
                };
                $scope.dockAlign = "align-left";
                $scope.pseudoOptions = ["", "before", "after"];

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

                init().then(
                    function (results) {
                        var url = results[1];
                        urlService[url]();
                    }
                );
            }

            function LoginController($scope, $rootScope, $timeout, $interval, $q, angularConstants, appService, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $("#loginContainer"),
                    "scope": $scope
                });


                $("#loginContainer").find('input.rememberCheckBox').on('ifChanged', function (event) {
                    $scope.rememberMe = event.target.checked;
                }).iCheck({
                    checkboxClass: 'icheckbox_square-custom-green',
                    increaseArea: '20%'
                });

                $scope.login = function () {
                    return appService.doLogin($scope.userName, $scope.plainPassword, !!$scope.rememberMe).then(
                        function () {
                            return appService.getUserDetail({"loginName": $rootScope.loginUser.loginName}).then(
                                function (result) {
                                    result && result.data.result == "OK" && _.extend($rootScope.userDetail, result.data.resultValue[0]);

                                    urlService.project();
                                    return utilService.getResolveDefer();
                                },
                                function (err) {
                                    return utilService.getRejectDefer(err);
                                }
                            );
                        },
                        function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );
                }
            }

            function FrameSketchController($scope, $rootScope, $timeout, $interval, $q, $log, $exceptionHandler, $compile, $parse, angularEventTypes, angularConstants, appService, uiService, utilService, uiCanvasService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $("#frameSketchContainer"),
                    "scope": $scope
                });

                $scope.togglePopupMenu = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $(event.currentTarget).parent().toggleClass("select");

                    return utilService.getResolveDefer();
                };

                $scope.removeWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary && !widgetObj.isKindOf("PageSketchWidget")) {
                        return widgetObj.dispose().then(function () {
                            $rootScope.sketchObject.pickedWidget = null;

                            return utilService.getResolveDefer();
                        });
                    }

                    return utilService.getResolveDefer();
                };

                $scope.enableAddWidget = function (event) {
                    function addWidgetHandler(event) {
                        var touchX = $widgetElement && $widgetElement.data("touchX") || 0,
                            touchY = $widgetElement && $widgetElement.data("touchY") || 0,
                            $container = $("." + angularConstants.widgetClasses.containerClass);

                        if (event.type === "panstart") {
                            $widgetElement = $("<div />");
                            $widgetElement.addClass("pickerPaneShape squarePane icon-frame-sketch-before icon-frame-sketch-add-widget-before")
                                .css("z-index", angularConstants.draggingShapeZIndex);
                            $widgetElement.appendTo($container);

                            touchX = event.srcEvent.offsetX;
                            touchY = event.srcEvent.offsetY;
                            $widgetElement.data("touchX", touchX);
                            $widgetElement.data("touchY", touchY);
                        } else if (event.type === "panmove") {
                            var left = event.srcEvent.clientX - $widgetElement.parent().offset().left + touchX,
                                top = event.srcEvent.clientY - $widgetElement.parent().offset().top + touchY;

                            $widgetElement.css("left", left + "px");
                            $widgetElement.css("top", top + "px");

                            var $to = $(event.srcEvent.toElement);
                            if ($to.hasClass(angularConstants.widgetClasses.widgetClass)) {
                                if (!$to.hasClass(angularConstants.widgetClasses.hoverClass)) {
                                    $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                                    $to.addClass(angularConstants.widgetClasses.hoverClass);
                                }
                            } else if ($to.hasClass(angularConstants.widgetClasses.holderClass)) {
                                $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                            }

                            if (angularConstants.VERBOSE) {
                                $log.debug("left:" + left);
                                $log.debug("touchX:" + touchX);
                            }
                        } else if ($widgetElement && event.type === "panend") {
                            $widgetElement.remove();
                            $widgetElement = null;
                            $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);

                            var $to = $(event.srcEvent.toElement);

                            if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(angularConstants.widgetClasses.widgetClass) || $to.hasClass(angularConstants.widgetClasses.holderClass) || $to.attr(angularConstants.anchorAttr))) {
                                var x = event.srcEvent.clientX - $to.offset().left,
                                    y = event.srcEvent.clientY - $to.offset().top;

                                x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                                utilService.broadcast($scope,
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
                    }

                    var $el = $(event.target),
                        mc = $el.data("hammer"),
                        $widgetElement;

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

                    return utilService.getResolveDefer();
                };

                $scope.enableAddVideoWidget = function (event) {
                    function addWidgetHandler(event) {
                        var touchX = $widgetElement && $widgetElement.data("touchX") || 0,
                            touchY = $widgetElement && $widgetElement.data("touchY") || 0,
                            $container = $("." + angularConstants.widgetClasses.containerClass);

                        if (event.type === "panstart") {
                            $widgetElement = $("<div />");
                            $widgetElement.addClass("pickerPaneShape squarePane icon-frame-sketch-before icon-frame-sketch-add-widget-before")
                                .css("z-index", angularConstants.draggingShapeZIndex);
                            $widgetElement.appendTo($container);

                            touchX = event.srcEvent.offsetX;
                            touchY = event.srcEvent.offsetY;
                            $widgetElement.data("touchX", touchX);
                            $widgetElement.data("touchY", touchY);
                        } else if (event.type === "panmove") {
                            var left = event.srcEvent.clientX - $widgetElement.parent().offset().left + touchX,
                                top = event.srcEvent.clientY - $widgetElement.parent().offset().top + touchY;

                            $widgetElement.css("left", left + "px");
                            $widgetElement.css("top", top + "px");

                            var $to = $(event.srcEvent.toElement);
                            if ($to.hasClass(angularConstants.widgetClasses.widgetClass)) {
                                if (!$to.hasClass(angularConstants.widgetClasses.hoverClass)) {
                                    $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                                    $to.addClass(angularConstants.widgetClasses.hoverClass);
                                }
                            } else if ($to.hasClass(angularConstants.widgetClasses.holderClass)) {
                                $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                            }

                            if (angularConstants.VERBOSE) {
                                $log.debug("left:" + left);
                                $log.debug("touchX:" + touchX);
                            }
                        } else if ($widgetElement && event.type === "panend") {
                            $widgetElement.remove();
                            $widgetElement = null;
                            $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);

                            var $to = $(event.srcEvent.toElement);

                            if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(angularConstants.widgetClasses.widgetClass) || $to.hasClass(angularConstants.widgetClasses.holderClass) || $to.attr(angularConstants.anchorAttr))) {
                                var x = event.srcEvent.clientX - $to.offset().left,
                                    y = event.srcEvent.clientY - $to.offset().top;

                                x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                y = Math.floor(y * angularConstants.precision) / angularConstants.precision;


                                utilService.broadcast($scope,
                                    angularEventTypes.beforeVideoWidgetCreationEvent,
                                    function (name, resourceName) {
                                        if (name && resourceName) {
                                            var widgetObj = uiService.createVideoWidget($to, resourceName);
                                            widgetObj.name = name;
                                            widgetObj.resourceName = resourceName;

                                            if (widgetObj) {
                                                widgetObj.css("left", x + "px");
                                                widgetObj.css("top", y + "px");
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    }

                    var $el = $(event.target),
                        mc = $el.data("hammer"),
                        $widgetElement;

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

                    return utilService.getResolveDefer();
                };

                $scope.configureWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    uiService.hidePopupMenu();

                    if (widgetObj && $scope.isConfigurable(widgetObj)) {
                        return $scope.showWidgetConfiguration();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.locateWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                        var nodeScope = angular.element($("#" + angularConstants.treeNodeIdPrefix + widgetObj.id)).scope();
                        if (nodeScope) {
                            nodeScope.exclusiveSelect && nodeScope.exclusiveSelect();
                            nodeScope.expandVisible && nodeScope.expandVisible();
                        }
                    }

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

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

                                //Show widget popup menu
                                uiService.displayPopupMenuHolder(cloneObj);
                            });
                        }
                    }

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

                $scope.setSelectedButton = function (event) {
                    var $el = $(event.target),
                        $sel = $(event.currentTarget).siblings(".selectedButton");

                    $sel.empty();
                    $sel.append($el.clone());

                    $compile($sel)($scope);

                    return utilService.getResolveDefer();
                };

                $scope.setSelectedConrol = function (controlId) {
                    controlId && $scope.toggleExclusiveDisplay("#" + controlId, null, true);
                };

                $scope.zoomIn = function (event) {
                    var $container = $("#frameSketchContainer"),
                        zoomStyle = Math.floor(parseFloat($container.css("zoom")) * 100) / 100,
                        index;

                    if (!$scope.zoomList.every(function (value, i) {
                            if (value > zoomStyle) {
                                index = i;
                                return false;
                            }
                            return true;
                        })) {
                        zoomStyle = $scope.zoomList[index];
                        $container.css("zoom", zoomStyle);
                    }

                    return utilService.getResolveDefer();
                };

                $scope.zoomOut = function (event) {
                    var $container = $("#frameSketchContainer"),
                        zoomStyle = Math.floor(parseFloat($container.css("zoom")) * 100) / 100,
                        index;

                    if (!$scope.zoomList.slice(0).reverse().every(function (value, i) {
                            if (value < zoomStyle) {
                                index = i;
                                return false;
                            }
                            return true;
                        })) {
                        zoomStyle = $scope.zoomList[index];
                        $container.css("zoom", zoomStyle);
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignLeft = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignLeft && widgetObj.alignLeft();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignHorizontalCenter = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignHorizontalCenter && widgetObj.alignHorizontalCenter();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignRight = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignRight && widgetObj.alignRight();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignTop = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignTop && widgetObj.alignTop();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignVerticalCenter = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignVerticalCenter && widgetObj.alignVerticalCenter();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.alignBottom = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.alignBottom && widgetObj.alignBottom();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.fillParent = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.fillVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillVertical && widgetObj.fillVertical();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.fillHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && !widgetObj.isTemporary) {
                        widgetObj.fillHorizontal && widgetObj.fillHorizontal();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.spanVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanVertical && widgetObj.spanVertical();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.spanHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.fillParent && widgetObj.fillParent();
                        widgetObj.spanHorizontal && widgetObj.spanHorizontal();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.spaceVertical = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceVertical && widgetObj.spaceVertical();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.spaceHorizontal = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.spaceHorizontal && widgetObj.spaceHorizontal();
                        widgetObj.disassemble();
                    }

                    return utilService.getResolveDefer();
                };

                $scope.groupWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                        widgetObj.setTemporary(false);
                    }

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

                $scope.ungroupWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    if (widgetObj && widgetObj.isElement) {
                        widgetObj.disassemble();
                    }

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

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

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

                $scope.moveUpWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveAfter();

                    uiService.hidePopupMenu();
                };

                $scope.moveDownWidget = function (event) {
                    var widgetObj = $rootScope.sketchObject.pickedWidget;

                    widgetObj && widgetObj.moveBefore();

                    uiService.hidePopupMenu();

                    return utilService.getResolveDefer();
                };

                $scope.toggleRuler = function (event) {
                    $rootScope.sketchWidgetSetting.showRuler = !$rootScope.sketchWidgetSetting.showRuler;

                    return utilService.getResolveDefer();
                };

                $scope.canPositionWidget = function (widgetObj) {
                    return widgetObj && widgetObj.isElement;
                };

                $scope.toggleResize = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var widgetObj = $rootScope.sketchObject.pickedWidget;
                    if (widgetObj && widgetObj.isElement) {
                        return $scope.toggleSelect(event);
                    }

                    return utilService.getResolveDefer();
                };

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
                };

                $scope.togglePlayWidget = function (event) {
                    $rootScope.sketchWidgetSetting.isPlaying = !$rootScope.sketchWidgetSetting.isPlaying;

                    $rootScope.$broadcast(angularEventTypes.playProjectEvent, $rootScope.sketchWidgetSetting.isPlaying);

                    return utilService.getResolveDefer();
                };

                $scope.saveProject = function (event) {
                    return $rootScope.loadedProject.save();
                };

                $scope.loadProject = function (event) {
                    $rootScope.loadedProject.unload();

                    return utilService.chain(
                        [
                            function () {
                                return $rootScope.loadedProject.load();
                            },
                            function () {
                                return $scope.renderProject();
                            }
                        ]
                    );
                };

                $scope.renderProject = function () {
                    return utilService.whilst(
                        function () {
                            return !document.getElementsByClassName(angularConstants.widgetClasses.deviceHolderClass).length;
                        }, function (err) {
                            err || utilService.latestOnce(
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
                                null,
                                angularConstants.unresponsiveInterval,
                                "FrameSketchController.renderProject"
                            )();
                        },
                        angularConstants.checkInterval,
                        "FrameSketchController.renderProject",
                        angularConstants.renderTimeout
                    );
                };

                $scope.toggleLockProject = function (event) {
                    if ($rootScope.loadedProject.projectRecord.lock) {
                        return $rootScope.loadedProject.unlock($rootScope.loginUser._id);
                    } else {
                        return $rootScope.loadedProject.tryLock($rootScope.loginUser._id);
                    }
                };

                $scope.convertToHtml = function (event) {
                    return $rootScope.loadedProject.convertToHtml($rootScope.loginUser._id);
                };

                $scope.toggleDisplayRoute = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $canvasContainer = $('#canvasContainer'),
                        $editButton = $("#toggleCanvasEditButton");

                    $rootScope.sketchWidgetSetting.isDefingRoute = !$rootScope.sketchWidgetSetting.isDefingRoute;
                    $canvasContainer.removeClass("select"), $editButton.removeClass("select");

                    if ($rootScope.sketchWidgetSetting.isDefingRoute) {
                        return $timeout(function () {
                            uiCanvasService.initCanvas();

                            $rootScope.$broadcast(angularEventTypes.defineWidgetRouteEvent, $rootScope.sketchWidgetSetting.isDefingRoute);
                            if ($rootScope.sketchObject.pickedWidget) {
                                $rootScope.sketchObject.pickedWidget.displayRoute();

                                //Hide widget popup menu
                                uiService.hidePopupMenuHolder();
                            }
                        }, angularConstants.actionDelay);
                    } else {
                        $rootScope.$broadcast(angularEventTypes.defineWidgetRouteEvent, $rootScope.sketchWidgetSetting.isDefingRoute);

                        if ($rootScope.sketchObject.pickedWidget) {
                            $rootScope.sketchObject.pickedWidget.hideRoute();

                            //Show widget popup menu
                            uiService.displayPopupMenuHolder($rootScope.sketchObject.pickedWidget);
                        }

                        return utilService.getResolveDefer();
                    }
                };

                $scope.toggleDefineRoute = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $canvasContainer = $('#canvasContainer'),
                        $editButton = $("#toggleCanvasEditButton");

                    $canvasContainer.toggleClass("select"), $editButton.toggleClass("select");

                    return utilService.getResolveDefer();
                };

                $scope.startLink = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var offset = $("#sketchCanvas").offset();

                    uiCanvasService.startLink(event.clientX - offset.left, event.clientY - offset.top), uiCanvasService.hideMenu();

                    return utilService.getResolveDefer();
                };

                $scope.removePoint = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    uiCanvasService.removePoint(), uiCanvasService.hideMenu();

                    return utilService.getResolveDefer();
                };

                $scope.showDemo = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "Demo";
                    appService.loadRepoArtifact($rootScope.sketchWidgetSetting.pickedArtifact, $rootScope.sketchWidgetSetting.pickedLibrary._id, $rootScope.sketchWidgetSetting.pickedLibrary.name, "", "#frameSketchWidgetDemoArea").then(function () {
                        var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                        scope.toggleModalWindow();
                    });
                };

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
                };

                $scope.showVideoWidgetName = function (callback) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "VideoWidgetName";

                    $("#newVideoWidgetName").val("");
                    if (callback) {
                        $scope.onModalClose = function () {
                            callback($("#newVideoWidgetName").val(), $(".widgetVideoContent select").val());
                        };
                    }
                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();

                    return scope.toggleModalWindow();
                };

                $scope.showWidgetConfiguration = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "Configuration";

                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();

                    return scope.toggleModalWindow().then(function () {
                        var configurationScope = angular.element($("#widget-configurator-control .configurationContent")).scope();
                        return configurationScope.init();
                    });
                };

                $scope.showResourceEditor = function (el, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "ResourceEditor";
                    $scope.onModalClose = function () {
                        utilService.broadcast(scope,
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
                        return utilService.getResolveDefer($el);
                    });
                };

                $scope.hideModal = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                    return scope.toggleModalWindow().then(function () {
                        try {
                            $scope.onModalClose && $scope.onModalClose();
                            $scope.onModalClose = null;
                        } catch (e) {
                            $exceptionHandler(e);
                        }

                        return utilService.getResolveDefer();
                    });
                };

                $scope.confirmWidgetName = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();
                    return scope.toggleModalWindow().then(function () {
                        try {
                            $scope.onModalClose && $scope.onModalClose();
                            $scope.onModalClose = null;
                        } catch (e) {
                            $exceptionHandler(e);
                        }

                        return utilService.getResolveDefer();
                    });
                };

                $scope.isConfigurable = function (widgetObj) {
                    return uiService.isConfigurable(widgetObj);
                };

                $scope.nextPage = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return uiService.nextPage($rootScope.sketchObject.pickedPage);
                };

                $scope.prevPage = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return uiService.prevPage($rootScope.sketchObject.pickedPage);
                };

                $scope.onPseudoChange = function (pseudo) {
                    $rootScope.$broadcast(angularEventTypes.widgetPseudoChangeEvent, pseudo);
                };

                function setterFactory(obj, name, source) {
                    return function (to) {
                        var setterName = source && "setTrackablePseudoStyle" || ("set" + name.charAt(0).toUpperCase() + name.substr(1)),
                            setter = obj[setterName];
                        if (setter) {
                            utilService.once(function (widgetObj, styleSource, setterFn, value) {
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

                function init() {
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
                                        utilService.once(positionInputHandler, null, angularConstants.unresponsiveInterval, "FrameSketchController.init.createWidgetPositionInputAssign.positionInputHandler." + name)(value);
                                    }

                                    var args = Array.prototype.slice.call(arguments),
                                        result = assign.apply(fn, args);

                                    return result;
                                }
                            };

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

                            //Hide widget popup menu holder
                            uiService.hidePopupMenuHolder();
                        } else {
                            $scope.initWidgetPosition();

                            if ($rootScope.sketchWidgetSetting.isDefingRoute) {
                                if ($rootScope.sketchObject.pickedWidget && !$rootScope.sketchObject.pickedWidget.isTemporary && $rootScope.sketchObject.pickedWidget.isKindOf("ElementSketchWidget")) {
                                    $rootScope.sketchObject.pickedWidget.displayRoute();

                                    //Hide widget popup menu holder
                                    uiService.hidePopupMenuHolder();
                                }
                            } else {
                                if ($rootScope.sketchObject.pickedWidget.isKindOf("PageSketchWidget")) {
                                    //Hide widget popup menu holder
                                    uiService.hidePopupMenuHolder();
                                } else {
                                    //Display widget popup menu holder
                                    uiService.displayPopupMenuHolder($rootScope.sketchObject.pickedWidget);
                                }
                            }
                        }
                    });

                    $scope.pickedWidgetStateWatcher = $rootScope.$watch("sketchObject.pickedWidget.state", function (to) {
                        if (to) {
                            widgetSettingList.forEach(function (setting) {
                                initWidgetSettingWatch(setting);
                            });

                            //If widget is visible, show popup menu holder, else hide holder.
                            if (utilService.isVisible($rootScope.sketchObject.pickedWidget.$element)) {
                                uiService.displayPopupMenuHolder($rootScope.sketchObject.pickedWidget);
                            } else {
                                uiService.hidePopupMenuHolder();
                            }
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
                        utilService.once(function (fn) {
                            return $scope.showWidgetName(fn);
                        }, null, angularConstants.unresponsiveInterval, "FrameSketchController.init.beforeWidgetCreation")(fn);
                    });

                    $scope.beforeVideoWidgetCreationWatcher = $scope.$on(angularEventTypes.beforeVideoWidgetCreationEvent, function (event, fn) {
                        utilService.once(function (fn) {
                            return $scope.showVideoWidgetName(fn);
                        }, null, angularConstants.unresponsiveInterval, "FrameSketchController.init.beforeVideoWidgetCreationWatcher")(fn);
                    });

                    $scope.resourceEditWatcher = $scope.$on(angularEventTypes.resourceEditEvent, function (event, obj) {
                        utilService.once(function (obj) {
                            return $scope.showResourceEditor(obj.editor).then(function ($editorEl) {
                                try {
                                    obj.callback && obj.callback($editorEl);
                                } catch (e) {
                                    $exceptionHandler(e);
                                }

                                return utilService.getResolveDefer();
                            })
                        }, null, angularConstants.unresponsiveInterval, "FrameSketchController.init.resourceEditWatcher")(obj);
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
                        if ($scope.beforeVideoWidgetCreationWatcher) {
                            $scope.beforeVideoWidgetCreationWatcher();
                            $scope.beforeVideoWidgetCreationWatcher = null;
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

                init();

                var widgetSettingList = [];

                $scope.uiService = uiService;
                $scope.Math = Math;
                $scope.pseudo = "";
                $scope.iconLibraryList = $rootScope.iconLibraryList;
                $scope.effectLibraryList = $rootScope.effectLibraryList;
                $scope.zoomList = [0.5, 0.66, 0.75, 1];
                $scope.controlList = [
                    {
                        id: "pseudo-control",
                        name: "Pseudo Element Style",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-pseudo-element-before"
                    },
                    {
                        id: "background-image-control",
                        name: "Background Image",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-image-before"
                    },
                    {
                        id: "color-control",
                        name: "Color",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-color-before"
                    },
                    {
                        id: "border-control",
                        name: "Border",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-border-before"
                    },
                    {
                        id: "fill-control",
                        name: "Linear Gradient",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-gradient-before"
                    },
                    {
                        id: "text-shadow-control",
                        name: "Text Shadow",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-text-shadow-before"
                    },
                    {
                        id: "box-shadow-control",
                        name: "Box Shadow",
                        thumbnail: "icon-frame-sketch-before icon-frame-sketch-box-shadow-before"
                    }
                ];
                $scope.pickedControl = "background-image-control";
            }

            function ProjectController($scope, $rootScope, $timeout, $interval, $q, angularConstants, appService, uiService, uiFlowService, uiBookService, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".projectContainer"),
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
                };

                $scope.displayProjectEdit = function (project, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.selectedProject = project;
                    $scope.pickedProject = _.clone($scope.selectedProject);

                    var scope = angular.element($(".projectContainer .md-modal")).scope();
                    return scope.toggleModalWindow();
                };

                $scope.hideProjectModal = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($(".projectContainer .md-modal")).scope();
                    return scope.toggleModalWindow();
                };

                $scope.toggleProjectButton = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $el = $(event.target);
                    !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                    $el.toggleClass("select");
                    $scope.toggleCheckMode = $el.hasClass("select");
                    $scope.toggleEditMode = false;
                };

                $scope.toggleProjectEditButton = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $el = $(event.target);
                    !$el.hasClass("select") && $(".topbarToggleButton.select").removeClass("select");
                    $el.toggleClass("select");
                    $scope.toggleCheckMode = false;
                    $scope.toggleEditMode = !$scope.toggleEditMode;
                };

                $scope.toggleCheck = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    projectItem.checked = !projectItem.checked;
                    !projectItem.checked && delete projectItem.checked;
                };

                $scope.toggleQrCode = function (projectItem, event) {
                    event && event.stopPropagation && event.stopPropagation();


                    $scope.toggleDisplay("#{0} .projectItemQrCode".format(projectItem.id));
                };

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
                };

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
                };

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
                };

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
                        case "book":
                            uiBookService.loadProject(projectItem).then(function (err) {
                                if (!err) {
                                    urlService.book(false, {project: projectItem});
                                }
                            });
                            break;
                    }
                };

                function init() {
                    var urlParams = $rootScope.urlParams && $rootScope.urlParams["project"] || null,
                        projectAction = urlParams && urlParams.projectAction || "";

                    if (projectAction === "create") {
                        delete urlParams.projectAction;

                        $timeout(function () {
                            $scope.displayProjectCreation();
                        }, angularConstants.actionDelay);
                    }
                }

                init();

                $scope._ = _;
            }

            function RepoLibController($scope, $rootScope, $timeout, $interval, $q, angularConstants, appService, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".repoLibContainer"),
                    "scope": $scope
                });

                $scope.getCurrentVersion = function (repoArtifact) {
                    if ($scope.dependencyRecord) {
                        var artifact = _.findWhere($scope.dependencyRecord.artifactList, {artifactId: repoArtifact._id});

                        if (artifact) {
                            repoArtifact._version = artifact.version;
                            return;
                        }
                    }

                    delete repoArtifact._version;
                };

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
                };

                $scope.showDemo = function (repoArtifact, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    appService.loadRepoArtifact(repoArtifact, $scope.repoLib._id, $scope.repoLib.name, "", "#demoArea").then(function () {
                        var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                        scope.toggleModalWindow();
                    });
                };

                $scope.hideDemo = function (repoArtifact, event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element($(".repoLibContainer .md-modal")).scope();
                    scope.toggleModalWindow();
                };

                function init() {
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
                }

                $scope.$on("$routeChangeSuccess", function (scope, next, current) {
                    current && init();
                });


                $scope._ = _;
            }

            function RepoController($scope, $rootScope, $timeout, $interval, $q, angularConstants, appService, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".repoContainer"),
                    "scope": $scope
                });

                $scope.setRepoType = function (repoTypeValue) {
                    appService.getRepoLibrary(repoTypeValue && {type: repoTypeValue} || {}).then(function (result) {
                        $rootScope.repoLibraryList = result.data.result == "OK" && result.data.resultValue || [];
                    });
                };

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
                };

                function init() {
                }

                init();

                $scope.repoTypes = angularConstants.repoTypes;
                $scope._ = _;
            }

            function FlowController($scope, $rootScope, $timeout, $interval, $q, angularConstants, appService, uiService, uiFlowService, flowService, urlService, utilService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".flowContainer"),
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

                    return utilService.getResolveDefer();
                };

                $scope.saveProject = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $rootScope.loadedProject.save();
                };

                $scope.loadProject = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $rootScope.loadedProject.unload();

                    return utilService.chain(
                        [
                            function () {
                                return $rootScope.loadedProject.load();
                            }
                        ]
                    );
                };

                $scope.toggleLockProject = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    if ($rootScope.loadedProject.projectRecord.lock) {
                        return $rootScope.loadedProject.unlock($rootScope.loginUser._id);
                    } else {
                        return $rootScope.loadedProject.tryLock($rootScope.loginUser._id);
                    }
                };

                $scope.clearSelection = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var scope = angular.element(document.querySelector("#flowStepTree [ui-tree-node].selected")).scope();
                    scope && scope.unselect();

                    $("#flowStepTree [ui-tree-handle].edit").removeClass("edit");

                    return utilService.getResolveDefer();
                };

                $scope.deactivateNameEdit = function () {
                    $("#flowStepTree [ui-tree-handle].edit").removeClass("edit");
                };

                $scope.activateNameEdit = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    var $el = $(event.currentTarget);
                    $el.addClass("edit");
                };

                $scope.getSelectedFlowItem = function () {
                    var scope = angular.element(document.querySelector("#flowStepTree [ui-tree-node].selected")).scope();

                    return scope && scope.item;
                };

                $scope.getParentFlowItem = function () {
                    var el = document.querySelector("#flowStepTree [ui-tree-node].selected");
                    if (el) {
                        var parentElement = el.parentElement.parentElement;
                        if (parentElement.hasAttribute("ui-tree-node")) {
                            var scope = angular.element(parentElement).scope();
                            return scope && scope.item;
                        }
                    }
                };

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

                    return utilService.getResolveDefer();
                };

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

                    return utilService.getResolveDefer();
                };

                $scope.insertAfterInvokeFlowStep = function (event) {
                    return $scope.insertAfterFlowStep("InvokeFlowStep");
                };

                $scope.insertAfterMapFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.insertAfterFlowStep("MapFlowStep");
                };

                $scope.insertAfterSwitchFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.insertAfterFlowStep("SwitchFlowStep");
                };

                $scope.insertAfterRepeatFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.insertAfterFlowStep("RepeatFlowStep");
                };

                $scope.insertAfterSequenceFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.insertAfterFlowStep("SequenceFlowStep");
                };

                $scope.insertAfterExitFlowStep = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.insertAfterFlowStep("ExitFlowStep");
                };

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

                    return utilService.getResolveDefer();
                };

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

                    return utilService.getResolveDefer();
                };

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

                    return utilService.getResolveDefer();
                };

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

                    return utilService.getResolveDefer();
                };

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

                    return utilService.getResolveDefer();
                };

                function init() {
                    $scope.$on('$destroy', function () {
                    });
                }

                init();

                $scope._ = _;
                $scope.activeEditor = "process";
            }

            function BookController($scope, $rootScope, $timeout, $interval, $q, $log, $exceptionHandler, $compile, $parse, $templateCache, angularEventTypes, angularConstants, appService, uiService, uiBookService, bookService, utilService, uiCanvasService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".bookContainer"),
                    "scope": $scope
                });

                function getExtensionScope() {
                    return angular.element(document.getElementById("frameSketchContainer")).scope();
                }

                function defineExtensionScopeHandler(extensionScope) {
                    extensionScope.beforeBookWidgetCreationWatcher = extensionScope.$on(angularEventTypes.beforeBookWidgetCreationEvent, function (event, fn) {
                        utilService.once(function (fn) {
                            return extensionScope.showBookWidgetName(fn);
                        }, null, angularConstants.unresponsiveInterval, "BookController.defineExtensionScopeHandler.beforeBookWidgetCreationWatcher")(fn);
                    });

                    extensionScope.showBookWidgetName = function (callback) {
                        event && event.stopPropagation && event.stopPropagation();

                        extensionScope.modalUsage = "BookWidgetName";
                        extensionScope.pickedExternalBook = null;
                        extensionScope.pickedExternalBookPage = null;

                        $("#newBookWidgetName").val("");
                        if (callback) {
                            extensionScope.onModalClose = function () {
                                if (extensionScope.pickedExternalBook && extensionScope.pickedExternalBookPage) {
                                    var pageFile = "",
                                        edge = "";

                                    extensionScope.pickedExternalBook.pages.every(function (bookPage) {
                                        if (bookPage.page === extensionScope.pickedExternalBookPage) {
                                            pageFile = bookPage.file;
                                            edge = bookPage.edge;
                                            return false;
                                        }

                                        return true;
                                    });

                                    callback($("#newBookWidgetName").val(), extensionScope.pickedExternalBook.name, extensionScope.pickedExternalBookPage, pageFile, edge);
                                }
                            };
                        }
                        var scope = angular.element($("#frameSketchContainer > .modalWindowContainer > .md-modal")).scope();

                        return scope.toggleModalWindow();
                    };

                    extensionScope.enableAddPageWidget = function (event) {
                        function addBookWidgetHandler(event) {
                            var touchX = $bookElement && $bookElement.data("touchX") || 0,
                                touchY = $bookElement && $bookElement.data("touchY") || 0,
                                $container = $("." + angularConstants.widgetClasses.containerClass);

                            if (event.type === "panstart") {
                                $bookElement = $("<div />");
                                $bookElement.addClass("pickerBookShape icon-book-before icon-book-add-page-before squarePane")
                                    .css("z-index", angularConstants.draggingShapeZIndex);
                                $bookElement.appendTo($container);

                                touchX = event.srcEvent.offsetX;
                                touchY = event.srcEvent.offsetY;
                                $bookElement.data("touchX", touchX);
                                $bookElement.data("touchY", touchY);
                            } else if (event.type === "panmove") {
                                var left = event.srcEvent.clientX - $bookElement.parent().offset().left + touchX,
                                    top = event.srcEvent.clientY - $bookElement.parent().offset().top + touchY;

                                $bookElement.css("left", left + "px");
                                $bookElement.css("top", top + "px");

                                var $to = $(event.srcEvent.toElement);
                                if ($to.hasClass(angularConstants.widgetClasses.widgetClass)) {
                                    if (!$to.hasClass(angularConstants.widgetClasses.hoverClass)) {
                                        $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                                        $to.addClass(angularConstants.widgetClasses.hoverClass);
                                    }
                                } else if ($to.hasClass(angularConstants.widgetClasses.holderClass)) {
                                    $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);
                                }

                                if (angularConstants.VERBOSE) {
                                    $log.debug("left:" + left);
                                    $log.debug("touchX:" + touchX);
                                }
                            } else if ($bookElement && event.type === "panend") {
                                $bookElement.remove();
                                $bookElement = null;
                                $("." + angularConstants.widgetClasses.holderClass).find("." + angularConstants.widgetClasses.hoverClass).removeClass(angularConstants.widgetClasses.hoverClass);

                                var $to = $(event.srcEvent.toElement);

                                if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(angularConstants.widgetClasses.widgetClass) || $to.hasClass(angularConstants.widgetClasses.holderClass) || $to.attr(angularConstants.anchorAttr))) {
                                    var x = event.srcEvent.clientX - $to.offset().left,
                                        y = event.srcEvent.clientY - $to.offset().top;

                                    x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                    y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                                    utilService.broadcast($scope,
                                        angularEventTypes.beforeBookWidgetCreationEvent,
                                        function (name, externalBook, externalBookPage, externalFile, edge) {
                                            if (name) {
                                                var widgetObj = uiBookService.createBookWidget($to, externalBook, externalBookPage, externalFile, edge);
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
                        }

                        var $el = $(event.target),
                            mc = $el.data("hammer"),
                            $bookElement;

                        event && event.stopPropagation && event.stopPropagation();

                        if (!mc) {
                            mc = new Hammer.Manager(event.target);
                            mc.add(new Hammer.Press());
                            mc.add(new Hammer.Pan());
                            mc.on("panstart panmove panend", addBookWidgetHandler);
                            $el.data("hammer", mc);

                            $scope.$on('$destroy', function () {
                                mc.off("panstart panmove panend", addBookWidgetHandler);
                            });
                        }

                        return utilService.getResolveDefer();
                    };

                    extensionScope.onPickedExternalBook = function (externalBookScope, externalBookName) {
                        externalBookScope.pickedExternalBook = _.findWhere($rootScope.loadedProject.externalList, {name: externalBookName});
                        externalBookScope.pickedExternalBookPages = externalBookScope.pickedExternalBook && externalBookScope.pickedExternalBook.pages || null;
                        externalBookScope.pickedExternalBookPage = null;
                    };

                    extensionScope.confirmBookWidgetName = function (event, externalBookObj, externalBookPage) {
                        event && event.stopPropagation && event.stopPropagation();

                        if (externalBookObj && externalBookPage) {
                            extensionScope.pickedExternalBook = externalBookObj;
                            extensionScope.pickedExternalBookPage = externalBookPage;

                            return extensionScope.confirmWidgetName(event);
                        }

                        return utilService.getResolveDefer();
                    };

                    extensionScope.$on('$destroy', function () {
                        if ($scope.beforeBookWidgetCreationWatcher) {
                            $scope.beforeBookWidgetCreationWatcher();
                            $scope.beforeBookWidgetCreationWatcher = null;
                        }
                    });
                }

                function addExtensionTemplate() {
                    var extensionHtml = $templateCache.get("_bookExtension.html"),
                        $extensionChildren = $(extensionHtml).filter("[extension]"),
                        $frameSketchContainer = $("#frameSketchContainer");

                    $extensionChildren.each(function (i, element) {
                        var extensionPoint = element.getAttribute("extension"),
                            $extensionPoint = $frameSketchContainer.find("[extensionPoint='{0}']".format(extensionPoint));

                        if ($extensionPoint.length) {
                            $(element).children().insertBefore($extensionPoint[0]);
                            $compile($extensionPoint.parent())(angular.element($extensionPoint[0]).scope());
                        }
                    });
                }

                function addExtensionSnippet() {
                    return utilService.whilst(
                        function () {
                            return !getExtensionScope();
                        }, function (err) {
                            err || utilService.latestOnce(
                                function () {
                                    return $timeout(function () {
                                        var extensionScope = getExtensionScope();

                                        defineExtensionScopeHandler(extensionScope);
                                        addExtensionTemplate();
                                    });
                                },
                                null,
                                null,
                                angularConstants.unresponsiveInterval,
                                "BookController.addExtensionSnippet"
                            )();
                        },
                        angularConstants.checkInterval,
                        "BookController.addExtensionSnippet",
                        angularConstants.renderTimeout
                    );
                }

                function init() {
                    addExtensionSnippet();

                    $scope.$on('$destroy', function () {
                    });
                }

                init();
            }

            function ChatController($scope, $rootScope, $timeout, $interval, $q, $log, $exceptionHandler, $compile, $interpolate, $templateCache, angularEventTypes, angularConstants, urlService, appService, uiService, utilService, pinyinService) {
                extension && extension.attach && extension.attach($scope, {
                    "$timeout": $timeout,
                    "$interval": $interval,
                    "$q": $q,
                    "angularConstants": angularConstants,
                    "utilService": utilService,
                    "element": $scope.$element = $(".chatContainer"),
                    "scope": $scope
                });

                $scope.exitChat = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $timeout(function () {
                        urlService.back()
                    })

                    return utilService.getResolveDefer();
                }

                $scope.selectContent = function (content) {
                    var $content = $scope.$element.find(".contactContent").children("[content='" + content + "']");

                    if (!$content.hasClass("select")) {
                        $content.siblings(".select").removeClass("select");
                        $content.addClass("select");
                    }

                    var $siblingNav = $(".contactNav").children("[content='" + content + "']").siblings(".select");
                    if ($siblingNav.length) {
                        var siblingScope = angular.element($siblingNav.children(0)).scope();
                        if (siblingScope) {
                            siblingScope.toggleSelectLink && siblingScope.toggleSelectLink(false);
                        }
                    }
                }

                $scope.selectInvitationContent = function (content) {
                    var $content = $scope.$element.find(".invitationContent").children("[content='" + content + "']");

                    if (!$content.hasClass("select")) {
                        $scope.toggleSelect($content.siblings(".select")).then(function () {
                            $scope.toggleSelect($content, null, true);
                        });
                    }

                    var $siblingNav = $scope.$element.find(".invitationTopBar").children("[content='" + content + "']").siblings(".select");
                    if ($siblingNav.length) {
                        var siblingScope = angular.element($siblingNav.children(0)).scope();
                        if (siblingScope) {
                            siblingScope.toggleSelectLink && siblingScope.toggleSelectLink(false);
                        }
                    }
                }

                $scope.selectFriend = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.$element.find(".contactContent > [content=message]").find(".userName.select, .chat.select").removeClass("select");

                    $(event.currentTarget).find(".userName.select").removeClass("select");

                    var $name = $(event.target).closest(".userName"),
                        userObj = $name.data("userObj");
                    $scope.selectedChat = null;
                    $scope.selectedUser = userObj;
                    $scope.chatMode = "Single";

                    if (!_.findWhere($scope.conversationList, {_id: userObj._id})) {
                        $scope.conversationList.push({
                            _id: userObj._id,
                            name: userObj.name,
                            updateTime: 0,
                            conversationArray: []
                        })
                    }

                    return $scope.toggleSelect($name, null, true);
                }

                $scope.selectConversationUser = function (event, userObj) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.$element.find(".contactContent > [content=friend]").find(".userName.select").removeClass("select");
                    $scope.selectedChat = null;
                    $scope.selectedUser = userObj;
                    $scope.chatMode = "Single";
                    var $name = $(event.target).closest(".userName");
                    return $scope.toggleExclusiveSelect($name, null, true);
                }

                $scope.selectChat = function (event, chatObj) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.$element.find(".contactContent > [content=friend]").find(".userName.select").removeClass("select");
                    $scope.selectedUser = null;
                    $scope.selectedChat = chatObj;
                    $scope.chatMode = "Chat";
                    var $chat = $(event.target).closest(".chat");
                    $chat.siblings().removeClass("select");
                    return $scope.toggleExclusiveSelect($chat, null, true);
                }

                $scope.startAddFriend = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.inviteeList.splice(0);
                    $scope.modalUsage = "AddFriend";
                    var scope = angular.element($(".chatContainer > .modalWindowContainer > .md-modal")).scope();

                    return scope.toggleModalWindow();
                }

                $scope.startCreateDiscussion = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.chatInviteeList.splice(0);
                    $scope.modalUsage = "CreateDiscussion";
                    var scope = angular.element($(".chatContainer > .modalWindowContainer > .md-modal")).scope();

                    return scope.toggleModalWindow();
                }

                $scope.expandChatHeader = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    return $scope.toggleSelect(event.target, null).then(function (target) {
                        return $scope.toggleSelect($scope.$element.find("#chatHeader .chatDetailsContainer"), null, target.classList.contains("select"));
                    });
                }

                $scope.doSearch = function () {
                    var searchName = $("#searchNameInput").val();

                    if (searchName) {
                        searchName = searchName.trim();
                        if (searchName) {
                            return appService.getUser({name: "/" + searchName + "/i"}).then(
                                function (result) {
                                    $scope.inviteeList.splice(0);
                                    $scope.searchUserList = result && result.data.result == "OK" && result.data.resultValue || [];

                                    return utilService.getResolveDefer();
                                },
                                function (err) {
                                    return $scope.showAlert(
                                        {
                                            title: err,
                                            category: 3
                                        }
                                    );
                                }
                            );
                        }
                    }

                    return utilService.getResolveDefer();
                }

                $scope.toggleSearchUserItem = function (event, userItem) {
                    if (event && event.target && userItem) {
                        var toInvite = !$(event.target).hasClass("select");

                        if (userItem) {
                            if (toInvite) {
                                $scope.inviteeList.push(userItem);
                            } else {
                                var index;
                                if (!$scope.inviteeList.every(function (item, i) {
                                        if (item._id === userItem._id) {
                                            index = i;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    $scope.inviteeList.splice(index, 1);
                                }
                            }
                        }

                        return $scope.toggleSelect(event);
                    }

                    return utilService.getResolveDefer();
                }

                $scope.sendInvitation = function () {
                    if ($scope.inviteeList.length) {
                        return appService.sendInvitation($rootScope.loginUser._id, $scope.inviteeList).then(
                            function () {
                                return $scope.showAlert(
                                    {
                                        title: "Invitation sent successfully.",
                                        category: 1
                                    }
                                );
                            },
                            function (err) {
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            }
                        );
                    }

                    return utilService.getResolveDefer();
                }

                $scope.displayInvitation = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    $scope.modalUsage = "DisplayInvitation";
                    var scope = angular.element($(".chatContainer > .modalWindowContainer > .md-modal")).scope();

                    return scope.toggleModalWindow().then(function () {
                        return $scope.selectInvitationContent('invitation');
                    });
                }

                $scope.acceptInvitation = function (invitationObj) {
                    return appService.acceptInvitation(invitationObj.creatorId, $rootScope.loginUser._id, window.pomeloContext.options.chatRoute).then(
                        function () {
                            removeInvitation(invitationObj);

                            return appService.getUser({_id: invitationObj.creatorId}).then(function (result) {
                                addFriend(result && result.data.result == "OK" && result.data.resultValue[0]);

                                return utilService.getResolveDefer();
                            });
                        },
                        function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );
                }

                $scope.declineInvitation = function (invitationObj) {
                    return appService.declineInvitation(invitationObj.creatorId, $rootScope.loginUser._id, window.pomeloContext.options.chatRoute).then(
                        function () {
                            removeInvitation(invitationObj);

                            return utilService.getResolveDefer();
                        },
                        function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );

                }

                $scope.selectChatForChange = function (event, chatObj) {
                    event && event.stopPropagation && event.stopPropagation();

                    if (!chatObj.friendList) {
                        var friendList = Array.prototype.concat.apply(Array.prototype, _.values($scope.friendList));
                        if (chatObj.userList) {
                            chatObj.friendList = _.filter(friendList, function (friend) {
                                return chatObj.userList.every(function (user) {
                                    return user._id !== friend._id;
                                });
                            });
                        } else {
                            chatObj.friendList = friendList;
                        }
                    }
                    $scope.selectedChangingChat = chatObj;

                    return utilService.getResolveDefer();
                }

                $scope.toggleChatFriendItem = function (event, userItem) {
                    if (event && event.target && userItem) {
                        var toChatInvite = !$(event.target).hasClass("select");

                        if (userItem) {
                            if (toChatInvite) {
                                $scope.chatInviteeList.push(userItem);
                            } else {
                                var index;
                                if (!$scope.chatInviteeList.every(function (item, i) {
                                        if (item._id === userItem._id) {
                                            index = i;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    $scope.chatInviteeList.splice(index, 1);
                                }
                            }
                        }

                        return $scope.toggleSelect(event);
                    }

                    return utilService.getResolveDefer();
                }

                $scope.acceptChatInvitation = function (chatInvitationObj) {
                    return appService.acceptChatInvitation(chatInvitationObj.chatId, $rootScope.loginUser._id, window.pomeloContext.options.deviceId, window.pomeloContext.options.chatRoute).then(
                        function () {
                            removeChatInvitation(chatInvitationObj);

                            return appService.getChat($rootScope.loginUser._id, chatInvitationObj.chatId).then(function (chatList) {
                                addChat(chatList);

                                return utilService.getResolveDefer();
                            });
                        },
                        function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );
                }

                $scope.declineChatInvitation = function (chatInvitationObj) {
                    return appService.declineChatInvitation(chatInvitationObj.chatId, $rootScope.loginUser._id, window.pomeloContext.options.deviceId, window.pomeloContext.options.chatRoute).then(
                        function () {
                            removeChatInvitation(chatInvitationObj);

                            return utilService.getResolveDefer();
                        },
                        function (err) {
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        }
                    );
                }

                $scope.toggleChatCreation = function (event) {
                    event && event.stopPropagation && event.stopPropagation();

                    if (event) {
                        if (event.target.classList.contains("select")) {
                            delete $scope.selectedChangingChat;
                        } else {
                            $scope.selectedChangingChat = {
                                creatorId: $rootScope.loginUser._id,
                                name: "",
                                userList: [],
                                friendList: Array.prototype.concat.apply(Array.prototype, _.values($scope.friendList))
                            };
                        }
                    }

                    return $scope.toggleSelect(event.target).then(function () {
                        return $scope.toggleSelect($scope.$element.find("#pendingChat"));
                    });
                }

                $scope.createChat = function () {
                    if ($scope.selectedChangingChat.name) {
                        return appService.createChat($scope.selectedChangingChat.creatorId, window.pomeloContext.options.deviceId, $scope.selectedChangingChat.name, utilService.arrayPick($scope.chatInviteeList, "_id", "loginChannel"), window.pomeloContext.options.chatRoute, $scope.selectedChangingChat.payload).then(function (chatObj) {
                            _.extend($scope.selectedChangingChat, chatObj);
                            addChat($scope.selectedChangingChat);

                            return $scope.showAlert(
                                {
                                    title: "Chat {0} is created.".format(chatObj.name),
                                    category: 1
                                }
                            ).then(function () {
                                return $scope.toggleSelect($scope.$element.find("#chatCreateButton"), null, false).then(function () {
                                    return $scope.toggleSelect($scope.$element.find("#pendingChat"), null, false);
                                });
                            });
                        }, function (err) {
                            if (typeof err === "object") err = err.data || "Unknow error";
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        });
                    } else {
                        return $scope.showAlert(
                            {
                                title: "Chat name is empty.",
                                category: 3
                            }
                        );
                    }
                }

                $scope.cancelCreateChat = function () {
                    delete $scope.selectedChangingChat;
                    return $scope.toggleSelect($scope.$element.find("#chatCreateButton"), null, false).then(function () {
                        return $scope.toggleSelect($scope.$element.find("#pendingChat"), null, false);
                    });
                }

                $scope.sendChatInvitation = function () {
                    if ($scope.chatInviteeList.length) {
                        return appService.sendChatInvitation($rootScope.loginUser._id, $scope.selectedChangingChat._id, _.reject($scope.chatInviteeList, function (chatInvitee) {
                            return chatInvitee._id == $rootScope.loginUser._id;
                        })).then(
                            function () {
                                return $scope.showAlert(
                                    {
                                        title: "Invitation sent successfully.",
                                        category: 1
                                    }
                                );
                            },
                            function (err) {
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            }
                        );
                    }

                    return utilService.getResolveDefer();
                }

                $scope.closeChat = function () {
                    if ($scope.selectedChangingChat && $scope.selectedChangingChat.state !== angularConstants.pomeloState.chatCloseState) {
                        return appService.closeChat($rootScope.loginUser._id, $scope.selectedChangingChat._id, window.pomeloContext.options.chatRoute).then(function () {
                            $scope.selectedChangingChat.state = angularConstants.pomeloState.chatCloseState;

                            return $scope.showAlert(
                                {
                                    title: "Chat {0} is closed.".format($scope.selectedChangingChat.name),
                                    category: 1
                                }
                            );
                        }, function (err) {
                            if (typeof err === "object") err = err.data || "Unknow error";
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        });
                    } else {
                        return utilService.getResolveDefer();
                    }
                }

                $scope.deleteChat = function () {
                    if ($scope.selectedChangingChat) {
                        return appService.deleteChat($rootScope.loginUser._id, $scope.selectedChangingChat._id, window.pomeloContext.options.chatRoute).then(function () {
                            var index;
                            if (!$scope.chatList.every(function (chat, i) {
                                    if (chat._id === $scope.selectedChangingChat._id) {
                                        index = i;
                                        return false;
                                    }

                                    return true;
                                })) {
                                $scope.chatList.splice(index, 1);
                            }

                            var chatName = $scope.selectedChangingChat.name;
                            delete $scope.selectedChangingChat;
                            return $scope.showAlert(
                                {
                                    title: "Chat {0} is deleted.".format(chatName),
                                    category: 1
                                }
                            );
                        }, function (err) {
                            if (typeof err === "object") err = err.data || "Unknow error";
                            return $scope.showAlert(
                                {
                                    title: err,
                                    category: 3
                                }
                            );
                        });
                    } else {
                        return utilService.getResolveDefer();
                    }
                }

                $scope.pauseResumeChat = function () {
                    if ($scope.selectedChangingChat && $scope.selectedChangingChat._id && $scope.selectedChangingChat.state !== angularConstants.pomeloState.chatCloseState) {
                        if ($scope.selectedChangingChat.state == angularConstants.pomeloState.chatCreateState) {
                            return appService.startChat($rootScope.loginUser._id, window.pomeloContext.options.deviceId, $scope.selectedChangingChat._id, $scope.selectedChangingChat.userList, window.pomeloContext.options.chatRoute).then(function () {
                                $scope.selectedChangingChat.state = angularConstants.pomeloState.chatOpenState;
                                return $scope.showAlert(
                                    {
                                        title: "Chat {0} is started.".format($scope.selectedChangingChat.name),
                                        category: 1
                                    }
                                );
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });
                        } else if ($scope.selectedChangingChat.state == angularConstants.pomeloState.chatPauseState) {
                            return appService.resumeChat($rootScope.loginUser._id, $scope.selectedChangingChat._id, window.pomeloContext.options.chatRoute).then(function () {
                                $scope.selectedChangingChat.state = angularConstants.pomeloState.chatOpenState;
                                return $scope.showAlert(
                                    {
                                        title: "Chat {0} is started.".format($scope.selectedChangingChat.name),
                                        category: 1
                                    }
                                );
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });
                        } else {
                            return appService.pauseChat($rootScope.loginUser._id, $scope.selectedChangingChat._id, window.pomeloContext.options.chatRoute).then(function () {
                                $scope.selectedChangingChat.state = angularConstants.pomeloState.chatPauseState;
                                return $scope.showAlert(
                                    {
                                        title: "Chat {0} is paused.".format($scope.selectedChangingChat.name),
                                        category: 1
                                    }
                                );
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });
                        }
                    } else {
                        return utilService.getResolveDefer();
                    }
                }

                $scope.sendMessage = function () {
                    var message = $scope.$element.find("#chatTextArea").val();

                    if (message) {
                        if ($scope.chatMode === "Chat") {
                            if ($scope.selectedChat) {
                                return appService.sendChatMessage($rootScope.loginUser._id, $scope.selectedChat._id, window.pomeloContext.options.chatRoute, message).then(function (conversationList) {
                                    return addConversation(conversationList);
                                }, function (err) {
                                    if (typeof err === "object") err = err.data || "Unknow error";
                                    return $scope.showAlert(
                                        {
                                            title: err,
                                            category: 3
                                        }
                                    );
                                });
                            }
                        } else if ($scope.chatMode === "Single") {
                            if ($scope.selectedUser) {
                                return appService.sendSingleMessage($rootScope.loginUser._id, [$scope.selectedUser], window.pomeloContext.options.chatRoute, message).then(function (conversationList) {
                                    return addConversation(conversationList);
                                }, function (err) {
                                    if (typeof err === "object") err = err.data || "Unknow error";
                                    return $scope.showAlert(
                                        {
                                            title: err,
                                            category: 3
                                        }
                                    );
                                });
                            }
                        }
                    }

                    return utilService.getResolveDefer();
                }

                function registerPomeloListeners() {
                    $scope.pomeloListeners = $scope.pomeloListeners || {};
                    var eventType = angularConstants.pomeloEventType.inviteEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var userId = data.userId;

                            appService.getInvitation({
                                creatorId: userId,
                                inviteeId: $rootScope.loginUser._id,
                                accepted: 0
                            }).then(function (result) {
                                addInvitation(result);
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });
                        });
                    eventType = angularConstants.pomeloEventType.messageEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var useId = data.userId, payload = data.payload;

                            addConversation({message: payload.message, userId: useId});
                        });
                    eventType = angularConstants.pomeloEventType.acceptEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var userId = data.userId;

                            appService.getUser({
                                _id: userId
                            }).then(function (result) {
                                addFriend(result && result.data.result == "OK" && result.data.resultValue[0]);
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });

                        });
                    eventType = angularConstants.pomeloEventType.chatInviteEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var chatId = data.chatId;

                            appService.getChatInvitation({
                                chatId: chatId,
                                inviteeId: $rootScope.loginUser._id,
                                accepted: 0
                            }).then(function (result) {
                                addChatInvitation(result);
                            }, function (err) {
                                if (typeof err === "object") err = err.data || "Unknow error";
                                return $scope.showAlert(
                                    {
                                        title: err,
                                        category: 3
                                    }
                                );
                            });
                        });
                    eventType = angularConstants.pomeloEventType.chatConnectEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.chatDisconnectEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.chatPauseEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var chatId = data.chatId;

                            $scope.chatList.every(function (chatObj) {
                                if (chatObj._id == chatId) {
                                    chatObj.state = angularConstants.pomeloState.chatPauseState;
                                    return false;
                                }

                                return true;
                            })
                        });
                    eventType = angularConstants.pomeloEventType.chatResumeEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var chatId = data.chatId;

                            $scope.chatList.every(function (chatObj) {
                                if (chatObj._id == chatId) {
                                    chatObj.state = angularConstants.pomeloState.chatOpenState;
                                    return false;
                                }

                                return true;
                            })
                        });
                    eventType = angularConstants.pomeloEventType.chatMessageEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var useId = data.userId, chatId = data.chatId, payload = data.payload;

                            addConversation({message: payload.message, userId: useId, chatId: chatId});
                        });
                    eventType = angularConstants.pomeloEventType.chatAcceptEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var userId = data.userId, chatId = data.chatId, userList;

                            $scope.chatList.every(function (chatObj) {
                                if (chatObj._id == chatId) {
                                    userList = chatObj.userList = chatObj.userList || [];

                                    var index;
                                    if (!chatObj.friendList.every(function (f, i) {
                                            if (f._id == userId) {
                                                index = i;
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        chatObj.friendList.splice(index, 1);
                                    }

                                    return false;
                                }

                                return true;
                            })

                            if (userList) {
                                appService.getUser({_id: userId}).then(
                                    function (result) {
                                        if (result && result.data.result == "OK" && result.data.resultValue.length) {
                                            userList.push(result.data.resultValue[0]);
                                        }

                                        return utilService.getResolveDefer();
                                    },
                                    function (err) {
                                        return $scope.showAlert(
                                            {
                                                title: err,
                                                category: 3
                                            }
                                        );
                                    }
                                );
                            }
                        });
                    eventType = angularConstants.pomeloEventType.chatCloseEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                            var chatId = data.chatId;

                            $scope.chatList.every(function (chatObj) {
                                if (chatObj._id == chatId) {
                                    chatObj.state = angularConstants.pomeloState.chatCloseState;
                                    return false;
                                }

                                return true;
                            })
                        });
                    eventType = angularConstants.pomeloEventType.topicInviteEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.topicPauseEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.topicResumeEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.topicMessageEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.topicCloseEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                    eventType = angularConstants.pomeloEventType.topicDisconnectEvent;
                    $scope.pomeloListeners[eventType] = $scope.pomeloListeners[eventType] || $scope.$on(eventType, function (event, data) {
                        });
                }

                function unregisterPomeloListeners() {
                    _.each($scope.pomeloListeners, function (fn) {
                        fn && fn();
                    })
                }

                function addConversation(conversationObj) {
                    if (conversationObj) {
                        var conversationList;
                        if (toString.call(conversationObj) === '[object Array]') {
                            if (conversationObj.length) conversationList = conversationObj;
                        } else if (toString.call(conversationObj) === '[object Object]') {
                            conversationList = [conversationObj];
                        }

                        var $items = $scope.$element.find('.conversationItems.select');

                        if (!$scope.chatConversationFn) {
                            var templateHtml = $templateCache.get("_chatConversation.html");

                            $scope.chatConversationFn = $interpolate(templateHtml);
                        }

                        conversationList.forEach(function (conversationItem) {
                            var arr;
                            if (conversationItem.chatId) {
                                var chatId = conversationItem.chatId,
                                    chatObj;
                                $scope.chatList.every(function (chat) {
                                    if (chat._id === chatId) {
                                        chatObj = chat;
                                        return false;
                                    }

                                    return true;
                                });

                                chatObj.updateTime = conversationItem.updateTime;
                                arr = (chatObj.conversationList = chatObj.conversationList || []);
                            } else {
                                var userId = conversationItem.senderId;
                                if (userId === $rootScope.loginUser._id) {
                                    userId = conversationItem.receiverId;
                                }

                                var friendObj,
                                    friendList = Array.prototype.concat.apply(Array.prototype, _.values($scope.friendList));

                                friendList.every(function (friend) {
                                    if (friend._id === userId) {
                                        friendObj = friend;
                                        return false;
                                    }

                                    return true;
                                });

                                if (friendObj) {
                                    if ($scope.conversationList.every(function (conversationUser) {
                                            if (conversationUser._id === userId) {
                                                conversationUser.updateTime = conversationItem.updateTime;
                                                arr = conversationUser.conversationArray;
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        arr = [];
                                        $scope.conversationList.push({
                                            _id: userId,
                                            name: friendObj.name,
                                            updateTime: conversationObj.updateTime,
                                            conversationArray: arr
                                        })
                                    }
                                }
                            }

                            arr && arr.push(conversationItem);

                            var $html = $($scope.chatConversationFn({
                                item: conversationItem,
                                isSentByMe: conversationItem.userId === $rootScope.loginUser._id
                            }));

                            $compile($html.appendTo($items))($scope);

                            $scope.toggleSelect($html);
                        });
                    }
                }

                function addFriend(friend) {
                    if (friend) {
                        var friendList;
                        if (toString.call(friend) === '[object Array]') {
                            if (friend.length) friendList = friend;
                        } else if (toString.call(friend) === '[object Object]') {
                            friendList = [friend];
                        }
                        if (friendList) {
                            friendList.forEach(function (item) {
                                if (item._id !== $rootScope.loginUser._id) {
                                    var pyStr = pinyinService.makePy(item.name),
                                        initial = "#";

                                    if (pyStr && pyStr.length) {
                                        initial = pyStr[0].charAt(0).toUpperCase();
                                    }
                                    $scope.friendList[initial] = $scope.friendList[initial] || [];
                                    if ($scope.friendList[initial].every(function (f) {
                                            return f._id != item._id;
                                        })) {
                                        $scope.friendList[initial].push(item);
                                    }
                                }
                            });
                        }
                    }
                }

                function addInvitation(invitation) {
                    if (invitation) {
                        var invitationList;
                        if (toString.call(invitation) === '[object Array]') {
                            if (invitation.length) invitationList = invitation;
                        } else if (toString.call(invitation) === '[object Object]') {
                            invitationList = [invitation];
                        }
                        if (invitationList) {
                            invitationList.forEach(function (item) {
                                if ($scope.invitationList.every(function (i) {
                                        return i._id != item._id;
                                    })) {
                                    $scope.invitationList.push(item);
                                }
                            });
                        }

                        if ($scope.invitationList.length) {
                            $scope.toggleSelect($scope.$element.find(".invitationFlag"), null, true);
                        }
                    }
                }

                function removeInvitation(invitation) {
                    var invitationList;
                    if (toString.call(invitation) === '[object Array]') {
                        if (invitation.length) invitationList = invitation;
                    } else if (toString.call(invitation) === '[object Object]') {
                        invitationList = [invitation];
                    }
                    if (invitationList) {
                        invitationList.forEach(function (item) {
                            var index;
                            if (!$scope.invitationList.every(function (i, idx) {
                                    if (i._id == item._id) {
                                        index = idx;
                                        return false;
                                    }

                                    return true;
                                })) {
                                $scope.invitationList.splice(index, 1);
                            }
                        });
                    }

                    if (!$scope.invitationList.length && !$scope.chatInvitationList.length) {
                        $scope.toggleSelect($scope.$element.find(".invitationFlag"), null, false);
                    }
                }

                function addChatInvitation(chatInvitation) {
                    if (chatInvitation) {
                        var chatInvitationList;
                        if (toString.call(chatInvitation) === '[object Array]') {
                            if (chatInvitation.length) chatInvitationList = chatInvitation;
                        } else if (toString.call(chatInvitation) === '[object Object]') {
                            chatInvitationList = [chatInvitation];
                        }
                        if (chatInvitationList) {
                            chatInvitationList.forEach(function (item) {
                                if ($scope.chatInvitationList.every(function (i) {
                                        return i._id != item._id;
                                    })) {
                                    $scope.chatInvitationList.push(item);
                                }
                            });
                        }

                        if ($scope.chatInvitationList.length) {
                            $scope.toggleSelect($scope.$element.find(".invitationFlag"), null, true);
                        }
                    }
                }

                function removeChatInvitation(chatInvitation) {
                    var chatInvitationList;
                    if (toString.call(chatInvitation) === '[object Array]') {
                        if (chatInvitation.length) chatInvitationList = chatInvitation;
                    } else if (toString.call(chatInvitation) === '[object Object]') {
                        chatInvitationList = [chatInvitation];
                    }
                    if (chatInvitationList) {
                        chatInvitationList.forEach(function (item) {
                            var index;
                            if (!$scope.chatInvitationList.every(function (i, idx) {
                                    if (i._id == item._id) {
                                        index = idx;
                                        return false;
                                    }

                                    return true;
                                })) {
                                $scope.chatInvitationList.splice(index, 1);
                            }
                        });
                    }

                    if (!$scope.invitationList.length && !$scope.chatInvitationList.length) {
                        $scope.toggleSelect($scope.$element.find(".invitationFlag"), null, false);
                    }
                }

                function addChat(chat) {
                    if (chat) {
                        var chatList;
                        if (toString.call(chat) === '[object Array]') {
                            if (chat.length) chatList = chat;
                        } else if (toString.call(chat) === '[object Object]') {
                            chatList = [chat];
                        }
                        if (chatList) {
                            chatList.forEach(function (item) {
                                if ($scope.chatList.every(function (i) {
                                        return i._id != item._id;
                                    })) {
                                    $scope.chatList.push(item);
                                }
                            });
                        }
                    }
                }

                function onEvent(data) {
                    var signal = data.signal,
                        eventType;

                    switch (signal) {
                        case angularConstants.pomeloSignal.inviteSignal:
                            eventType = angularConstants.pomeloEventType.inviteEvent;
                            break;
                        case angularConstants.pomeloSignal.messageSignal:
                            eventType = angularConstants.pomeloEventType.messageEvent;
                            break;
                        case angularConstants.pomeloSignal.acceptSignal:
                            eventType = angularConstants.pomeloEventType.acceptEvent;
                            break;
                        case angularConstants.pomeloSignal.chatInviteSignal:
                            eventType = angularConstants.pomeloEventType.chatInviteEvent;
                            break;
                        case angularConstants.pomeloSignal.chatConnectSignal:
                            eventType = angularConstants.pomeloEventType.chatConnectEvent;
                            break;
                        case angularConstants.pomeloSignal.chatDisconnectSignal:
                            eventType = angularConstants.pomeloEventType.chatDisconnectEvent;
                            break;
                        case angularConstants.pomeloSignal.chatPauseSignal:
                            eventType = angularConstants.pomeloEventType.chatPauseEvent;
                            break;
                        case angularConstants.pomeloSignal.chatResumeSignal:
                            eventType = angularConstants.pomeloEventType.chatResumeEvent;
                            break;
                        case angularConstants.pomeloSignal.chatMessageSignal:
                            eventType = angularConstants.pomeloEventType.chatMessageEvent;
                            break;
                        case angularConstants.pomeloSignal.chatAcceptSignal:
                            eventType = angularConstants.pomeloEventType.chatAcceptEvent;
                            break;
                        case angularConstants.pomeloSignal.chatCloseSignal:
                            eventType = angularConstants.pomeloEventType.chatCloseEvent;
                            break;
                        case angularConstants.pomeloSignal.topicInviteSignal:
                            eventType = angularConstants.pomeloEventType.topicInviteEvent;
                            break;
                        case angularConstants.pomeloSignal.topicPauseSignal:
                            eventType = angularConstants.pomeloEventType.topicPauseEvent;
                            break;
                        case angularConstants.pomeloSignal.topicResumeSignal:
                            eventType = angularConstants.pomeloEventType.topicResumeEvent;
                            break;
                        case angularConstants.pomeloSignal.topicMessageSignal:
                            eventType = angularConstants.pomeloEventType.topicMessageEvent;
                            break;
                        case angularConstants.pomeloSignal.topicCloseSignal:
                            eventType = angularConstants.pomeloEventType.topicCloseEvent;
                            break;
                        case angularConstants.pomeloSignal.topicDisconnectSignal:
                            eventType = angularConstants.pomeloEventType.topicDisconnectEvent;
                            break;
                    }

                    utilService.broadcast($scope, eventType, data);
                }

                function init() {
                    function initControl() {
                        var $container = $('#chatListContainer');

                        $container.sly({
                            smart: 1,
                            activateOn: 'click',
                            mouseDragging: 1,
                            touchDragging: 1,
                            releaseSwing: 1,
                            scrollBar: null,
                            scrollBy: 10,
                            pagesBar: null,
                            activatePageOn: 'click',
                            speed: 300,
                            elasticBounds: 1,
                            easing: 'easeOutExpo',
                            dragHandle: 1,
                            dynamicHandle: 1,
                            clickBar: 1
                        });

                        var $chatDetailsContainer = $scope.$element.find('#chatHeader .chatDetailsContainer');

                        $chatDetailsContainer.sly({
                            smart: 1,
                            horizontal: true,
                            activateOn: 'click',
                            mouseDragging: 1,
                            touchDragging: 1,
                            releaseSwing: 1,
                            scrollBar: null,
                            scrollBy: 10,
                            pagesBar: null,
                            activatePageOn: 'click',
                            speed: 300,
                            elasticBounds: 1,
                            easing: 'easeOutExpo',
                            dragHandle: 1,
                            dynamicHandle: 1,
                            clickBar: 1
                        });

                        addConversation({
                            message: "ABCABCABCABCABCABCABCABCABCABCABCABCABCABCABCABC",
                            userId: $rootScope.loginUser._id
                        });
                    }

                    $scope.pomeloState = angularConstants.pomeloState;
                    $scope.conversationList = [
                    ];
                    //{_id: "52591a12c763d5e45855637a", name: "安亦斐", updateTime: "", conversationArray: []}

                    $scope.chatList = [];//The list of chats the login user join in
                    $scope.inviteeList = [];//The list of people the login user will send invitation to
                    $scope.chatInviteeList = [];//The list of people the login user will send chat invitation to
                    $scope.friendList = {
                        "#": [],
                        "A": [],
                        "B": [],
                        "C": [],
                        "D": [],
                        "E": [],
                        "F": [],
                        "G": [],
                        "H": [],
                        "I": [],
                        "J": [],
                        "K": [],
                        "L": [],
                        "M": [],
                        "N": [],
                        "O": [],
                        "P": [],
                        "Q": [],
                        "R": [],
                        "S": [],
                        "T": [],
                        "U": [],
                        "V": [],
                        "W": [],
                        "X": [],
                        "Y": [],
                        "Z": [],
                    };
                    $scope.invitationList = [];//The list of invitations for the login user to accept
                    $scope.chatInvitationList = [];//The list of chat invitations for the login user to accept

                    $scope.$on('$destroy', function () {
                        unregisterPomeloListeners();
                        var pomeloInstance = window.pomeloContext.pomeloInstance;
                        if (pomeloInstance) {
                            pomeloInstance.disconnect();
                        }
                        delete window.pomeloContext;
                    });

                    return $q.all([
                        appService.getGroupUser($rootScope.loginUser._id, true),
                        appService.getUnprocessedInvitation($rootScope.loginUser._id),
                        appService.getChat($rootScope.loginUser._id),
                        appService.getChatInvitation({
                            inviteeId: $rootScope.loginUser._id,
                            accepted: 0
                        }),
                        utilService.chain([
                            appService.loadPomelo.bind(appService),
                            appService.initPomelo.bind(appService),
                            appService.connectPomelo.bind(appService, $rootScope.loginUser._id, $rootScope.loginUser.loginChannel)
                        ]).then(function (err) {
                            if (err) {
                                return utilService.getRejectDefer(err);
                            } else {
                                window.pomeloContext.pomeloInstance.on(window.pomeloContext.options.chatRoute, onEvent);
                                registerPomeloListeners();

                                initControl();

                                return utilService.getResolveDefer();
                            }
                        })
                    ]).then(function (results) {
                        var groupUserList = results[0],
                            invitationList = results[1],
                            chatList = results[2],
                            chatInvitationList = results[3];

                        if (groupUserList && groupUserList.length) {
                            addFriend(groupUserList[0].userList);
                        }
                        addInvitation(invitationList);
                        addChat(chatList);
                        addChatInvitation(chatInvitationList);

                        return utilService.getResolveDefer();
                    }, function (err) {
                        if (typeof err === "object") err = err.data || "Unknow error";
                        return $scope.showAlert(
                            {
                                title: err,
                                category: 3
                            }
                        );
                    });
                }

                init();
            }

            appModule.controller("RootController", ["$scope", "$rootScope", "$q", "$timeout", "$interval", "angularEventTypes", "angularConstants", "appService", "serviceRegistry", "urlService", "utilService", RootController]).controller("LoginController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "angularConstants", "appService", "urlService", "utilService", LoginController]).controller("FrameSketchController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "$log", "$exceptionHandler", "$compile", "$parse", "angularEventTypes", "angularConstants", "appService", "uiService", "utilService", "uiCanvasService", FrameSketchController]).controller("BookController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "$log", "$exceptionHandler", "$compile", "$parse", "$templateCache", "angularEventTypes", "angularConstants", "appService", "uiService", "uiBookService", "bookService", "utilService", "uiCanvasService", BookController]).controller("FlowController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "angularConstants", "appService", "uiService", "uiFlowService", "flowService", "urlService", "utilService", FlowController]).controller("ProjectController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "angularConstants", "appService", "uiService", "uiFlowService", "uiBookService", "urlService", "utilService", ProjectController]).controller("RepoController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "angularConstants", "appService", "urlService", "utilService", RepoController]).controller("RepoLibController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "angularConstants", "appService", "urlService", "utilService", RepoLibController]).controller("ChatController", ["$scope", "$rootScope", "$timeout", "$interval", "$q", "$log", "$exceptionHandler", "$compile", "$interpolate", "$templateCache", "angularEventTypes", "angularConstants", "urlService", "appService", "uiService", "utilService", "pinyinService", ChatController]);
        }
    });