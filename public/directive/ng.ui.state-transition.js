define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "uiUtilService", "uiService"];

            appModule.directive("uiStateTransition", _.union(inject, [function ($http, $timeout, $q, uiUtilService, uiService) {
                'use strict';

                var boundProperties = {pickedWidget: "=", pickedPage: "="},
                    defaults = {
                        triggerJson: "",
                        animationJson: ""
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    templateUrl: "include/_state_transition.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.triggers = {};

                                scope.animations = [];
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

                                scope.toggleActionPanel = function (selector, event) {
                                    scope.toggleExpand(selector, event).then(function (selector) {
                                        var $el = $(selector),
                                            $panel = $el.find(".transition-action-panel");

                                        return scope.toggleDisplay($panel);
                                    });
                                }

                                scope.createState = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $createButton = $(event.currentTarget),
                                        $stateOption = $createButton.siblings(".stateOption.select"),
                                        stateName = $stateOption.attr("name");

                                    stateName && scope.pickedWidget.addState(stateName);
                                }

                                scope.createStateOption = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var stateName = $("#stateOptionInput").val();
                                    stateName && scope.pickedWidget.addStateOption({name: stateName});
                                }

                                scope.createTransition = function (state, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && scope.pickedWidget) {
                                        var $transitionInput = $('#' + state.id + ' .emptyTransition .transitionInput'),
                                            toStateName = $transitionInput.find("select").val(),
                                            toState;

                                        toStateName && toStateName !== state.name
                                        && !scope.pickedWidget.states.every(function (s) {
                                            if (s.context == state.context && s.name === toStateName) {
                                                toState = s;
                                                return false;
                                            }
                                            return true;
                                        }) && state.addTransition(toState);
                                    }
                                }

                                scope.deleteState = function (state, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.pickedWidget && scope.pickedWidget.removeState(state);
                                }

                                scope.deleteStateOption = function (stateOption, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.pickedWidget && scope.pickedWidget.removeStateOption(stateOption);
                                }

                                scope.deleteTransition = function (state, transition, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && transition) {
                                        var index;
                                        state.transitions.every(function (t, i) {
                                            if (t.toState === transition.toState) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        });

                                        index != undefined && state.transitions.splice(index, 1);
                                    }
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