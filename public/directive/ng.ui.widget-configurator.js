define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive("uiWidgetConfigurator", _.union(inject, [function ($parse, $http, $timeout, $q, $exceptionHandler, angularConstants, angularEventTypes, uiUtilService, uiService) {
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
                                    element: element,
                                    scope: scope
                                }));

                                function createConfigurationObject(value, key, index) {
                                    var obj = _.extend({}, value, {key: key, index: index});
                                    if (obj.type === "boundReadList") {
                                        obj.options = scope.configurableWidget.getConfiguration(obj.listName);
                                        obj.pickedValue = scope.configurableWidget.getConfiguration(key);
                                    } else if (obj.type === "boundWriteList") {
                                        obj.options = scope.configurableWidget.getConfiguration(obj.listName);
                                    } else {
                                        obj.pickedValue = scope.configurableWidget.getConfiguration(key);
                                    }

                                    return obj;
                                }

                                scope.$watch("pickedWidget", function (value) {
                                    if (value) {
                                        scope.configurableWidget = uiService.configurableWidget(value);
                                        scope.widgetSpec = _.pick(scope.configurableWidget.widgetSpec, "configuration", "name");
                                        var configuration = [],
                                            handDownConfiguration = [];

                                        _.each(_.omit(scope.widgetSpec.configuration, "state", "handDownConfiguration"), function (value, key) {
                                            configuration.push(createConfigurationObject(value, key, configuration.length));
                                        });

                                        _.each(scope.widgetSpec.configuration.handDownConfiguration && scope.widgetSpec.configuration.handDownConfiguration, function (value, key) {
                                            handDownConfiguration.push(createConfigurationObject(value, key, handDownConfiguration.length));
                                        });

                                        scope.widgetSpec.configuration = configuration;
                                        scope.widgetSpec.handDownConfiguration = handDownConfiguration;
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
                                        paletteScope.closePalette().then(function () {
                                            return scope.toggleSelect($colorPane);
                                        });
                                    } else {
                                        scope.toggleSelect($colorPane).then(function () {
                                            return paletteScope.openPalette();
                                        });
                                    }
                                }

                                scope.applyHandDownConfiguration = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.widgetSpec.isApplyingHandDown = true;
                                    scope.pickedWidget.applyHandDownConfiguration().then(function () {
                                        scope.widgetSpec.isApplyingHandDown = false;
                                    });
                                }

                                scope.initHandDownColorStyle = function (item) {
                                    $("#handDownConfiguration-" + item.index + " .configurationColorPickerPane").css({
                                        'color': uiUtilService.contrastColor(item.pickedValue.alphaColor || item.pickedValue.color),
                                        'background-color': item.pickedValue.alphaColor || item.pickedValue.color
                                    });
                                }

                                scope.setItem = function (item) {
                                    var widgetObj = scope.configurableWidget;

                                    if (item.type === "number") {
                                        var m = (item.pickedValue || "").match(/([-\d\.]+)$/)
                                        if (m && m.length == 2) {
                                            widgetObj.setConfiguration(item.key, Number(item.pickedValue));
                                        }
                                    } else if (item.type === "size") {
                                        var m = (item.pickedValue || "").match(/([-\d\.]+)(px|%)+$/)
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
                                        }
                                    }
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
                                        if (!item.options.length) {
                                            item.pickedValue = "";
                                        }
                                    }
                                }

                                scope.toggleConfigurationPanel = function (el, event) {
                                    scope.toggleDisplay($(el).find("> .configurationPanel"), event).then(function ($panel) {
                                        scope.toggleSelect($(el).find("> .configurationBar"), null, $panel.hasClass("show"));
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

                                            itemInputHandler.onceId = "uiWidgetConfigurator.createConfigurationItemAssign.itemInputHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                uiUtilService.once(itemInputHandler, null, angularConstants.unresponsiveInterval)(value);

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
                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.toggleDisplay($panel).then(function () {
                                            return scope.toggleExpand($wrapper);
                                        });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            $timeout(function () {
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
                                            }, angularConstants.actionDelay);

                                            return scope.toggleDisplay($panel);
                                        });
                                    }
                                }

                            }
                        }
                    }
                }
            }]));
        }
    }
);