define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "uiUtilService", "uiService"];

            appModule.directive("uiStateTransition", _.union(inject, [function ($http, $timeout, $q, uiUtilService, uiService) {
                'use strict';

                var defaults = {
                        triggerJson: "",
                        animationJson: ""
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {pickedWidget: "=", pickedPage: "=", dockAlign: "="},
                    replace: false,
                    templateUrl: "include/_state_transition.html",
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
                                        scope.activeWidget = widgetObj || scope.pickedWidget;
                                    }
                                });

                                scope.triggers = {};
                                scope.animations = [];
                                scope._ = _;
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleTransitionDetails = function (selector, event) {
                                    scope.toggleSelect(selector, event).then(function (selector) {
                                        var $el = $(selector);

                                        scope.selectTab(
                                            $el,
                                            $el.find("div[tab-sel^=tab-head-transition-details]").get(0),
                                            null,
                                            "transition-details"
                                        );

                                        $el.find('#triggerContent input').iCheck({
                                            checkboxClass: 'icheckbox_square-blue',
                                            radioClass: 'iradio_square-blue',
                                            increaseArea: '20%'
                                        });
                                    });
                                }

                                scope.selectTransitionDetailsTab = function ($tabContainer, $tabHead, event) {
                                    scope.toggleSelect("#actionWidgetTreeTab", null, false).then(function () {
                                        scope.selectTab($tabContainer, $tabHead, event);
                                    });
                                }

                                scope.toggleActionPanel = function (selector, event) {
                                    scope.toggleExpand(selector, event).then(function (selector) {
                                        var $el = $(selector),
                                            $panel = $el.find(".transition-action-panel");

                                        return scope.toggleDisplay($panel);
                                    });
                                }

                                scope.toggleConfigurationBody = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect(event.currentTarget).then(function (target) {
                                        var $el = $(target);

                                        if ($el.hasClass("select")) {
                                            $el.find('input.configurationCheckBox').on('ifChanged', function (event) {
                                                var configurationScope = angular.element(event.target).scope();
                                                configurationScope.configurationItem.booleanValue = event.target.checked;
                                                configurationScope.$apply();
                                            }).iCheck({
                                                checkboxClass: 'icheckbox_square-blue',
                                                radioClass: 'iradio_square-blue',
                                                increaseArea: '20%'
                                            });
                                        }
                                    });
                                }

                                scope.toggleActionWidgetTree = function (action, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect("#actionWidgetTreeTab").then(function () {
                                        if (element.find("#actionWidgetTreeTab").hasClass("select")) {
                                            scope.pickedAction = action;
                                        } else {
                                            if (action) {
                                                var $node = element.find("#actionWidgetTreeTab li.selected");
                                                if ($node.length) {
                                                    var nodeScope = angular.element($node).scope();
                                                    action.widgetObj = nodeScope.item;
                                                }
                                            }
                                            scope.pickedAction = null;
                                        }
                                    });
                                }

                                scope.createState = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $createButton = $(event.currentTarget),
                                        $stateOption = $createButton.siblings(".stateOption.select"),
                                        stateName = $stateOption.attr("name");

                                    stateName && scope.activeWidget.addState(stateName);
                                }

                                scope.createStateOption = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var stateName = $("#stateOptionInput").val();
                                    stateName && scope.activeWidget.addStateOption({name: stateName});
                                }

                                scope.createTransition = function (state, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && scope.activeWidget) {
                                        var transitionName = $("#transitionNameInput").val();
                                        transitionName && state.addTransition(transitionName);
                                    }
                                }

                                scope.createAction = function (parentAction, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (parentAction) {
                                        var actionType = $("#actionTypeSelect").val();
                                        actionType && parentAction.addAction(actionType);
                                    }
                                }

                                scope.deleteState = function (state, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.activeWidget && scope.activeWidget.removeState(state);
                                }

                                scope.deleteStateOption = function (stateOption, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.activeWidget && scope.activeWidget.removeStateOption(stateOption);
                                }

                                scope.deleteTransition = function (state, transition, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && transition) {
                                        var index;
                                        state.transitions.every(function (t, i) {
                                            if (t.id === transition.id) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        });

                                        index != undefined && state.transitions.splice(index, 1);
                                    }
                                }

                                scope.deleteAction = function (parentAction, action, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (parentAction && action) {
                                        var index;
                                        parentAction.childActions.every(function (a, i) {
                                            if (a.id === action.id) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        });

                                        index != undefined && parentAction.childActions.splice(index, 1);
                                    }
                                }

                                scope.getStateOptions = function (item) {
                                    var stateOptions = [_.clone(item.initialStateOption)];

                                    item.stateOptions.forEach(function (stateOption) {
                                        stateOptions.push(_.clone(stateOption));
                                    });

                                    return stateOptions;
                                }

                                scope.setAnimation = function (item, name) {
                                    item.animation = {name: name, options: {}};
                                }

                                if (options.triggerJson) {
                                    $http.get(options.triggerJson).then(function (result) {
                                        result.data.forEach(function (triggerGroup) {
                                            scope.triggers[triggerGroup.group] = triggerGroup.list;
                                        });
                                    });
                                }

                                if (options.animationJson) {
                                    $http.get(options.animationJson).then(function (result) {
                                        scope.animations = [];
                                        result.data.forEach(function (animationGroup) {
                                            scope.animations.push(animationGroup);
                                        });
                                    });
                                }

                                $timeout(function () {
                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    $wrapper.addClass("expanded");
                                    $panel.addClass("show");
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);