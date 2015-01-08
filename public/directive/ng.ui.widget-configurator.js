define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "angularConstants", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive("uiWidgetConfigurator", _.union(inject, [function ($parse, $http, $timeout, $q, angularConstants, angularEventTypes, uiUtilService, uiService) {
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

                                scope.$watch("pickedWidget", function (value) {
                                    if (value) {
                                        var widgetObj = uiService.configurableWidget(value);
                                        scope.widgetSpec = _.pick(widgetObj.widgetSpec, "configuration", "name");
                                        var configuration = [];
                                        _.each(_.omit(scope.widgetSpec.configuration, "state"), function (value, key) {
                                            configuration.push(_.extend(value, {key: key}));
                                        });
                                        scope.widgetSpec.configuration = configuration;
                                    }
                                });

                                scope.setItem = function (item) {
                                    var widgetObj = uiService.configurableWidget(scope.pickedWidget);

                                    if (item.type === "list") {
                                        widgetObj.setConfiguration(item.key, item.pickedOption);
                                    } else if (item.type === "number") {
                                        var m = (item.numberValue || "").match(/([-\d\.]+)(px|%)+$/)
                                        if (m && m.length == 3) {
                                            widgetObj.setConfiguration(item.key, item.numberValue);
                                        }
                                    } else if (item.type === "boolean") {
                                        widgetObj.setConfiguration(item.key, item.booleanValue);
                                    }
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

                                                uiUtilService.once(itemInputHandler, null, 20)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createConfigurationItemAssign("configurationItem.numberValue");

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