define(
    ["angular", "jquery", "app-route", "app-service", "app-service-registry", "app-util"],
    function() {
        return function(appModule, extension) {
            function RootController($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {
                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function() {
                    this['Widget_1443910040698'] = {};
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443941967700'] = {};

                    this['Widget_1443941967700']['transition'] = "reverseSlideOut";

                    this['Widget_1443941967700']['side'] = "rightSide";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443941986903'] = {};

                    this['Widget_1443941986903']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443944870957'] = {};

                    this['Widget_1443944870957']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443942239926'] = {};

                    this['Widget_1443942239926']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443942353613'] = {};

                    this['Widget_1443942353613']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443942366208'] = {};

                    this['Widget_1443942366208']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443942372680'] = {};

                    this['Widget_1443942372680']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443942382209'] = {};

                    this['Widget_1443942382209']['routes'] = [];

                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443910040698"] = self["Widget_1443910040698"] || {};
                    self["Widget_1443910040698"].setState = function(name) {

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443910040698", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443941967700"].setState_1443910040699("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443910040698-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443941967700"] = self["Widget_1443941967700"] || {};
                    self["Widget_1443941967700"].setState_1443910040699 = function(name) {

                        self["Widget_1443941967700"].setState = self["Widget_1443941967700"].setState_1443910040699;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443941967700", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443941970185"].setState_1443941967701("*");
                                        })
                                    });
                                });
                                break;
                            case "select":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443941970185"].setState_1443941967707("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443941967700-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443941970185"] = self["Widget_1443941970185"] || {};
                    self["Widget_1443941970185"].setState_1443941967701 = function(name) {

                        self["Widget_1443941970185"].setState = self["Widget_1443941970185"].setState_1443941967701;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443941970185", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443941986903"].setState_1443941970185("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443941970185-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443941986903"] = self["Widget_1443941986903"] || {};
                    self["Widget_1443941986903"].setState_1443941970185 = function(name) {

                        self["Widget_1443941986903"].setState = self["Widget_1443941986903"].setState_1443941970185;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443941986903", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443944870957"].setState_1443941986903("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443941986903-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443944870957"] = self["Widget_1443944870957"] || {};
                    self["Widget_1443944870957"].setState_1443941986903 = function(name) {

                        self["Widget_1443944870957"].setState = self["Widget_1443944870957"].setState_1443941986903;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443944870957", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.handleStateAction({
                                            'id': "TransitionAction_1443944870957",
                                            'actionType': "Sequence",
                                            'widgetObj': "Widget_1443944870957",
                                            'stopOnEach': false,
                                            'childActions': [{
                                                'id': "TransitionAction_1443944870959",
                                                'actionType': "Include",
                                                'widgetObj': "Widget_1443944870957",
                                                'CLASS_NAME': "IncludeTransitionAction",
                                                'url': "resource/external/上教/首页/index/publish/web/book.html",
                                                'edge': "EDGE-16665010"
                                            }]
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443944870957-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443941970185"] = self["Widget_1443941970185"] || {};
                    self["Widget_1443941970185"].setState_1443941967707 = function(name) {

                        self["Widget_1443941970185"].setState = self["Widget_1443941970185"].setState_1443941967707;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443941970185", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443941986903"].setState_1443942155097("*");
                                        })

                                        arr.push(function() {
                                            return self["Widget_1443942239926"].setState_1443942155097("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443941970185-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443941986903"] = self["Widget_1443941986903"] || {};
                    self["Widget_1443941986903"].setState_1443942155097 = function(name) {

                        self["Widget_1443941986903"].setState = self["Widget_1443941986903"].setState_1443942155097;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443941986903", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443944870957"].setState_1443942155097("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443941986903-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443944870957"] = self["Widget_1443944870957"] || {};
                    self["Widget_1443944870957"].setState_1443942155097 = function(name) {

                        self["Widget_1443944870957"].setState = self["Widget_1443944870957"].setState_1443942155097;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443944870957", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.handleStateAction({
                                            'id': "TransitionAction_1443968318907",
                                            'actionType': "Sequence",
                                            'widgetObj': "Widget_1443944870957",
                                            'stopOnEach': false,
                                            'childActions': [{
                                                'id': "TransitionAction_1443968318908",
                                                'actionType': "Include",
                                                'widgetObj': "Widget_1443944870957",
                                                'CLASS_NAME': "IncludeTransitionAction",
                                                'url': "resource/external/上教/首页/index/publish/web/book.html",
                                                'edge': "EDGE-16665010"
                                            }]
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443944870957-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443942239926"] = self["Widget_1443942239926"] || {};
                    self["Widget_1443942239926"].setState_1443942155097 = function(name) {

                        self["Widget_1443942239926"].setState = self["Widget_1443942239926"].setState_1443942155097;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443942239926", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443942353613"].setState_1443942239926("*");
                                        })

                                        arr.push(function() {
                                            return self["Widget_1443942372680"].setState_1443942239926("*");
                                        })

                                        arr.push(function() {
                                            return self["Widget_1443942382209"].setState_1443942239926("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443942239926-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443942353613"] = self["Widget_1443942353613"] || {};
                    self["Widget_1443942353613"].setState_1443942239926 = function(name) {

                        self["Widget_1443942353613"].setState = self["Widget_1443942353613"].setState_1443942239926;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443942353613", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.registerTrigger('Widget_1443942353613', {
                                            'Gesture': {
                                                'tap': {
                                                    'triggerType': "Gesture",
                                                    'eventName': "tap",
                                                    'options': {},
                                                    'runOnce': false,
                                                    'actions': [{
                                                        'state': "*",
                                                        'actionObj': {
                                                            'id': "TransitionAction_1444040978397",
                                                            'actionType': "Sequence",
                                                            'widgetObj': "Widget_1443942353613",
                                                            'stopOnEach': false,
                                                            'childActions': [{
                                                                'id': "TransitionAction_1444040987612",
                                                                'actionType': "Service",
                                                                'widgetObj': "Widget_1443942353613",
                                                                'feature': "BaseService",
                                                                'serviceName': "toggleWidgetSound",
                                                                'communicationType': "callback",
                                                                'input': [{
                                                                    'name': "widgetId",
                                                                    'expression': "'Sound'"
                                                                }, {
                                                                    'name': "url",
                                                                    'expression': "'resource/audio/background.mp3'"
                                                                }, {
                                                                    'name': "playLoop",
                                                                    'expression': "true"
                                                                }],
                                                                'parameters': ["widgetId", "url", "playLoop"],
                                                                'timeout': 0,
                                                                'CLASS_NAME': "ServiceInvokeTransitionAction"
                                                            }]
                                                        }
                                                    }]
                                                }
                                            }
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443942353613-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443942372680"] = self["Widget_1443942372680"] || {};
                    self["Widget_1443942372680"].setState_1443942239926 = function(name) {

                        self["Widget_1443942372680"].setState = self["Widget_1443942372680"].setState_1443942239926;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443942372680", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.registerTrigger('Widget_1443942372680', {
                                            'Gesture': {
                                                'tap': {
                                                    'triggerType': "Gesture",
                                                    'eventName': "tap",
                                                    'options': {},
                                                    'runOnce': false,
                                                    'actions': [{
                                                        'state': "*",
                                                        'actionObj': {
                                                            'id': "TransitionAction_1443968395683",
                                                            'actionType': "Sequence",
                                                            'widgetObj': "Widget_1443942372680",
                                                            'stopOnEach': false,
                                                            'childActions': [{
                                                                'id': "TransitionAction_1444027299197",
                                                                'actionType': "Service",
                                                                'widgetObj': "Widget_1443942372680",
                                                                'feature': "BaseService",
                                                                'serviceName': "gotoPage",
                                                                'communicationType': "callback",
                                                                'input': [{
                                                                    'name': "pageNum",
                                                                    'expression': "'page-Settings'"
                                                                }],
                                                                'parameters': ["pageNum"],
                                                                'timeout': 0,
                                                                'CLASS_NAME': "ServiceInvokeTransitionAction"
                                                            }]
                                                        }
                                                    }]
                                                }
                                            }
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443942372680-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443942382209"] = self["Widget_1443942382209"] || {};
                    self["Widget_1443942382209"].setState_1443942239926 = function(name) {

                        self["Widget_1443942382209"].setState = self["Widget_1443942382209"].setState_1443942239926;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443942382209", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.registerTrigger('Widget_1443942382209', {
                                            'Gesture': {
                                                'tap': {
                                                    'triggerType': "Gesture",
                                                    'eventName': "tap",
                                                    'options': {},
                                                    'runOnce': false,
                                                    'actions': [{
                                                        'state': "*",
                                                        'actionObj': {
                                                            'id': "TransitionAction_1443968350108",
                                                            'actionType': "Sequence",
                                                            'widgetObj': "Widget_1443942382209",
                                                            'stopOnEach': false,
                                                            'childActions': [{
                                                                'id': "TransitionAction_1443968365123",
                                                                'actionType': "Service",
                                                                'widgetObj': "Widget_1443942382209",
                                                                'feature': "BaseService",
                                                                'serviceName': "gotoPage",
                                                                'communicationType': "callback",
                                                                'input': [{
                                                                    'name': "pageNum",
                                                                    'expression': "'page-Report'"
                                                                }],
                                                                'parameters': ["pageNum"],
                                                                'timeout': 0,
                                                                'CLASS_NAME': "ServiceInvokeTransitionAction"
                                                            }]
                                                        }
                                                    }]
                                                }
                                            }
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443942382209-{0}".format(name));
                    }
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443912337267'] = {};
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443944908812'] = {};

                    this['Widget_1443944908812']['routes'] = [];

                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443912337267"] = self["Widget_1443912337267"] || {};
                    self["Widget_1443912337267"].setState = function(name) {

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443912337267", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443944908812"].setState_1443912337267("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443912337267-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443944908812"] = self["Widget_1443944908812"] || {};
                    self["Widget_1443944908812"].setState_1443912337267 = function(name) {

                        self["Widget_1443944908812"].setState = self["Widget_1443944908812"].setState_1443912337267;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443944908812", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.handleStateAction({
                                            'id': "TransitionAction_1443944908813",
                                            'actionType': "Sequence",
                                            'widgetObj': "Widget_1443944908812",
                                            'stopOnEach': false,
                                            'childActions': [{
                                                'id': "TransitionAction_1443944908814",
                                                'actionType': "Include",
                                                'widgetObj': "Widget_1443944908812",
                                                'CLASS_NAME': "IncludeTransitionAction",
                                                'url': "resource/external/上教/子目录/index/publish/web/book.html",
                                                'edge': "EDGE-635559"
                                            }]
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443944908812-{0}".format(name));
                    }
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443912347128'] = {};
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443944922169'] = {};

                    this['Widget_1443944922169']['routes'] = [];

                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443912347128"] = self["Widget_1443912347128"] || {};
                    self["Widget_1443912347128"].setState = function(name) {

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443912347128", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443944922169"].setState_1443912347128("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443912347128-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443944922169"] = self["Widget_1443944922169"] || {};
                    self["Widget_1443944922169"].setState_1443912347128 = function(name) {

                        self["Widget_1443944922169"].setState = self["Widget_1443944922169"].setState_1443912347128;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443944922169", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.handleStateAction({
                                            'id': "TransitionAction_1443944922170",
                                            'actionType': "Sequence",
                                            'widgetObj': "Widget_1443944922169",
                                            'stopOnEach': false,
                                            'childActions': [{
                                                'id': "TransitionAction_1443944922171",
                                                'actionType': "Include",
                                                'widgetObj': "Widget_1443944922169",
                                                'CLASS_NAME': "IncludeTransitionAction",
                                                'url': "resource/external/上教/单元内容/index/publish/web/book.html",
                                                'edge': "EDGE-14551220"
                                            }]
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443944922169-{0}".format(name));
                    }
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443912352836'] = {};
                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443944936081'] = {};

                    this['Widget_1443944936081']['routes'] = [];

                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443912352836"] = self["Widget_1443912352836"] || {};
                    self["Widget_1443912352836"].setState = function(name) {

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443912352836", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(function() {
                                    return $timeout(function() {
                                        arr.push(function() {
                                            return self["Widget_1443944936081"].setState_1443912352836("*");
                                        })
                                    });
                                });
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443912352836-{0}".format(name));
                    }
                });

                $rootScope.stateFns.push(function() {
                    var self = this;
                    self["Widget_1443944936081"] = self["Widget_1443944936081"] || {};
                    self["Widget_1443944936081"].setState_1443912352836 = function(name) {

                        self["Widget_1443944936081"].setState = self["Widget_1443944936081"].setState_1443912352836;

                        var arr = [];
                        arr.push(function() {
                            return utilService.setStateOnWidget("Widget_1443944936081", name);
                        });
                        switch (name) {
                            case "*":

                                arr.push(
                                    function() {
                                        return utilService.handleStateAction({
                                            'id': "TransitionAction_1443944936081",
                                            'actionType': "Sequence",
                                            'widgetObj': "Widget_1443944936081",
                                            'stopOnEach': false,
                                            'childActions': [{
                                                'id': "TransitionAction_1443944936082",
                                                'actionType': "Include",
                                                'widgetObj': "Widget_1443944936081",
                                                'CLASS_NAME': "IncludeTransitionAction",
                                                'url': "resource/external/上教/单元问答/index/publish/web/book.html",
                                                'edge': "EDGE-14201750"
                                            }]
                                        });
                                    }
                                );
                                break;
                        }

                        return utilService.chain(arr, "chain-stateFn-Widget_1443944936081-{0}".format(name));
                    }
                });

                $rootScope.initFns.forEach(function(fn) {
                    fn.apply($rootScope)
                });

                $rootScope.stateFns.forEach(function(fn) {
                    fn.apply($rootScope)
                });

                $scope.nextPage = function(event) {
                    event && event.stopPropagation();
                    serviceRegistry.invoke("BaseService", "nextPage")();
                }

                $scope.prevPage = function(event) {
                    event && event.stopPropagation();
                    serviceRegistry.invoke("BaseService", "prevPage")();
                }

                $scope.exitPage = function(event) {
                    event && event.stopPropagation();
                    serviceRegistry.invoke("BaseService", "exitPage")();
                }

                window.serviceRegistry = serviceRegistry;
                appService.toggleWidgetSound();
                serviceRegistry.invoke("BaseService", "loadPage")(urlService.locations[0], true);
            }

            function Widget_1443910040698_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443910040698", "*");
            }

            function Widget_1443912337267_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443912337267", "*");
            }

            function Widget_1443912347128_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443912347128", "*");
            }

            function Widget_1443912352836_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443912352836", "*");
            }

            function Report_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {}

            function Settings_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService) {}


            if (isBrowser) {
                appModule.
                controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", RootController]);

                appModule.
                controller('Widget_1443910040698_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Widget_1443910040698_Controller]);

                appModule.
                controller('Widget_1443912337267_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Widget_1443912337267_Controller]);

                appModule.
                controller('Widget_1443912347128_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Widget_1443912347128_Controller]);

                appModule.
                controller('Widget_1443912352836_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Widget_1443912352836_Controller]);

                appModule.
                controller('Report_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Report_Controller]);

                appModule.
                controller('Settings_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", Settings_Controller]);


            }
        }
    }
);