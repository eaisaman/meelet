

define(
    ["angular", "jquery", "app-route", "app-service", "app-service-registry", "app-util", "sketch-util"],
    function () {
        return function (appModule, extension) {
            function RootController($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function() { this['Widget_1443420826838'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443423545319'] = {};

                    this['Widget_1443423545319']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443423564456'] = {};

                    this['Widget_1443423564456']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443423613913'] = {};

                    this['Widget_1443423613913']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443424806509'] = {};

                    this['Widget_1443424806509']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443424811172'] = {};

                    this['Widget_1443424811172']['routes'] = [];

                });

                $rootScope.initFns.push(function() { this['Widget_1443421272456'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443424975385'] = {};

                    this['Widget_1443424975385']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447120788'] = {};

                    this['Widget_1443447120788']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447128452'] = {};

                    this['Widget_1443447128452']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447133472'] = {};

                    this['Widget_1443447133472']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447136344'] = {};

                    this['Widget_1443447136344']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447055055'] = {};

                    this['Widget_1443447055055']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447098237'] = {};

                    this['Widget_1443447098237']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447106580'] = {};

                    this['Widget_1443447106580']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443447114008'] = {};

                    this['Widget_1443447114008']['routes'] = [];

                });

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443421272456"] = self["Widget_1443421272456"] || {};
self["Widget_1443421272456"].setState = function(name) {

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443421272456", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443421272456', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'runOnce':true,'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443448079397",'actionType':"Sequence",'widgetObj':"Widget_1443421272456",'stopOnEach':true,'childActions':[
{'id':"TransitionAction_1443448094405",'actionType':"State",'widgetObj':"Widget_1443447120788",'newState':"Display"},
{'id':"TransitionAction_1443448109305",'actionType':"State",'widgetObj':"Widget_1443447128452",'newState':"Display"},
{'id':"TransitionAction_1443448117393",'actionType':"State",'widgetObj':"Widget_1443447133472",'newState':"Display"},
{'id':"TransitionAction_1443448128890",'actionType':"State",'widgetObj':"Widget_1443447136344",'newState':"Display"},
{'id':"TransitionAction_1443448140132",'actionType':"State",'widgetObj':"Widget_1443447055055",'newState':"Display"},
{'id':"TransitionAction_1443448151448",'actionType':"State",'widgetObj':"Widget_1443447098237",'newState':"Display"},
{'id':"TransitionAction_1443448161279",'actionType':"State",'widgetObj':"Widget_1443447106580",'newState':"Display"},
{'id':"TransitionAction_1443448170199",'actionType':"State",'widgetObj':"Widget_1443447114008",'newState':"Display"}]}}]}}}); }
);
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443447120788"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447128452"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447133472"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447136344"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447055055"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447098237"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447106580"].setState_1443421272457("*"); })

            arr.push(function() { return self["Widget_1443447114008"].setState_1443421272457("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443421272456-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447120788"] = self["Widget_1443447120788"] || {};
self["Widget_1443447120788"].setState_1443421272457 = function(name) {

    self["Widget_1443447120788"].setState = self["Widget_1443447120788"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447120788", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447451945",'actionType':"Sequence",'widgetObj':"Widget_1443447120788",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447867138",'actionType':"Effect",'widgetObj':"Widget_1443447120788",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447120788-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447128452"] = self["Widget_1443447128452"] || {};
self["Widget_1443447128452"].setState_1443421272457 = function(name) {

    self["Widget_1443447128452"].setState = self["Widget_1443447128452"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447128452", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447454889",'actionType':"Sequence",'widgetObj':"Widget_1443447128452",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447883169",'actionType':"Effect",'widgetObj':"Widget_1443447128452",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447128452-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447133472"] = self["Widget_1443447133472"] || {};
self["Widget_1443447133472"].setState_1443421272457 = function(name) {

    self["Widget_1443447133472"].setState = self["Widget_1443447133472"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447133472", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447458186",'actionType':"Sequence",'widgetObj':"Widget_1443447133472",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447903055",'actionType':"Effect",'widgetObj':"Widget_1443447133472",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447133472-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447136344"] = self["Widget_1443447136344"] || {};
self["Widget_1443447136344"].setState_1443421272457 = function(name) {

    self["Widget_1443447136344"].setState = self["Widget_1443447136344"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447136344", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447461012",'actionType':"Sequence",'widgetObj':"Widget_1443447136344",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447917059",'actionType':"Effect",'widgetObj':"Widget_1443447136344",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447136344-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447055055"] = self["Widget_1443447055055"] || {};
self["Widget_1443447055055"].setState_1443421272457 = function(name) {

    self["Widget_1443447055055"].setState = self["Widget_1443447055055"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447055055", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447339358",'actionType':"Sequence",'widgetObj':"Widget_1443447055055",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447746183",'actionType':"Effect",'widgetObj':"Widget_1443447055055",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'timing':"ease-in",'duration':0.7}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447055055-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447098237"] = self["Widget_1443447098237"] || {};
self["Widget_1443447098237"].setState_1443421272457 = function(name) {

    self["Widget_1443447098237"].setState = self["Widget_1443447098237"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447098237", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447442522",'actionType':"Sequence",'widgetObj':"Widget_1443447098237",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447803833",'actionType':"Effect",'widgetObj':"Widget_1443447098237",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447098237-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447106580"] = self["Widget_1443447106580"] || {};
self["Widget_1443447106580"].setState_1443421272457 = function(name) {

    self["Widget_1443447106580"].setState = self["Widget_1443447106580"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447106580", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447445721",'actionType':"Sequence",'widgetObj':"Widget_1443447106580",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447840837",'actionType':"Effect",'widgetObj':"Widget_1443447106580",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447106580-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443447114008"] = self["Widget_1443447114008"] || {};
self["Widget_1443447114008"].setState_1443421272457 = function(name) {

    self["Widget_1443447114008"].setState = self["Widget_1443447114008"].setState_1443421272457;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443447114008", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443447448809",'actionType':"Sequence",'widgetObj':"Widget_1443447114008",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443447856447",'actionType':"Effect",'widgetObj':"Widget_1443447114008",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactId':"54ed88bd7080482a030041a7",'artifactName':"Magic Animation",'version':"1.0.0"},'effect':
{'name':"puffIn",'type':"Animation",'options':
{'duration':0.7,'timing':"ease-in"}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443447114008-{0}".format(name));
}
});

                $rootScope.initFns.push(function() { this['Widget_1443421127166'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443495442385'] = {};

                    this['Widget_1443495442385']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443495588915'] = {};

                    this['Widget_1443495588915']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443495667095'] = {};

                    this['Widget_1443495667095']['routes'] = [];

                });

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443421127166"] = self["Widget_1443421127166"] || {};
self["Widget_1443421127166"].setState = function(name) {

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443421127166", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443421127166', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'runOnce':true,'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443495897579",'actionType':"Sequence",'widgetObj':"Widget_1443421127166",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443495908271",'actionType':"State",'widgetObj':"Widget_1443495667095",'newState':"Display"},
{'id':"TransitionAction_1443508081376",'actionType':"Sound",'widgetObj':"Widget_1443421127166",'CLASS_NAME':"SoundTransitionAction",'resourceName':"little-bird.mp3"}]}}]}}}); }
);
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443495667095"].setState_1443421127166("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443421127166-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443495667095"] = self["Widget_1443495667095"] || {};
self["Widget_1443495667095"].setState_1443421127166 = function(name) {

    self["Widget_1443495667095"].setState = self["Widget_1443495667095"].setState_1443421127166;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443495667095", name);});
    switch (name) {
        case "Display":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443495829959",'actionType':"Sequence",'widgetObj':"Widget_1443495667095",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443495931915",'actionType':"Effect",'widgetObj':"Widget_1443495667095",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactName':"Magic Animation",'artifactId':"54ed88bd7080482a030041a7",'version':"1.0.0"},'effect':
{'name':"swashIn",'type':"Animation",'options':
{}},'runAfterComplete':true}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443495667095-{0}".format(name));
}
});

                $rootScope.initFns.push(function() { this['Widget_1443421123528'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443496111961'] = {};

                    this['Widget_1443496111961']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443496115831'] = {};

                    this['Widget_1443496115831']['routes'] = [];

                });

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443421123528"] = self["Widget_1443421123528"] || {};
self["Widget_1443421123528"].setState = function(name) {

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443421123528", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443421123528', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'runOnce':true,'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443496424919",'actionType':"Sequence",'widgetObj':"Widget_1443421123528",'stopOnEach':true,'childActions':[
{'id':"TransitionAction_1443496433438",'actionType':"State",'widgetObj':"Widget_1443496111961",'newState':"In-Transit"},
{'id':"TransitionAction_1443496438821",'actionType':"State",'widgetObj':"Widget_1443496115831",'newState':"In-Transit"}]}}]}}}); }
);
            arr.push(function() { return $timeout(function() {
            arr.push(function() { return self["Widget_1443496111961"].setState_1443421123529("*"); })

            arr.push(function() { return self["Widget_1443496115831"].setState_1443421123529("*"); })
}); });
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443421123528-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443496111961"] = self["Widget_1443496111961"] || {};
self["Widget_1443496111961"].setState_1443421123529 = function(name) {

    self["Widget_1443496111961"].setState = self["Widget_1443496111961"].setState_1443421123529;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443496111961", name);});
    switch (name) {
        case "In-Transit":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443497295158",'actionType':"Sequence",'widgetObj':"Widget_1443496111961",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443497311324",'actionType':"Effect",'widgetObj':"Widget_1443496111961",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactName':"Magic Animation",'artifactId':"54ed88bd7080482a030041a7",'version':"1.0.0"},'effect':
{'name':"tinLeftIn",'type':"Animation",'options':
{}},'runAfterComplete':false},
{'id':"TransitionAction_1443497331408",'actionType':"State",'widgetObj':"Widget_1443496111961",'newState':"Display"}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443496111961-{0}".format(name));
}
});

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443496115831"] = self["Widget_1443496115831"] || {};
self["Widget_1443496115831"].setState_1443421123529 = function(name) {

    self["Widget_1443496115831"].setState = self["Widget_1443496115831"].setState_1443421123529;

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443496115831", name);});
    switch (name) {
        case "In-Transit":
            
            arr.push(
function() { return utilService.handleStateAction(
{'id':"TransitionAction_1443497520786",'actionType':"Sequence",'widgetObj':"Widget_1443496115831",'stopOnEach':false,'childActions':[
{'id':"TransitionAction_1443497547944",'actionType':"Effect",'widgetObj':"Widget_1443496115831",'artifactSpec':
{'type':"effect",'directiveName':"ui-effect-magic-animation",'libraryName':"standard",'artifactName':"Magic Animation",'artifactId':"54ed88bd7080482a030041a7",'version':"1.0.0"},'effect':
{'name':"tinLeftIn",'type':"Animation",'options':
{}},'runAfterComplete':false},
{'id':"TransitionAction_1443497559965",'actionType':"State",'widgetObj':"Widget_1443496115831",'newState':"Display"}]}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443496115831-{0}".format(name));
}
});

                $rootScope.initFns.push(function() { this['Widget_1443421115725'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443510483957'] = {};

                    this['Widget_1443510483957']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443510511521'] = {};

                    this['Widget_1443510511521']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443510541003'] = {};

                    this['Widget_1443510541003']['routes'] = [{"left":354.666,"top":148,"nextStop":{"left":596.666,"top":97,"nextStop":null}}];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443510545498'] = {};

                    this['Widget_1443510545498']['routes'] = [{"left":912,"top":125,"nextStop":{"left":535,"top":82,"nextStop":null}}];

                });

$rootScope.stateFns.push(function() {
var self = this;
self["Widget_1443421115725"] = self["Widget_1443421115725"] || {};
self["Widget_1443421115725"].setState = function(name) {

    var arr = [];
    arr.push(function () { return utilService.setStateOnWidget("Widget_1443421115725", name);});
    switch (name) {
        case "*":
            
            arr.push(
function() { return utilService.registerTrigger('Widget_1443421115725', 
{'Gesture':
{'tap':
{'triggerType':"Gesture",'eventName':"tap",'options':
{},'runOnce':true,'actions':[
{'state':"*",'actionObj':
{'id':"TransitionAction_1443510764218",'actionType':"Sequence",'widgetObj':"Widget_1443421115725",'stopOnEach':true,'childActions':[
{'id':"TransitionAction_1443510772052",'actionType':"Movement",'widgetObj':"Widget_1443510541003",'CLASS_NAME':"MovementTransitionAction",'routeIndex':0,'settings':[
{'key':"duration",'pickedValue':1000},
{'key':"easing",'pickedValue':"linear"}],'runThrough':false,'stepCount':2},
{'id':"TransitionAction_1443514153765",'actionType':"Movement",'widgetObj':"Widget_1443510545498",'CLASS_NAME':"MovementTransitionAction",'routeIndex':0,'settings':[
{'key':"duration",'pickedValue':1000},
{'key':"easing",'pickedValue':"ease"}],'runThrough':true,'stepCount':2}]}}]}}}); }
);
        break;
    }

    return utilService.chain(arr, "chain-stateFn-Widget_1443421115725-{0}".format(name));
}
});

                $rootScope.initFns.forEach(function(fn) {fn.apply($rootScope)});

                $rootScope.stateFns.forEach(function(fn) {fn.apply($rootScope)});

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
                appService.registerService();
                serviceRegistry.invoke("BaseService", "loadPage")(urlService.locations[0], true);
            }

            function Widget_1443420826838_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443420826838", "*");
            }

            function Widget_1443421272456_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443421272456", "*");
            }

            function Widget_1443421127166_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443421127166", "*");
            }

            function Widget_1443421123528_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443421123528", "*");
            }

            function Widget_1443421115725_Controller($scope, $rootScope, $q, $timeout, appService, serviceRegistry, urlService, utilService, sketchUtilService) {
                serviceRegistry.invoke("BaseService", "setState")("Widget_1443421115725", "*");
            }


            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", RootController]);

                appModule.
                    controller('Widget_1443420826838_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", Widget_1443420826838_Controller]);

                appModule.
                    controller('Widget_1443421272456_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", Widget_1443421272456_Controller]);

                appModule.
                    controller('Widget_1443421127166_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", Widget_1443421127166_Controller]);

                appModule.
                    controller('Widget_1443421123528_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", Widget_1443421123528_Controller]);

                appModule.
                    controller('Widget_1443421115725_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "serviceRegistry", "urlService", "utilService", "sketchUtilService", Widget_1443421115725_Controller]);


            }
        }
    }
);