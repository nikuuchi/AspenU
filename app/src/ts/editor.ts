
declare var ace: any;

module AspenU {
    export function GetHelloWorldSource(): string {
        return "#include <stdio.h>\n\nint main() {\n    printf(\"hello, world!\\n\");\n    return 0;\n}";
    }

    export class Editor {
        private editor: any; //TODO ace
        private markedErrorLines: number[] = [];
        constructor(editor_query: string) {
            this.editor = ace.edit(editor_query);
            this.editor.setTheme("ace/theme/xcode");
            this.ResetHelloWorld();
        }

        OnChange(callback: (e: Event)=>void): void {
            this.editor.on("change", callback);
        }

        GetValue(): string {
            return this.editor.getValue();
        }

        CreateSession(text: string): any {
            var session = new ace.EditSession(text);
            session.setMode("ace/mode/c_cpp");
            return session;
        }

        ChangeSession(text: string): void {
            var session = this.CreateSession(text);
            this.editor.setSession(session);
        }

        SetValue(text: string): void {
            this.editor.setValue(text);
            this.editor.clearSelection();
            this.editor.gotoLine(0);
        }

        Clear(): void{
            this.SetValue("");
        }

        Disable(): void {
            this.editor.setOption("readOnly", "nocursor");
            $(".ace_scroller").css({"background-color": "#eee"});
        }

        Enable(): void {
            this.editor.setOption("readOnly", false);
            $(".ace_scroller").css({"background-color": "#fff"});
        }

        SetErrorLine(line: number){
            this.editor.addLineClass(line-1, "text", "errorLine");
            this.markedErrorLines.push(line-1);
        }

        SetErrorLines(lines: number[]){
            for(var i = 0; i < lines.length; ++i){
                this.SetErrorLine(lines[i]);
            }
        }

        RemoveAllErrorLine(): void {
            for(var i = 0; i < this.markedErrorLines.length; ++i){
                this.editor.removeLineClass(this.markedErrorLines[i], "text", "errorLine");
            }
            this.markedErrorLines = [];
        }

        ResetHelloWorld(): void {
            this.ChangeSession(GetHelloWorldSource());
        }

        ContainsMultiByteSpace(): boolean {
            return this.editor.getValue().match(/　/);
        }

        ReplaceMultiByteSpace(): void {
            this.editor.setValue(this.editor.getValue().replace(/　/g, "  "));
        }
    }

}
