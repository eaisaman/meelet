define(
    ["angular-lib", "jquery-lib", "underscore-lib", "app-util", "app-service-registry"],
    function () {
        return function (appModule, extension, meta) {
            var FEATURE = "BaseService",
                PLATFORM = "embedded",
                appService = function ($rootScope, $http, $timeout, $q, $exceptionHandler, $compile, $cookies, $cookieStore, utilService, angularConstants, angularEventTypes, serviceRegistry) {
                    this.$rootScope = $rootScope;
                    this.$http = $http;
                    this.$timeout = $timeout;
                    this.$q = $q;
                    this.$exceptionHandler = $exceptionHandler;
                    this.$compile = $compile;
                    this.$cookies = $cookies;
                    this.$cookieStore = $cookieStore;
                    this.utilService = utilService;
                    this.serviceRegistry = serviceRegistry;
                    this.angularConstants = angularConstants;
                    this.angularEventTypes = angularEventTypes;
                    this.appMeta = this.pageMeta = angular.copy(meta);
                };

            appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$compile", "$cookies", "$cookieStore", "utilService", "angularConstants", "angularEventTypes", "serviceRegistry"];

            appService.prototype.registerService = function () {
                this.serviceRegistry && this.serviceRegistry.register(this, FEATURE, PLATFORM);
            };

            appService.prototype.unregisterService = function () {
                this.serviceRegistry && this.serviceRegistry.unregister(FEATURE, PLATFORM);
            };

            appService.prototype.cordovaPromise = function (functionName) {
                var self = this;

                function cordovaReady(fn) {

                    var queue = [];

                    var impl = function () {
                        queue.push(Array.prototype.slice.call(arguments));
                    };

                    document.addEventListener('deviceready', function () {
                        queue.forEach(function (args) {
                            fn.apply(this, args);
                        });
                        impl = fn;
                    }, false);

                    return function () {
                        return impl.apply(this, arguments);
                    };
                }

                return function () {
                    var defer = self.$q.defer();

                    cordovaReady(function () {
                        cordova.exec(
                            function (result) {
                                defer.resolve(result);
                            },
                            function (err) {
                                defer.reject(err);
                            },
                            "BaseNativeBridge", functionName, Array.prototype.slice.call(arguments));

                    }).apply(self, Array.prototype.slice.call(arguments));

                    return defer.promise;
                }
            };

            /* Services managed by registry are visible to designer, serving generated app. */
            appService.prototype.createUser = function (userObj) {
                var self = this;

                return self.cordovaPromise("createUser").apply(self, [JSON.stringify(userObj)]).then(
                    function () {
                        return self.restoreUserFromStorage();
                    },
                    function (err) {
                        return self.getRejectDefer(err);
                    }
                );
            }

            appService.prototype.refreshUser = function (loginName, rememberMe) {
                var self = this;

                return self.cordovaPromise("refreshUser").apply(self, [loginName, rememberMe]).then(
                    function () {
                        return self.restoreUserFromStorage();
                    },
                    function (err) {
                        return self.getRejectDefer(err);
                    }
                );
            };

            appService.prototype.doLogin = function (loginName, password, rememberMe) {
                var self = this;

                return self.cordovaPromise("doLogin").apply(self, [loginName, password, rememberMe]).then(
                    function () {
                        return self.restoreUserFromStorage();
                    },
                    function (err) {
                        return self.getRejectDefer(err);
                    }
                );
            };

            appService.prototype.doLogout = function () {
                var self = this;

                return this.cordovaPromise("doLogout").apply(this, Array.prototype.slice.call(arguments)).then(
                    function () {
                        var defer = self.$q.defer();

                        self.$timeout(function () {
                            for (var key in self.$rootScope.loginUser) {
                                delete self.$rootScope.loginUser[key];
                            }

                            defer.resolve();
                        });

                        return defer.promise;
                    },
                    function (err) {
                        return self.getRejectDefer(err);
                    }
                );
            };

            appService.prototype.restoreUserFromStorage = function () {
                var self = this;

                return self.cordovaPromise("restoreUserFromStorage").apply(this, Array.prototype.slice.call(arguments)).then(
                    function (result) {
                        var defer = self.$q.defer(),
                            userObj = result.data.resultValue;

                        self.$timeout(function () {
                            self.$rootScope.loginUser = self.$rootScope.loginUser || {};

                            for (var key in self.$rootScope.loginUser) {
                                delete self.$rootScope.loginUser[key];
                            }

                            for (var key in userObj) {
                                self.$rootScope.loginUser[key] = userObj[key];
                            }

                            defer.resolve(userObj);
                        });

                        return defer.promise;
                    },
                    function (err) {
                        return self.getRejectDefer(err);
                    }
                );
            };

            appService.prototype.getUser = function (userFilter) {
                return this.cordovaPromise("getUser").apply(this, [JSON.stringify(userFilter)]);
            };

            appService.prototype.getUserDetail = function (userFilter) {
                return this.cordovaPromise("getUserDetail").apply(this, [JSON.stringify(userFilter)]);
            };

            appService.prototype.getProject = function (projectFilter) {
                return this.cordovaPromise("getProject").apply(this, [JSON.stringify(projectFilter)]);
            };

            appService.prototype.getChatConfiguration = function () {
                var self = this;

                return self.cordovaPromise("getChatConfiguration").apply(this, []).then(function (result) {
                    if (result.data.result === "OK") {
                        var chatOptions = result.data.resultValue;
                        return self.utilService.getResolveDefer(chatOptions);
                    } else {
                        return self.utilService.getRejectDefer(result.data.reason);
                    }
                }, function (err) {
                    return self.utilService.getRejectDefer(err);
                });
            }

            appService.prototype.getServerUrl = function () {
                return this.cordovaPromise("getServerUrl").apply(this, []);
            };

            appService.prototype.getDeviceId = function () {
                return this.cordovaPromise("getDeviceId").apply(this, []);
            };

            appService.prototype.getGroupUser = function (userId, isFriend) {
                var args = [userId];
                if (isFriend != null) args.push(isFriend);
                return this.cordovaPromise("getGroupUser").apply(this, args);
            }

            appService.prototype.sendInvitation = function (userId, inviteeList) {
                return this.cordovaPromise("sendInvitation").apply(this, [userId, JSON.stringify(inviteeList)]);
            }

            appService.prototype.getInvitation = function (invitationFilter) {
                return this.cordovaPromise("getInvitation").apply(this, [JSON.stringify(invitationFilter)]);
            }

            appService.prototype.getUnprocessedInvitation = function (inviteeId) {
                return this.getInvitation({
                    inviteeId: inviteeId,
                    processed: 0,
                    active: 1
                });
            }

            appService.prototype.getChatInvitation = function (invitationFilter) {
                return this.cordovaPromise("getChatInvitation").apply(this, [JSON.stringify(invitationFilter)]);
            }

            appService.prototype.getChat = function (userId) {
                return this.cordovaPromise("getChat").apply(this, [userId]);
            }

            appService.prototype.acceptInvitation = function (creatorId, inviteeId, route) {
                return this.cordovaPromise("acceptInvitation").apply(this, [creatorId, inviteeId, route, 1]);
            }

            appService.prototype.declineInvitation = function (creatorId, inviteeId, route) {
                return this.cordovaPromise("acceptInvitation").apply(this, [creatorId, inviteeId, route, 0]);
            }

            appService.prototype.acceptChatInvitation = function (chatId, userId, deviceId, route) {
                return this.cordovaPromise("acceptChatInvitation").apply(this, [chatId, userId, deviceId, route, 1]);
            }

            appService.prototype.declineChatInvitation = function (chatId, userId, deviceId, route) {
                return this.cordovaPromise("declineChatInvitation").apply(this, [chatId, userId, deviceId, route, 0]);
            }

            appService.prototype.createChat = function (userId, deviceId, name, uids, route, payload) {
                return this.cordovaPromise("createChat").apply(this, [userId, deviceId, name, JSON.stringify(uids), route, JSON.stringify(payload)]);
            }

            appService.prototype.sendChatInvitation = function (userId, chatId, chatInviteeList, route) {
                var uids = JSON.stringify(self.utilService.arrayPick(chatInviteeList, ["_id", "loginChannel"]));
                return this.cordovaPromise("sendChatInvitation").apply(this, [userId, chatId, JSON.stringify(uids), route]);
            }

            appService.prototype.deleteChat = function (userId, chatId, route) {
                return this.cordovaPromise("deleteChat").apply(this, [userId, chatId, route]);
            }

            appService.prototype.closeChat = function (userId, chatId, route) {
                return this.cordovaPromise("closeChat").apply(this, [userId, chatId, route]);
            }

            appService.prototype.startChat = function (userId, deviceId, chatId, chatUserList, route) {

                return this.cordovaPromise("startChat").apply(this, [userId, deviceId, chatId, JSON.stringify(uids), route]);
            }

            appService.prototype.connectChat = function (userId, deviceId, chatId, route) {
                return this.cordovaPromise("connectChat").apply(this, [userId, deviceId, chatId, route]);
            }

            appService.prototype.pauseChat = function (userId, chatId, route) {
                return this.cordovaPromise("pauseChat").apply(this, [userId, chatId, route]);
            }

            appService.prototype.resumeChat = function (userId, chatId, route) {
                return this.cordovaPromise("resumeChat").apply(this, [userId, chatId, route]);
            }

            appService.prototype.sendChatMessage = function (userId, chatId, route, payload) {
                return this.cordovaPromise("sendChatMessage").apply(this, [userId, chatId, route, JSON.stringify(payload)]);
            }

            appService.prototype.sendSingleMessage = function (userId, userList, route, payload) {
                var uids = JSON.stringify(self.utilService.arrayPick(userList, ["_id", "loginChannel"]));
                return this.cordovaPromise("sendSingleMessage").apply(this, [userId, JSON.stringify(uids), route, JSON.stringify(payload)]);
            }

            window.cordova && appModule.config(["$provide", "$injector", function ($provide, $injector) {
                $provide.decorator("appService", ["$delegate", function ($delegate) {
                    _.extend($delegate.constructor.prototype, appService.prototype);
                    return $delegate;
                }]);
                $provide.service('embeddedAppService', appService);
                var svc = $injector.get('embeddedAppServiceProvider').$get();
                svc.registerService();
            }]);
        };
    }
)
;