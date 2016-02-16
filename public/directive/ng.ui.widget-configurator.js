define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$interval", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "utilService", "uiService"];

            appModule.directive("uiWidgetConfigurator", _.union(inject, [function ($parse, $http, $timeout, $interval, $q, $exceptionHandler, angularConstants, angularEventTypes, utilService, uiService) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "=",
                        pickedWidget: "="
                    },
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_widget-configurator.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$interval": $interval,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                function createConfigurationObject(widget, value, key, index) {
                                    var obj = _.extend({}, value, {key: key, index: index});
                                    if (obj.type === "boundReadList") {
                                        obj.options = scope.configurableWidget.getConfiguration(obj.listName);
                                        obj.pickedValue = scope.configurableWidget.getConfiguration(key);
                                    } else if (obj.type === "boundWriteList") {
                                        obj.options = scope.configurableWidget.getConfiguration(obj.listName);
                                    } else {
                                        obj.pickedValue = scope.configurableWidget.getConfiguration(key);
                                    }
                                    obj.widget = widget;

                                    return obj;
                                }

                                scope.$watch("pickedWidget", function (value) {
                                    if (value) {
                                        scope.configurableWidget = null;

                                        $timeout(function () {
                                            scope.configurableWidget = uiService.configurableWidget(value);
                                            scope.widgetSpec = _.pick(scope.configurableWidget.widgetSpec, "configuration", "name");
                                            var configuration = [],
                                                handDownConfiguration = [];

                                            _.each(_.omit(scope.widgetSpec.configuration, "state", "handDownConfiguration"), function (value, key) {
                                                configuration.push(createConfigurationObject(scope.configurableWidget, value, key, configuration.length));
                                            });

                                            _.each(scope.widgetSpec.configuration.handDownConfiguration && scope.widgetSpec.configuration.handDownConfiguration, function (value, key) {
                                                handDownConfiguration.push(createConfigurationObject(scope.configurableWidget, value, key, handDownConfiguration.length));
                                            });

                                            scope.widgetSpec.configuration = configuration;
                                            scope.widgetSpec.handDownConfiguration = handDownConfiguration;
                                        });
                                    }
                                });

                                scope.toggleSelectConfigurationColor = function (item, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $colorBar = $(event.currentTarget),
                                        $colorPane = $colorBar.parent(),
                                        $palette = $colorBar.siblings(".configurationColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    scope.pickedItem = item;
                                    if ($colorPane.hasClass("select")) {
                                        return paletteScope.closePalette().then(function () {
                                            return scope.toggleSelect($colorPane);
                                        });
                                    } else {
                                        return scope.toggleSelect($colorPane).then(function () {
                                            return paletteScope.openPalette();
                                        });
                                    }
                                }

                                scope.applyHandDownConfiguration = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.widgetSpec.isApplyingHandDown = true;
                                    scope.configurableWidget.applyHandDownConfiguration().then(function () {
                                        scope.widgetSpec.isApplyingHandDown = false;
                                    });

                                    return utilService.getResolveDefer();
                                }

                                scope.initHandDownColorStyle = function (item) {
                                    $("#handDownConfiguration-" + item.index + " .configurationColorPickerPane").css({
                                        'color': utilService.contrastColor(item.pickedValue.alphaColor || item.pickedValue.color),
                                        'background-color': item.pickedValue.alphaColor || item.pickedValue.color
                                    });
                                }

                                scope.setItem = function (item) {
                                    var widgetObj = item.widget;

                                    if (item.type === "number") {
                                        var m = (item.pickedValue || "").match(/([-\d\.]+)$/)
                                        if (m && m.length == 2) {
                                            widgetObj.setConfiguration(item.key, Number(item.pickedValue));
                                        }
                                    } else if (item.type === "size") {
                                        var m = (item.pickedValue || "").match(/([-\d\.]+)(px|em|%)+$/)
                                        if (m && m.length == 3) {
                                            widgetObj.setConfiguration(item.key, item.pickedValue);
                                        }
                                    } else if (item.type === "color") {
                                        widgetObj.setConfiguration(item.key, item.pickedValue);
                                        item.handDown && scope.initHandDownColorStyle(item);
                                    } else {
                                        widgetObj.setConfiguration(item.key, item.pickedValue);
                                    }
                                }

                                scope.createConfigurationItemOption = function (item, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.target).siblings("input"),
                                        optionName = $el.val();

                                    if (optionName) {
                                        if (item.options.every(function (opt) {
                                                return opt.name !== optionName;
                                            })) {
                                            item.options.push({name: optionName});
                                            scope.setItem(item);
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.deleteConfigurationItemOption = function (item, option, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var index;
                                    if (!item.options.every(function (opt, i) {
                                            if (opt.name === option.name) {
                                                index = i;
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        item.options.splice(index, 1);
                                        scope.setItem(item);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleConfigurationPanel = function (event) {
                                    var $el = $(event.currentTarget);
                                    return scope.toggleDisplay($el.find("> .configurationPanel"), event).then(function ($panel) {
                                        return scope.toggleSelect($el.find("> .configurationBar"), null, $panel.hasClass("show"));
                                    });
                                }

                                function createConfigurationItemAssign(name) {
                                    var fn = $parse(name),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function itemInputHandler(value) {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    scope.setItem($scope.configurationItem);
                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                utilService.latestOnce(
                                                    itemInputHandler,
                                                    null,
                                                    null,
                                                    angularConstants.unresponsiveInterval,
                                                    "uiWidgetConfigurator.createConfigurationItemAssign.itemInputHandler.{0}.{1}".format(scope.configurableWidget.id, $scope.configurationItem.name)
                                                )(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createConfigurationItemAssign("configurationItem.pickedValue");
                            },
                            post: function (scope, element, attrs) {
                                scope.init = function () {
                                    element.find(".configurationPane input[type='checkbox']").on('ifChanged', function (event) {
                                        var checked = event.target.checked,
                                            order = parseInt($(event.target).attr("item-order"));
                                        if (order != null) {
                                            var item = scope.widgetSpec.configuration[order];
                                            item.booleanValue = checked;
                                            scope.setItem(item);
                                            scope.$apply();
                                        }

                                    }).iCheck({
                                        checkboxClass: 'icheckbox_square-blue',
                                        radioClass: 'iradio_square-blue',
                                        increaseArea: '20%'
                                    });

                                    var $content = $(element.find(".modal-control-panel"));
                                    $content.sly({
                                        smart: 1,
                                        activateOn: 'click',
                                        mouseDragging: 1,
                                        touchDragging: 0,
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

                                    $content.css("overflow", "visible");

                                    return utilService.getResolveDefer();
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);