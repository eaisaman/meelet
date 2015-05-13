requirejs.config(
    {
        paths: {
            "editormd": EDITORMD_LIB_PATH + "editormd"
        },
        shim: {
            "editormd": {
                exports: "editormd",
                deps: ["codemirror-lib", "marked-lib", "prettify-lib", "katex-lib", "raphael-lib", "flowchart-lib", "jquery-flowchart-lib", "sequence-diagram-lib"]
            }
        },
        waitSeconds: 0
    }
);

define(
    [
        "editormd"
    ],
    function (editormd) {
        window.editormd = editormd;

        _.extend(window.editormd.defaults, {
            flowChart: false,
            sequenceDiagram: false,
            autoLoadModules: false,
            cmPath: CODEMIRROR_LIB_PATH,
            pluginPath: EDITORMD_LIB_PATH + "plugins",
            htmlDecode: "style,script,iframe",
            codeFold: true,
            mode: "markdown",
            theme: "neat",
            searchReplace: true,
            saveHTMLToTextarea: true,
            gotoLine: false,
            emoji: false,
            taskList: true,
            tex: true,
            tocm: true,
            imageUpload: false
        });

        window.editormd.toolbarModes.full = [
            "undo", "redo", "|",
            "bold", "del", "italic", "quote", "ucwords", "uppercase", "lowercase", "|",
            "h1", "h2", "h3", "h4", "h5", "h6", "|",
            "list-ul", "list-ol", "hr", "|",
            "link", "reference-link", "image", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "html-entities", "pagebreak", "|",
            "watch", "preview", "clear", "search"
        ];

        window.editormd.inline = function (id) {
            return editormd(id, {
                width: "100%",
                height: "100%"
                //syncScrolling : false,
                //watch : false,                // 关闭实时预览
                //toolbar  : false,             //关闭工具栏
                //previewCodeHighlight : false, // 关闭预览HTML的代码块高亮，默认开启
                //dialogLockScreen : false,   // 设置弹出层对话框不锁屏，全局通用，默认为true
                //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为true
                //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为true
                //dialogMaskOpacity : 0.4,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
                //dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
            });
        };

        [
            EDITORMD_LIB_PATH + "css/editormd.min.css"
        ].forEach(function (href) {
                var link = window.document.createElement("link");
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = href;
                window.document.getElementsByTagName("head")[0].appendChild(link);
            }
        );

        return function () {
        }
    }
);