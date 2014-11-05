define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$parse", "uiUtilService"];

            appModule.directive("uiSimpleDropdown", _.union(inject, [function ($timeout, $q, $parse, uiUtilService) {
                'use strict';

                var boundProperties = {selectionList: "=", selectItem: "=", unsetOptionValue: "=?", onOptionSelect: '&'},
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
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({}, boundProperties),
                    replace: false,
                    templateUrl: "include/_simple-dropdown.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                scope.options = angular.extend(options, $parse(attrs['uiSimpleDropdownOpts'])(scope, {}));
                            },
                            post: function (scope, element, attrs) {
                                function optWidth() {
                                    return (options.width > 0 ? options.width : element.find("li").width());
                                }

                                function optHeight() {
                                    return (options.height > 0 ? options.height : element.find("li").height());
                                }

                                function positionStyle(i) {
                                    var styleObj = {
                                        zIndex: options.zIndex + scope.selectionList.length - 1 - i,
                                        left: 0,
                                        transform: 'none'
                                    };

                                    if (options.slidingIn) {
                                        _.extend(styleObj, {
                                            top: ( i + 1 ) * ( optHeight() + options.gutter ),
                                            marginLeft: i % 2 === 0 ? options.slidingIn : -options.slidingIn,
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

                                        if (options.stack) {
                                            if (i == scope.selectionList.length - 1) {
                                                _.extend(styleObj, {
                                                    top: 9,
                                                    left: 4,
                                                    width: optWidth() - 8
                                                });
                                            }
                                            else if (i == scope.selectionList.length - 2) {
                                                _.extend(styleObj, {
                                                    top: 6,
                                                    left: 2,
                                                    width: optWidth() - 4
                                                });
                                            }
                                            else if (i == scope.selectionList.length - 3) {
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
                                    var styleObj = scope.prefixedStyle('transition', 'all {0}ms {1}', options.speed, options.easing),
                                        height = optHeight(),
                                        width = optWidth();

                                    _.extend(styleObj, {
                                        opacity: 1,
                                        top: options.rotated ? height + options.gutter : ( i + 1 ) * ( height + options.gutter),
                                        left: options.random ? Math.floor(Math.random() * 11 - 5) : 0,
                                        width: width,
                                        marginLeft: 0
                                    });

                                    options.delay && _.extend(styleObj,
                                        options.slidingIn ?
                                            scope.prefixedStyle('transition-delay', '{0}ms', i * options.delay) :
                                            scope.prefixedStyle('transition-delay', '{0}ms', ( scope.selectionList.length - 1 - i ) * options.delay)
                                    );

                                    if (options.random) {
                                        _.extend(styleObj, scope.prefixedStyle("transform", "rotate({0}deg)", Math.floor(Math.random() * 11 - 5)));
                                    } else if (options.rotated) {
                                        if (options.rotated === "right") {
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
                                    var styleObj = scope.prefixedStyle('transition', 'all {0}ms {1}', options.speed, options.easing);

                                    options.delay && _.extend(styleObj,
                                        options.slidingIn ?
                                            scope.prefixedStyle('transition-delay', '{0}ms', (self.optsCount - 1 - i) * options.delay) :
                                            scope.prefixedStyle('transition-delay', '{0}ms', i * options.delay)
                                    );

                                    _.extend(styleObj, positionStyle(i));

                                    return styleObj;
                                }

                                scope.toggleOpen = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    element.find(".cd-dropdown.cd-active").length && scope.close() || scope.open();
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

                                    element.find(".cd-dropdown").removeClass("cd-active");
                                    element.find("li").each(function (i) {
                                        $(this).css(closeStyle(i));
                                    });

                                    return true;
                                }

                                scope.onSelect = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $optEl = $(event.target),
                                        $inputEl = element.find("input.cd-dropdown-input"),
                                        value = $optEl.attr("data-value"),
                                        selectItem;

                                    if (scope.selectionList.every(function (sel) {
                                        if (sel[options.dataField] == value) {
                                            selectItem = sel;
                                            return false;
                                        }
                                        return true;
                                    }) && options.displayUnsetOption) selectItem = scope.unsetOptionValue;

                                    if (selectItem !== undefined) {
                                        if (scope.oneWaySelectItem && typeof scope.oneWaySelectItem === "function") {
                                            scope.oneWaySelectItem(selectItem);
                                        }
                                        scope.selectItem = selectItem;
                                    }

                                    scope.close();

                                    $timeout(function() {
                                        scope.onOptionSelect && scope.onOptionSelect();
                                    });

                                    return true;
                                }

                                $timeout(function () {
                                    scope.close();
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);