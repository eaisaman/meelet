

define(
    ["angular", "jquery", "app-route", "app-service", "app-util", "sketch-util"],
    function () {
        return function (appModule, extension) {
            function RootController($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function() { this['Widget_1443190895844'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443190945025'] = {};

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443191028335'] = {};

                    this['Widget_1443191028335']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443191715536'] = {};

                    this['Widget_1443191715536']['effect'] = "fadeOut";

                    this['Widget_1443191715536']['link-title'] = "Streams";

                    this['Widget_1443191715536']['state-group'] = "Tab Titles";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443192041967'] = {};

                    this['Widget_1443192041967']['effect'] = "fadeOut";

                    this['Widget_1443192041967']['link-title'] = "Collections";

                    this['Widget_1443192041967']['state-group'] = "Tab Titles";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443192103380'] = {};

                    this['Widget_1443192103380']['effect'] = "fadeOut";

                    this['Widget_1443192103380']['link-title'] = "Check-ins";

                    this['Widget_1443192103380']['state-group'] = "Tab Titles";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443341283349'] = {};

                    this['Widget_1443341283349']['effect'] = "fadeOut";

                    this['Widget_1443341283349']['link-title'] = "Friends";

                    this['Widget_1443341283349']['state-group'] = "Tab Titles";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443191116316'] = {};

                    this['Widget_1443191116316']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443191255036'] = {};

                    this['Widget_1443191255036']['tab-titles'] = ["Streams","Collections","Check-ins","Friends"];

                    this['Widget_1443191255036']['picked-tab-title'] = "Friends";

                    this['Widget_1443191255036']['transition'] = "carouselToLeft";

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443361058759'] = {};

                    this['Widget_1443361058759']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443361118230'] = {};

                    this['Widget_1443361118230']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443361168773'] = {};

                    this['Widget_1443361168773']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443361204458'] = {};

                    this['Widget_1443361204458']['routes'] = [];

                });

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443190895844"] = self["Widget_1443190895844"] || {};
self["Widget_1443190895844"].setState = function(name) {

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443190895844", name);});
    switch (name) {
        case "*":
            
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443190945025"].setState_1443190895845("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443190895844");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443190945025"] = self["Widget_1443190945025"] || {};
self["Widget_1443190945025"].setState_1443190895845 = function(name) {

    self["Widget_1443190945025"].setState = self["Widget_1443190945025"].setState_1443190895845;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443190945025", name);});
    switch (name) {
        case "*":
            
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443190951219"].setState_1443190945025("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443190945025");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443190951219"] = self["Widget_1443190951219"] || {};
self["Widget_1443190951219"].setState_1443190945025 = function(name) {

    self["Widget_1443190951219"].setState = self["Widget_1443190951219"].setState_1443190945025;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443190951219", name);});
    switch (name) {
        case "*":
            
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443191028335"].setState_1443190951220("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443190951219");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443191028335"] = self["Widget_1443191028335"] || {};
self["Widget_1443191028335"].setState_1443190951220 = function(name) {

    self["Widget_1443191028335"].setState = self["Widget_1443191028335"].setState_1443190951220;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443191028335", name);});
    switch (name) {
        case "*":
            
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443191715536"].setState_1443191028335("*"); })

            arr.push(function() { return self["Widget_1443192041967"].setState_1443191028335("*"); })

            arr.push(function() { return self["Widget_1443192103380"].setState_1443191028335("*"); })

            arr.push(function() { return self["Widget_1443341283349"].setState_1443191028335("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443191028335");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443191715536"] = self["Widget_1443191715536"] || {};
self["Widget_1443191715536"].setState_1443191028335 = function(name) {

    self["Widget_1443191715536"].setState = self["Widget_1443191715536"].setState_1443191028335;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443191715536", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443191715536', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443361497247",'actionType':"Sequence",'widgetObj':"Widget_1443191715536",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443361506991",'actionType':"Configuration",'widgetObj':"Widget_1443191255036",'configuration':[
{'key':"pickedTabTitle",'pickedValue':"Streams"}]}]}}]}}}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443191715536");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443192041967"] = self["Widget_1443192041967"] || {};
self["Widget_1443192041967"].setState_1443191028335 = function(name) {

    self["Widget_1443192041967"].setState = self["Widget_1443192041967"].setState_1443191028335;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443192041967", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443192041967', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443361540905",'actionType':"Sequence",'widgetObj':"Widget_1443192041967",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443361548801",'actionType':"Configuration",'widgetObj':"Widget_1443191255036",'configuration':[
{'key':"pickedTabTitle",'pickedValue':"Collections"}]}]}}]}}}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443192041967");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443192103380"] = self["Widget_1443192103380"] || {};
self["Widget_1443192103380"].setState_1443191028335 = function(name) {

    self["Widget_1443192103380"].setState = self["Widget_1443192103380"].setState_1443191028335;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443192103380", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443192103380', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443361571520",'actionType':"Sequence",'widgetObj':"Widget_1443192103380",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443361579856",'actionType':"Configuration",'widgetObj':"Widget_1443191255036",'configuration':[
{'key':"pickedTabTitle",'pickedValue':"Check-ins"}]}]}}]}}}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443192103380");
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443341283349"] = self["Widget_1443341283349"] || {};
self["Widget_1443341283349"].setState_1443191028335 = function(name) {

    self["Widget_1443341283349"].setState = self["Widget_1443341283349"].setState_1443191028335;

    var arr = [];
    arr.push(function () { return appService.setStateOnWidget("Widget_1443341283349", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443341283349', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443361601274",'actionType':"Sequence",'widgetObj':"Widget_1443341283349",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443361608270",'actionType':"Configuration",'widgetObj':"Widget_1443191255036",'configuration':[
{'key':"pickedTabTitle",'pickedValue':"Friends"}]}]}}]}}}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443341283349");
}
});

                $rootScope.initFns.forEach(function(fn) {fn.apply($rootScope)});

                $rootScope.stateFns.forEach(function(fn) {fn.apply($rootScope)});

                $scope.nextPage = function(event) {
                    event && event.stopPropagation();
                    appService.nextPage();
                }
                $scope.prevPage = function(event) {
                    event && event.stopPropagation();
                    appService.prevPage();
                }
                $scope.exitPage = function(event) {
                    event && event.stopPropagation();
                    appService.exitPage();
                }
                appService.loadPage(urlService.locations[0], true);
            }

            function Widget_1443190895844_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                appService.setState("Widget_1443190895844", "*");
            }


            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", RootController]);

                appModule.
                    controller('Widget_1443190895844_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", Widget_1443190895844_Controller]);


            }
        }
    }
);