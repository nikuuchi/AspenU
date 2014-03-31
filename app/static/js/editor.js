var AspenU;
(function (AspenU) {
    function GetHelloWorldSource() {
        return "#include <stdio.h>\n\nint main() {\n    printf(\"hello, world!\\n\");\n    return 0;\n}";
    }
    AspenU.GetHelloWorldSource = GetHelloWorldSource;

    var Editor = (function () {
        function Editor(editor_query) {
            this.markedErrorLines = [];
            this.editor = ace.edit(editor_query);
            this.editor.setTheme("ace/theme/xcode");
            this.ResetHelloWorld();
        }
        Editor.prototype.OnChange = function (callback) {
            this.editor.on("change", callback);
        };

        Editor.prototype.GetValue = function () {
            return this.editor.getValue();
        };

        Editor.prototype.CreateSession = function (text) {
            var session = new ace.EditSession(text);
            session.setMode("ace/mode/c_cpp");
            return session;
        };

        Editor.prototype.ChangeSession = function (text) {
            var session = this.CreateSession(text);
            this.editor.setSession(session);
        };

        Editor.prototype.SetValue = function (text) {
            this.editor.setValue(text);
            this.editor.clearSelection();
            this.editor.gotoLine(0);
        };

        Editor.prototype.Clear = function () {
            this.SetValue("");
        };

        Editor.prototype.Disable = function () {
            this.editor.setOption("readOnly", "nocursor");
            $(".CodeMirror-scroll").css({ "background-color": "#eee" });
        };

        Editor.prototype.Enable = function () {
            this.editor.setOption("readOnly", false);
            $(".CodeMirror-scroll").css({ "background-color": "#fff" });
        };

        Editor.prototype.SetErrorLine = function (line) {
            this.editor.addLineClass(line - 1, "text", "errorLine");
            this.markedErrorLines.push(line - 1);
        };

        Editor.prototype.SetErrorLines = function (lines) {
            for (var i = 0; i < lines.length; ++i) {
                this.SetErrorLine(lines[i]);
            }
        };

        Editor.prototype.RemoveAllErrorLine = function () {
            for (var i = 0; i < this.markedErrorLines.length; ++i) {
                this.editor.removeLineClass(this.markedErrorLines[i], "text", "errorLine");
            }
            this.markedErrorLines = [];
        };

        Editor.prototype.ResetHelloWorld = function () {
            this.ChangeSession(GetHelloWorldSource());
        };

        Editor.prototype.ContainsMultiByteSpace = function () {
            return this.editor.getValue().match(/　/);
        };

        Editor.prototype.ReplaceMultiByteSpace = function () {
            this.editor.setValue(this.editor.getValue().replace(/　/g, "  "));
        };
        return Editor;
    })();
    AspenU.Editor = Editor;
})(AspenU || (AspenU = {}));
