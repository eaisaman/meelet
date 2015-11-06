define(
    ["app-extension", APP_PROJECT_PATH + "app/" + "controller"],
    function (extension, controllerConfig) {
        return function (appModule, inject, callback) {
            controllerConfig(appModule, extension, inject);
            
            callback && callback();
        }
    }
);