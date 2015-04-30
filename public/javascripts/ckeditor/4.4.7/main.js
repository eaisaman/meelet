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

        CKEDITOR.config.toolbar_Meelet = [

            ['Cut','Copy','Paste','PasteText','PasteFromWord','-', 'SpellChecker', 'Scayt'],

            ['Undo','Redo','-','Find','Replace','-','SelectAll','RemoveFormat'],

            ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select'],

            '/',

            ['Bold','Italic','Underline','Strike','-','Subscript','Superscript'],

            ['NumberedList','BulletedList','-','Outdent','Indent'],

            ['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],

            ['Image','Table','HorizontalRule','Smiley','SpecialChar','PageBreak'],

            '/',

            ['Styles','Format','Font','FontSize'],

            ['TextColor','BGColor']

        ];

        CKEDITOR.config.toolbar = "Meelet";

        return function () {
        }
    }
);