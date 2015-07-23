define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$exceptionHandler", "$parse", "angularConstants", "uiUtilService"];

            appModule.directive("uiSimpleDropdown", _.union(inject, [function ($timeout, $q, $exceptionHandler, $parse, angularConstants, uiUtilService) {
                'use strict';

                var boundProperties = {
                        selectionList: "=",
                        selectItem: "=",
                        unsetOptionValue: "=?",
                        enableSelection: "=?",
                        onOptionSelect: '&'
                    },
                    defaults = {
                        zIndex: 1000,
                        title: "",
                        speed: 300,
                        easing: 'ease',
                        gutter: 0,
                        // initial stack effect
                        stack: true,
                        // delay between each option animation
                        delay: 0,
                        // random angle and positions for the options
                        random: false,
                        // rotated [right||left||false] : the options will be rotated to thr right side or left side.
                        // make sure to tune the transform origin in the stylesheet
                        rotated: false,
                        // effect to slide in the options. value is the margin to start with
                        slidingIn: false,
                        // option's width, default to dropdown's width if not set.
                        width: 0,
                        // option's height, default to dropdown's height if not set.
                        height: 0,
                        displayUnsetOption: false,
                        showTitle: true
                    },
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_simple-dropdown.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.options = _.extend(_.clone(options), $parse(attrs['uiSimpleDropdownOpts'])(scope, {}));

                                scope.pickValue = function (selection) {
                                    if (typeof selection === "object") {
                                        return selection && selection[scope.options.dataField] || "";
                                    } else {
                                        return selection;
                                    }
                                }

                                scope.pickLabel = function (selection) {
                                    if (typeof selection === "object") {
                                        return selection && selection[scope.options.labelField] || "";
                                    } else {
                                        return selection;
                                    }
                                }

                                scope.pickThumbnail = function (selection) {
                                    if (scope.options.thumbnailField) {
                                        if (typeof selection === "object") {
                                            return selection && selection[scope.options.thumbnailField] || "";
                                        }
                                    }

                                    return "";
                                }
                            },
                            post: function (scope, element, attrs) {
                                function optWidth() {
                                    return (scope.options.width > 0 ? scope.options.width : element.find("li").width());
                                }

                                function optHeight() {
                                    return (scope.options.height > 0 ? scope.options.height : element.find("li").height());
                                }

                                function hasTitle() {
                                    return scope.options.showTitle || element.find("[ng-transclude]").children().length;
                                }

                                function positionStyle(i) {
                                    var styleObj = {
                                        left: 0,
                                        transform: 'none'
                                    };

                                    if (scope.options.slidingIn) {
                                        _.extend(styleObj, {
                                            top: ( i + (hasTitle() ? 1 : 0) ) * ( optHeight() + scope.options.gutter ),
                                            marginLeft: i % 2 === 0 ? scope.options.slidingIn : -scope.options.slidingIn,
                                            opacity: 0
                                        });
                                    } else {
                                        _.extend(styleObj, {
                                            top: 0,
                                            left: 0,
                                            width: optWidth(),
                                            marginLeft: 0,
                                            opacity: 1
                                        });

                                        if (scope.options.stack) {
                                            if (i == scope.optionLength(scope.selectionList) - 1) {
                                                _.extend(styleObj, {
                                                    top: 9,
                                                    left: 4,
                                                    width: optWidth() - 8
                                                });
                                            }
                                            else if (i == scope.optionLength(scope.selectionList) - 2) {
                                                _.extend(styleObj, {
                                                    top: 6,
                                                    left: 2,
                                                    width: optWidth() - 4
                                                });
                                            }
                                            else if (i == scope.optionLength(scope.selectionList) - 3) {
                                                _.extend(styleObj, {
                                                    top: 3,
                                                    left: 0,
                                                    width: optWidth()
                                                });
                                            }
                                        }
                                    }

                                    return styleObj;
                                }

                                function openStyle(i) {
                                    var styleObj = scope.prefixedStyle('transition', 'all {0}ms {1}', scope.options.speed, scope.options.easing),
                                        height = optHeight(),
                                        width = optWidth();

                                    _.extend(styleObj, {
                                        opacity: 1,
                                        top: scope.options.rotated ? (hasTitle() ? height : 0) + scope.options.gutter : ( i + (hasTitle() ? 1 : 0) ) * ( height + scope.options.gutter),
                                        left: scope.options.random ? Math.floor(Math.random() * 11 - 5) : 0,
                                        width: width,
                                        marginLeft: 0
                                    });

                                    scope.options.delay && _.extend(styleObj,
                                        scope.options.slidingIn ?
                                            scope.prefixedStyle('transition-delay', '{0}ms', i * scope.options.delay) :
                                            scope.prefixedStyle('transition-delay', '{0}ms', ( scope.optionLength(scope.selectionList) - 1 - i ) * scope.options.delay)
                                    );

                                    if (scope.options.random) {
                                        _.extend(styleObj, scope.prefixedStyle("transform", "rotate({0}deg)", Math.floor(Math.random() * 11 - 5)));
                                    } else if (scope.options.rotated) {
                                        if (scope.options.rotated === "right") {
                                            _.extend(styleObj, scope.prefixedStyle("transform", "rotate(-{0}deg)", i * 5));
                                        } else {
                                            _.extend(styleObj, scope.prefixedStyle("transform", "rotate({0}deg)", i * 5));
                                        }
                                    } else {
                                        _.extend(styleObj, scope.prefixedStyle("transform", "none"));
                                    }

                                    return styleObj;
                                }

                                function closeStyle(i) {
                                    var styleObj = scope.prefixedStyle('transition', 'all {0}ms {1}', scope.options.speed, scope.options.easing);

                                    scope.options.delay && _.extend(styleObj,
                                        scope.options.slidingIn ?
                                            scope.prefixedStyle('transition-delay', '{0}ms', (scope.optionLength(scope.selectionList) - 1 - i) * scope.options.delay) :
                                            scope.prefixedStyle('transition-delay', '{0}ms', i * scope.options.delay)
                                    );

                                    _.extend(styleObj, positionStyle(i));

                                    return styleObj;
                                }


                                function closeDropdown() {
                                    element.find(".cd-dropdown").removeClass("cd-active");
                                    element.find("li").each(function (i) {
                                        $(this).css(closeStyle(i));
                                    });
                                }

                                scope.optionLength = function (selectionList) {
                                    return (selectionList && selectionList.length || 0) + scope.options.displayUnsetOption ? 1 : 0;
                                }

                                scope.toggleOpen = function (event) {
                                    element.find(".cd-dropdown.cd-active").length && scope.close(event) || scope.open(event);
                                }

                                scope.open = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    element.find(".cd-dropdown").addClass("cd-active");
                                    element.find("li").each(function (i) {
                                        $(this).css(openStyle(i));
                                    });

                                    return true;
                                }

                                scope.close = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    closeDropdown();

                                    return true;
                                }

                                scope.onSelect = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.enableSelection == null || scope.enableSelection) {
                                        var $optEl = $(event.target),
                                            value = $optEl.attr("data-value"),
                                            selectionOrder = $optEl.attr("selection-order");

                                        if (selectionOrder != -1) {
                                            scope.selection = scope.selectionList[selectionOrder];
                                        } else {
                                            scope.selection = null;
                                        }

                                        scope.selectItem = value;
                                    }

                                    scope.close();

                                    $timeout(function () {
                                        scope.onOptionSelect && scope.onOptionSelect();
                                    });

                                    return true;
                                }

                                scope.$watch("selectItem", function (to) {
                                    if (scope.pickValue(scope.selection) != to) {
                                        if (scope.selectionList && scope.selectionList.every(function (s) {
                                                if (scope.pickValue(s) == to) {
                                                    scope.selection = s;
                                                    return false;
                                                }

                                                return true;
                                            })) {
                                            scope.selection = null;
                                        }
                                    }
                                })

                                scope.$watch("selectionList", function (to) {
                                    if (to != null && to.length) {
                                        uiUtilService.whilst(
                                            function () {
                                                return element.find("ul").find("li").length !== scope.optionLength(to);
                                            },
                                            function (callback) {
                                                callback();
                                            },
                                            function (err) {
                                                var defer = $q.defer();

                                                if (!err) {
                                                    $timeout(function () {
                                                        defer.resolve();
                                                        closeDropdown();
                                                    }, angularConstants.actionDelay);
                                                } else {
                                                    $timeout(function () {
                                                        defer.reject();
                                                    });
                                                }

                                                return defer.promise;
                                            },
                                            angularConstants.checkInterval,
                                            "ui-simple-dropdown.watchSelectionList-{0}".format(element.attr("id") || _.now()),
                                            angularConstants.renderTimeout
                                        );
                                    }
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);