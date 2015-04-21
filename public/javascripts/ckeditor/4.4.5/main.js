requirejs.config(
    {
        paths: {
            "ckeditor": CKEDITOR_LIB_PATH + "ckeditor"
        },
        waitSeconds: 0
    }
);

define(
    [
            "ckeditor"
    ],
    function () {
        CKEDITOR.disableAutoInline = true;

        return function () {
        }
    }
);