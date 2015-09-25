define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "utilService", "uiService", "urlService"];

            appModule.directive("uiTopbar", _.union(inject, [function ($rootScope, $http, $timeout, $q, $exceptionHandler, $parse, $compile, angularConstants, angularEventTypes, appService, utilService, uiService, urlService) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        displayProjectCreation: "&",
                        renderProject: "&"
                    },
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_topbar.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                scope.urlService = urlService;
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleSelectMenu = function (event) {
                                    return scope.toggleSelect(event.target);
                                }

                                scope.unselectButtonGroup = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $sel = $(element).find(".topbarButtonGroup.select, .topbarDropdown.select");

                                    if ($sel.is(event.target)) {
                                        if ($sel.length > 1) {
                                            scope.toggleSelect($sel.not(event.target), event, false);
                                        }
                                    } else {
                                        scope.toggleSelect($sel, event, false);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.goBack = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    urlService.back();

                                    return utilService.getResolveDefer();
                                }

                                scope.goHome = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    urlService.home();

                                    return utilService.getResolveDefer();
                                }

                                scope.hideTopMenu = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect(".topbarMenu");
                                }

                                scope.onNewProject = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.hideTopMenu();

                                    if (urlService.currentLocation() === "project") {
                                        scope.displayProjectCreation();
                                    } else {
                                        $timeout(function () {
                                            urlService.home(false);
                                            urlService.project(false, {projectAction: "create"});
                                        })
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.onSelectProject = function (projectId, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.hideTopMenu();

                                    if (projectId) {
                                        var _id = $rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id || "";

                                        if (projectId !== _id) {
                                            var projectItem;
                                            if (!scope.$root.userDetail.projectList.every(function (p) {
                                                    if (p._id === projectId) {
                                                        projectItem = p;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {

                                                if (urlService.currentLocation() === "frameSketch") {
                                                    $timeout(function () {
                                                        uiService.loadProject(projectItem).then(function () {
                                                            scope.renderProject && scope.renderProject();
                                                        });
                                                    })
                                                } else {
                                                    $timeout(function () {
                                                        urlService.home(false);
                                                        uiService.loadProject(projectItem).then(function (projectObj) {
                                                            urlService.frameSketch(false, {project: projectObj});
                                                        });
                                                    })
                                                }
                                            }
                                        }
                                    }
                                }

                                scope.onVisitRepoLibrary = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (urlService.currentLocation() !== "repo") {
                                        $timeout(function () {
                                            urlService.home(false);
                                            urlService.repo(false)
                                        })
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    scope.pickedProjectId = project.projectRecord._id;
                                });

                                if ($rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id) {
                                    scope.pickedProjectId = $rootScope.loadedProject.projectRecord._id;
                                }

                                scope.$on('$destroy', function () {
                                    scope.switchProjectWatcher && scope.switchProjectWatcher();
                                    scope.switchProjectWatcher = null;
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);