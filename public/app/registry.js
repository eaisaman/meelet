define(
    ["angular"],
    function () {
        return function (appModule, registry) {
            var serviceRegistry = function ($rootScope, $http, $timeout, $q, uiUtilService, angularConstants) {
                this.$rootScope = $rootScope;
                this.$http = $http;
                this.$timeout = $timeout;
                this.$q = $q;
                this.uiUtilService = uiUtilService;
                this.angularConstants = angularConstants;
                this.registry = _.clone(registry);
            };

            serviceRegistry.$inject = ["$rootScope", "$http", "$timeout", "$q", "uiUtilService", "angularConstants"];

            serviceRegistry.prototype.register = function (serviceImpl, feature, serviceName) {
                var self = this,
                    featureItem = _.findWhere(self.registry, {feature: feature});

                if (featureItem && serviceImpl) {
                    var serviceList = featureItem.serviceList;

                    featureItem.impl = serviceImpl;
                    featureItem.services = {};
                    if (serviceName) {
                        serviceList = [];
                        var serviceItem = _.findWhere(serviceList, {name: serviceName});
                        serviceItem && serviceList.push(serviceItem);
                    }

                    _.each(serviceList, function (serviceItem) {
                        var fn = featureItem.impl[serviceItem.name];

                        if (fn && typeof fn === "function") {
                            switch (serviceItem.communicationType) {
                                case "one-way":
                                    featureItem.services[serviceItem.name] = function () {
                                        fn.apply(featureItem.impl, Array.prototype.slice.call(arguments));
                                    }
                                    break;
                                case "callback":
                                    featureItem.services[serviceItem.name] = function () {
                                        //Promise.then
                                        return fn.apply(featureItem.impl, Array.prototype.slice.call(arguments));
                                    }
                                    break;
                                case "event":
                                    featureItem.services[serviceItem.name] = function (eventHandler) {
                                        var eventId = "SERVICE-EVENT-FEATURE-{0}-SERVICE-{1}-{2}".format(featureItem.name, serviceItem.name, _.now()),
                                            watcher = self.$rootScope.$on(eventId, function (event, result) {
                                                try {
                                                    eventHandler && eventHandler(result);
                                                } catch (e) {
                                                    self.$exceptionHandler(e);
                                                }

                                                watcher();
                                            });

                                        fn.apply(featureItem.impl, Array.prototype.concat.apply([eventId], Array.prototype.slice.call(arguments, 1, arguments.length)));
                                    }
                                    break;
                            }
                        }
                    });
                }
            }

            serviceRegistry.prototype.unregister = function (feature, serviceName) {
                var self = this,
                    featureItem = _.findWhere(self.registry, {feature: feature});

                if (featureItem) {
                    if (serviceName) {
                        delete featureItem.services[serviceName];
                        _.isEmpty(featureItem.services) && delete featureItem.impl;
                    } else {
                        delete featureItem.impl;
                        featureItem.services = {};
                    }
                }
            }

            serviceRegistry.prototype.invoke = function (feature, serviceName) {
                var self = this,
                    featureItem = _.findWhere(self.registry, {feature: feature});

                if (featureItem && featureItem.impl) {
                    var fn = featureItem.services[serviceName];
                    if (fn) {
                        return fn;
                    } else {
                        self.$log.warn("Function {0} not found on implementation of feature {1}".format(serviceName, feature));
                    }
                } else {
                    self.$log.warn("Feature " + feature + " not found or its implementation undefined.");
                }

                return angular.noop;
            }

            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('serviceRegistry', serviceRegistry);
                }]);
        }
    }
)
;