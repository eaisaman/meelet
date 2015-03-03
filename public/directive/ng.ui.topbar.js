define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$timeout", "$q", "urlService", "uiUtilService"];

            appModule.directive("uiTopbar", _.union(inject, [function ($rootScope, $timeout, $q, urlService, uiUtilService) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        displayProjectCreation: "&",
                        loadProject: "&"
                    },
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_topbar.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.urlService = urlService;
                            },
                            post: function (scope, element, attrs) {
                                scope.hideTopMenu = function (event) {
                                    event && event.stopPropagation();

                                    scope.toggleSelect(".topbarMenu");
                                }

                                scope.onNewProject = function (event) {
                                    event && event.stopPropagation();

                                    scope.hideTopMenu();

                                    if (scope.urlService.currentLocation() === "project") {
                                        scope.displayProjectCreation();
                                    } else {
                                        $timeout(function () {
                                            scope.urlService.home(false);
                                            scope.urlService.project(false, {projectAction: "create"});
                                        })
                                    }
                                }

                                scope.onSelectProject = function (projectId, event) {
                                    event && event.stopPropagation();

                                    scope.hideTopMenu();

                                    if (projectId) {
                                        var _id = $rootScope.loadedProject && $rootScope.loadedProject.projectRecrod._id || "";

                                        if (projectId !== _id) {
                                            var projectItem;
                                            if (!scope.$root.userDetail.projectList.every(function (p) {
                                                    if (p._id === projectId) {
                                                        projectItem = p;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {
                                                if (scope.urlService.currentLocation() === "frameSketch") {
                                                    scope.pickedProject = projectItem;
                                                    $timeout(function () {
                                                        scope.loadProject();
                                                    })
                                                } else {
                                                    $timeout(function () {
                                                        scope.urlService.home(false);
                                                        scope.urlService.frameSketch(false, {project: projectItem})
                                                    })
                                                }
                                            }
                                        }
                                    }
                                }

                                scope.onVisitRepoLibrary = function (event) {
                                    event && event.stopPropagation();

                                    if (scope.urlService.currentLocation() !== "repo") {
                                        $timeout(function () {
                                            scope.urlService.home(false);
                                            scope.urlService.repo(false, {project: scope.pickedProject})
                                        })
                                    }
                                }

                                scope.$watch("pickedProject", function (p) {
                                    var _id = p && p._id || null;

                                    if (scope.pickedProjectId != _id)
                                        scope.pickedProjectId = _id;
                                })
                            }
                        }
                    }
                }
            }]));
        }
    }
);