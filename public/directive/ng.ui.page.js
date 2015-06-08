define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$exceptionHandler", "$parse", "$rootScope", "angularEventTypes", "angularConstants", "uiUtilService", "uiService"];

            appModule.directive("uiPage", _.union(inject, [function ($timeout, $q, $exceptionHandler, $parse, $rootScope, angularEventTypes, angularConstants, uiUtilService, uiService) {
                'use strict';

                var defaults = {
                        pageHolderClass: "deviceHolder",
                        pageClass: "pageHolder"
                    },
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {dockAlign: "=", treeNodeIdPrefix: "="},
                    replace: false,
                    templateUrl: "include/_page.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                options = _.extend(_.clone(options), $parse(attrs['uiPageOpts'])(scope, {}));

                                scope.project = $rootScope.loadedProject;
                            },
                            post: function (scope, element, attrs) {
                                scope.togglePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $el = $(event.target);

                                    $wrapper.toggleClass("expanded");
                                    $panel.toggleClass("show");
                                    $el.toggleClass("select");
                                }

                                scope.insertPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    uiUtilService.broadcast(scope,
                                        angularEventTypes.beforeWidgetCreationEvent,
                                        function (name) {
                                            if (name) {
                                                uiService.createPage($("." + options.pageHolderClass)).then(function (pageObj) {
                                                    pageObj.name = name;
                                                    pageObj.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                    pageObj.addClass(options.pageClass);
                                                    $rootScope.sketchObject.pickedPage && $rootScope.sketchObject.pickedPage.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                    $rootScope.sketchObject.pickedPage = pageObj;
                                                    scope.project.sketchWorks.pages.push(pageObj);
                                                });
                                            }
                                        }
                                    );
                                }

                                scope.removePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.project.sketchWorks.pages.length > 1) {
                                        var i = parseInt($(".pageList select").val());

                                        var pageObj = scope.project.sketchWorks.pages[i],
                                            j = (i + 1) == scope.project.sketchWorks.pages.length ? 0 : i;

                                        scope.project.sketchWorks.pages[i].showHide(false);
                                        scope.project.sketchWorks.pages.splice(i, 1);
                                        if (pageObj == $rootScope.sketchObject.pickedPage) {
                                            $rootScope.sketchObject.pickedPage = scope.project.sketchWorks.pages[j];
                                        }
                                    }
                                }

                                scope.copyPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    uiUtilService.broadcast(scope,
                                        angularEventTypes.beforeWidgetCreationEvent,
                                        function (name) {
                                            if (name) {
                                                var i = $(".pageList select").val(),
                                                    pageObj = scope.project.sketchWorks.pages[i];

                                                uiService.copyPage(pageObj, $("." + options.pageHolderClass)).then(function (cloneObj) {
                                                    cloneObj.name = name;
                                                    cloneObj.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                    cloneObj.addClass(options.pageClass);
                                                    $rootScope.sketchObject.pickedPage && $rootScope.sketchObject.pickedPage.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                    $rootScope.sketchObject.pickedPage = cloneObj;
                                                    scope.project.sketchWorks.pages.splice(i + 1, 0, cloneObj);
                                                });
                                            }
                                        }
                                    );
                                }

                                scope.toggleSelectState = function (item, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (item != null && item != scope.stateTreeNodeItem) {
                                        scope.stateTreeNodeItem = null;

                                        $timeout(function () {
                                            scope.stateTreeNodeItem = item;

                                            if (item.stateOptions.length) {
                                                return uiUtilService.whilst(
                                                    function () {
                                                        return !angular.element(element.find("#widgetStateDropdown > div")).scope();
                                                    },
                                                    function (callback) {
                                                        callback();
                                                    },
                                                    function (err) {
                                                        if (!err) {
                                                            var $dropdown = element.find("#widgetStateDropdown");

                                                            if (event) {
                                                                var $el = $(event.target),
                                                                    offset = $el.offset();

                                                                var m = ($el.css("height") || "").match(/([-\d\.]+)px$/);
                                                                if (m && m.length == 2)
                                                                    offset.top += parseFloat(m[1]) * 1.5;
                                                                offset.left = Math.floor(offset.left * angularConstants.precision) / angularConstants.precision;
                                                                offset.top = Math.floor(offset.top * angularConstants.precision) / angularConstants.precision;

                                                                $dropdown.offset(offset);
                                                            }

                                                            scope.toggleSelect($dropdown).then(
                                                                function ($dropdown) {
                                                                    if ($dropdown.hasClass("select")) {
                                                                        angular.element(element.find("#widgetStateDropdown > div")).scope().open();
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    },
                                                    angularConstants.checkInterval,
                                                    "ui-page.toggleSelectState",
                                                    angularConstants.renderTimeout
                                                );
                                            }
                                        });
                                    } else {
                                        scope.toggleSelect(element.find("#widgetStateDropdown"), null, false).then(function () {
                                            scope.stateTreeNodeItem = null;
                                        });
                                    }

                                    return true;
                                }


                                uiUtilService.whilst(
                                    function () {
                                        return $(".pageList select option").length !== scope.project.sketchWorks.pages.lenth;
                                    },
                                    function (callback) {
                                        callback();
                                    },
                                    function (err) {
                                        uiUtilService.latestOnce(
                                            function () {
                                                return $timeout(function () {
                                                    $(".pageList select").change(function () {
                                                        var i = $(this).val(),
                                                            pageObj = scope.project.sketchWorks.pages[i];

                                                        if (pageObj.id != $rootScope.sketchObject.pickedPage.id) {
                                                            $rootScope.sketchObject.pickedPage = pageObj;
                                                            $rootScope.$apply();
                                                        }
                                                    });

                                                    scope.$broadcast("collapseAll");
                                                });
                                            },
                                            null,
                                            angularConstants.unresponsiveInterval,
                                            "ui-page.compile.post.init.pageListListener." + $rootScope.loadedProject._id
                                        )();
                                    },
                                    angularConstants.checkInterval,
                                    "ui-page.compile.post.init.pageList." + $rootScope.loadedProject._id,
                                    angularConstants.renderTimeout
                                );
                            }
                        }
                    }
                }
            }]));
        }
    }
);