define([APP_PROJECT_PATH + "common/" + "mobile-main"], function (commonConfig) {

    return function (appModule, inject, callback) {
        commonConfig(appModule, inject, function () {
            requirejs([APP_PROJECT_PATH + "app/" + "mobile-main"], function (appConfig) {
            	appConfig(appModule, inject, callback);
            });
        });
    }
});
