///<reference path='../typings/jquery/jquery.d.ts'/>
///<reference path='../typings/jquery_plugins.d.ts'/>

module AspenU {
    export class Output {
        constructor(public $output: JQuery){
            $output.css({"height": "200px"});
        }

        Print(val: string): void {
            this.$output.append(val);
        }

        private static ExpandTab(val: string, width: number): string {
            var tsv = val.split("\t");
            var ret = "";
            var spase = "                "; // 16 spaces
            var n = tsv.length;
            for(var i = 0; i < n; ++i){
                ret += tsv[i];
                if(n - i > 1){
                    ret += spase.substr(0, width - ret.length % width);
                }
            }
            return ret;
        }

        PrintFromC(val: string): void {
            val = Output.ExpandTab(val, 4);
            var obj = document.createElement('samp');
            if (typeof obj.textContent != 'undefined') {
                obj.textContent = val;
            } else {
                obj.innerText = val;
            }
            this.$output.append("<samp>" + obj.innerHTML.replace(/ /g, "&nbsp;") + "</samp><br>");
        }

        PrintLn(val: string): void {
            this.$output.append(val + '<br>\n');
        }

        PrintErrorLn(val: string): void {
            this.$output.append('<span class="text-danger">' + val + '</span><br>');
        }

        Prompt(): void {
            this.$output.append('$ ');
        }

        Clear(): void {
            this.$output.text('');
        }

        Expand(): void {
            this.$output.css({"height": "300px"});
        }

        Shrink(): void {
            this.$output.css({"height": "200px"});
        }
    }

    export class FileModel {
        private BaseName: string;
        private Name: string;

        constructor(Name: string) {
            this.SetName(Name);
        }

        SetName(text: string): void {
            this.Name = text.replace(/\..*/, ".c");
            this.BaseName = this.Name.replace(/\..*/, "");
        }

        GetName(): string {
            return this.Name;
        }

        GetBaseName(): string {
            return this.BaseName;
        }
    }

    export class FileCollection {
        private FileModels: FileModel[] = [];
        private UI: JQuery;
        private ActiveFileName: string;
        private ActiveFileIndex: number;
        private defaultNameKey: string = 'filename:defaultNameKey';

        constructor() {
            this.UI = $('#file-name-lists');
            this.ActiveFileName = localStorage.getItem(this.defaultNameKey) || "program.c";
            this.ActiveFileIndex = 0;

            for(var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if(key == this.defaultNameKey || !key.match(/.*\.c/)) {
                    continue;
                }
                var file = new FileModel(localStorage.key(i));
                var index = this.FileModels.push(file) - 1;
                if(key == this.ActiveFileName) {
                    this.ActiveFileIndex = index;
                }
            }

            //First access for c2js
            if(this.FileModels.length == 0) {
                var file = new FileModel(this.ActiveFileName);
                var index = this.FileModels.push(file) - 1;
                this.ActiveFileIndex = index;
                localStorage.setItem(this.defaultNameKey, "program.c");
                localStorage.setItem("program.c", GetHelloWorldSource());
            }
        }

        Append(NewFile: FileModel, callback: (e:Event) => void) {
            this.FileModels.push(NewFile);
            this.UI.prepend($('#file-list-template').tmpl([NewFile]));
            $("#" + NewFile.GetBaseName()).click(callback);
        }

        private GetIndexOf(BaseName: string): number {
            for(var i = 0; i < this.FileModels.length; i++) {
                if(this.FileModels[i].GetBaseName() == BaseName) {
                    return i;
                }
            }
            return -1;
        }

        GetCurrent(): FileModel {
            return this.FileModels[this.ActiveFileIndex];
        }

        private RemoveActiveClass(): void {
            if(!this.Empty()){
                $("#" + this.GetCurrent().GetBaseName()).parent().removeClass('active');
            }
        }

        private AddActiveClass(): void {
            if(!this.Empty()){
                $("#" + this.GetCurrent().GetBaseName()).parent().addClass('active');
            }
        }

        SetCurrent(BaseName: string): void {
            this.RemoveActiveClass();
            this.ActiveFileName = BaseName + '.c';
            this.ActiveFileIndex = this.GetIndexOf(BaseName);
            this.AddActiveClass();
            localStorage.setItem(this.defaultNameKey, this.ActiveFileName);
        }

        Show(callback: (e:Event)=>void): void {
            this.UI.prepend($('#file-list-template').tmpl(this.FileModels));
            this.AddActiveClass();
            for(var i = 0; i < this.FileModels.length; i++) {
                $("#" + this.FileModels[i].GetBaseName()).click(callback);
            }
        }

        private RemoveByBaseName(BaseName: string): void {
            var i = this.GetIndexOf(BaseName);
            if(i == -1) {
                return;
            }
            $($("#" + BaseName).parent().get(0)).remove();
            this.FileModels.splice(i,1);
            localStorage.removeItem(BaseName + '.c');
        }

        Rename(oldBaseName: string, newname: string, contents: string, Callback: any, DB: SourceDB): void {
            this.Remove(oldBaseName);
            var file = new FileModel(newname);
            this.Append(file, Callback);
            this.SetCurrent(file.GetBaseName());
            DB.Save(file.GetName(), contents);
        }

        Remove(BaseName: string): void {
            if(this.FileModels.length > 0){
                var removedIndex = this.GetIndexOf(BaseName);
                var newIndex = removedIndex <= 0 ? 0 : removedIndex - 1;
                this.SetCurrent(this.FileModels[newIndex].GetBaseName());
                this.RemoveByBaseName(BaseName);
                this.AddActiveClass();
            }
        }

        Clear(): void {
            if(this.FileModels.length > 0){
                $(".file-tab").remove();
                this.FileModels = [];
                for(var name in localStorage){
                    localStorage.removeItem(name);
                }
            }
        }

        Empty(): boolean {
            return this.FileModels.length == 0;
        }

        MakeUniqueName(Name: string): string {
            for(var i = 0; i < this.FileModels.length; i++) {
                if(this.FileModels[i].GetName() == Name) {
                    return Name.replace(/\.c/g, "_1.c");
                }
            }
            return Name;
        }

    }

    export class SourceDB {
        constructor() {
        }

        Save(fileName: string, source: string): void {
            localStorage.setItem(fileName, source);
        }

        Load(fileName: string): string {
            return localStorage.getItem(fileName);
        }

        Delete(fileName: string): void {
            return localStorage.removeItem(fileName);
        }

        Exist(fileName: string): boolean {
            return localStorage.getItem(fileName) != null;
        }

    }

    function TranslateMessageToJapanese(text: string): string{
        text = text.replace(/&nbsp;/g, " ");
        var wordtable = {
            "variable":"変数",
            "parameter":"引数",
            "argument":"引数",
            "identifier":"変数または関数",
            "pointer":"ポインタ",
            "integer":"整数",
            "struct":"構造体",
            "union":"共用体",
        };
        var rules: any = {};
        rules["unused (\\w+) ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + " " + RegExp.$2 + " は使われていません"; });
        rules["expression result unused"]
            = (()=>{ return "計算結果が使われていません"; });
        rules["equality comparison result unused"]
            = (()=>{ return "比較結果が使われていません"; });
        rules["self-comparison always evaluates to true"]
            = (()=>{ return "自分自身との比較は常に真です (この式には意味がありません)"; });
        rules["explicitly assigning a variable of type ('.*?') to itself"]
            = (()=>{ return "自分自身への代入は意味がありません"; });
        rules["using the result of an assignment as a condition without parentheses"]
            = (()=>{ return "代入演算の結果を条件式に使用しています (代入 '=' と比較 '==' を間違えていませんか？)"; });
        rules["(\\w+) (loop|statement) has empty body"]
            = (()=>{ return RegExp.$1 + "文の中身がありません"; });
        rules["type specifier missing, defaults to 'int'"]
            = (()=>{ return "型名がありません (int型と判断しました…型名の省略は推奨されません)"; });
        rules["implicitly declaring library function ('.*?').*"]
            = (()=>{ return "標準ライブラリ関数 " + RegExp.$1 + " を暗黙的に使用しています (警告を消すには正しいヘッダファイルをインクルードしてください)"; });
       　rules["incompatible redeclaration of library function ('.*?')"]
            = (()=>{ return "標準ライブラリ関数 " + RegExp.$1 + " を異なる定義で再宣言しています"; });
        rules["implicit declaration of function ('.*?') is invalid in C99"]
            = (()=>{ return "関数 " + RegExp.$1 + " は宣言されていません"; });
        rules["implicit conversion from ('.*?') to ('.*?') changes value from (.+?) to (.+)"]
            = (()=>{ return RegExp.$1 + "型から" + RegExp.$2 + "型への暗黙の変換により、値が " + RegExp.$3 + " から " + RegExp.$4 + "に変化します (警告を消すには ("+RegExp.$2+")"+RegExp.$3+"と書き、明示的に変換してください)"; });
        rules["incompatible (\\w+) to (\\w+) conversion returning ('.*?') from a function with result type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。戻り値は " + RegExp.$4 + " 型ですが、" + RegExp.$3 + " 型の値を返そうとしています"; });
        rules["incompatible (\\w+) to (\\w+) conversion passing ('.*?') to parameter of type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。引数は " + RegExp.$4 + " 型ですが、" + RegExp.$3 + " 型の値を渡そうとしています"; });
        rules["incompatible (\\w+) to (\\w+) conversion assigning to ('.*?') from ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。 " + RegExp.$3 + " 型の変数に" + RegExp.$4 + " 型の値を代入しています"; });
       　rules["data argument not used by format string"]
            = (()=>{ return "使われていない引数があります (フォーマット文字列を確認してください)"; });
       　rules["more '%' conversions than data arguments"]
            = (()=>{ return "指定されたフォーマット文字列に対して引数が足りません (フォーマット文字列を確認してください)"; });
       　rules["control reaches end of non-void function"]
            = (()=>{ return "戻り値を返さないまま関数が終了しています (return文を書くか、戻り値の型をvoidに変更してください)"; });
       　rules["control may reaches end of non-void function"]
            = (()=>{ return "戻り値を返さないまま関数が終了する可能性があります (すべての分岐で値を返していることを確認してください)"; });
       　rules["variable ('.*?') is uninitialized when used here"]
            = (()=>{ return "初期化されていない変数 " + RegExp.$1 + " が参照されました (変数は、参照する前に必ず初期値を代入しましょう)"; });
       　rules["excess elements in array initializer"]
            = (()=>{ return "配列初期化子の要素が配列のサイズに対して多すぎます"; });

        rules['expected "FILENAME" or <FILENAME>']
            = (()=>{ return 'インクルードファイル名は "ファイル名" または <ファイル名> と書く必要があります'; });
        rules["('.*?') file not found"]
            = (()=>{ return "インクルードファイル " + RegExp.$1 + " が見つかりません。ファイル名が間違っているか、対応していないライブラリです (コンパイルは中断されました)"; });
        rules["void function ('.*?') should not return a value"]
            = (()=>{ return "関数 " + RegExp.$1 + " の戻り値はvoid型なので、値を返すことはできません。単にreturn;と書くか、戻り値の型を修正してください"; });
        rules["non-void function ('.*?') should return a value"]
            = (()=>{ return "関数 " + RegExp.$1 + " の戻り値はvoidではないため、値を返す必要があります。return文を書くか、戻り値の型をvoidに修正してください"; });
        rules["too many arguments to function call, expected (\\d+), have (\\d+)"]
            = (()=>{ return RegExp.$1 + "引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が多すぎます)"; });
        rules["too many arguments to function call, single argument ('.*?'), have (\\d+) arguments"]
            = (()=>{ return "1引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が多すぎます)"; });
        rules["too few arguments to function call, expected (\\d+), have 0"]
            = (()=>{ return RegExp.$1 + "引数の関数に引数を渡していません (引数が少なすぎます)"; });
        rules["too few arguments to function call, expected (\\d+), have (\\d+)"]
            = (()=>{ return RegExp.$1 + "引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が少なすぎます)"; });
        rules["passing ('.*?') to parameter of incompatible type ('.*?')"]
            = (()=>{ return RegExp.$2 + " 型の引数に対し、変換できない " + RegExp.$2 + " 型の値を渡すことはできません"; });
        rules["use of undeclared identifier ('.*?')"]
            = (()=>{ return "変数 " + RegExp.$1 + " は宣言されていません。変数を使用するにはあらかじめ宣言を記述する必要があります"; });
        rules["expression is not assignable"]
            = (()=>{ return "この式には代入できません"; });
        rules["called object type ('.*?') is not a function or function pointer"]
            = (()=>{ return "呼び出しを試みた型" + RegExp.$1 + "は関数ではありません"; });
        rules["non-object type ('.*?') is not assignable"]
            = (()=>{ return RegExp.$1 + "型には代入できません"; });
        rules["array type ('.*?') is not assignable"]
            = (()=>{ return "配列には代入できません (配列の要素に代入するには添字を付けてください)"; });
        rules["invalid operands to binary expression \\(('.*?') and ('.*?')\\)"]
            = (()=>{ return "不正な二項演算です (" + RegExp.$1 + "型と" + RegExp.$2 + "型の間に演算が定義されていません)"; });
        rules["invalid suffix ('.*?') on integer constant"]
            = (()=>{ return "整数定数に対する不正な接尾辞です"; });
        rules["unknown type name 'include'"]
            = (()=>{ return "未知の型名 'include' です (#include の間違いではありませんか？)"; });
        rules["unknown type name ('.*?')"]
            = (()=>{ return "未知の型名 " + RegExp.$1 + "　です"; });
        rules["redefinition of ('.*?').*"]
            = (()=>{ return RegExp.$1 + " はすでに定義されています"; });
        rules["expected ';'.*"]
            = (()=>{ return "セミコロン ; が必要です"; });
        rules["expected '}'"]
            = (()=>{ return "中括弧 } が閉じていません"; });
        rules["extraneous closing brace.*"]
            = (()=>{ return "閉じ中括弧 } が多すぎます"; });
        rules["expected '\\)'"]
            = (()=>{ return "括弧 ) が閉じていません"; });
        rules["extraneous '\\)'.*"]
            = (()=>{ return "閉じ括弧 ) が多すぎます"; });
        rules["expected expression"]
            = (()=>{ return "条件式が必要です"; });
        rules["expected parameter declarator"]
            = (()=>{ return "引数の宣言が必要です"; });
        rules["expected 'while'.*"]
            = (()=>{ return "do-while文は while(...); で終わる必要があります"; });
        rules["expected identifier or ('.*?')"]
            = (()=>{ return "関数名、変数名、または " + RegExp.$1 + " が必要です"; });
        rules["expected function body after function declarator"]
            = (()=>{ return "関数の本体が必要です"; });
        rules["expected ('.*?') after ('.*?')"]
            = (()=>{ return RegExp.$1 + " の後に " + RegExp.$2 + " が必要です"; });
        rules["must use '(.*?)' tag to refer to type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "名の前に 'struct' が必要です"; });
        rules["'(.*?)' declared as an array with a negative size"]
            = (()=>{ return "負のサイズの配列は宣言できません"; });

        rules["to match this '{'"]
            = (()=>{ return "ブロックは以下の位置で開始しています"; });
        rules["to match this '\\('"]
            = (()=>{ return "括弧は以下の位置で開いています"; });
        rules["('.*?') declared here"]
            = (()=>{ return RegExp.$1 + " の宣言は以下の通りです："; });
        rules["passing argument to parameter ('.*?') here"]
            = (()=>{ return "引数 " + RegExp.$1 + " の宣言は以下の通りです："; });
        rules["please include the header (<.*?>) or explicitly provide a declaration for ('.*?')"]
            = (()=>{ return RegExp.$2 + " を使用するには #include " + RegExp.$1 + " と記述してください"; });
        rules["put the semicolon on a separate line to silence this warning"]
            = (()=>{ return "警告を消すには行末にセミコロンを書いてください"; });
        rules["previous definition is here"]
            = (()=>{ return "最初の定義は以下の通りです"; });
        rules["use '==' to turn this assignment into an equality comparison"]
            = (()=>{ return "値の比較には比較演算子 '==' を使用します"; });
        rules["use '=' to turn this equality comparison into an assignment"]
            = (()=>{ return "代入には代入演算子 '=' を使用します"; });
        rules["place parentheses around the assignment to silence this warning"]
            = (()=>{ return "間違いでない場合は、警告を消すために代入演算を()で囲んでください"; });
        rules["initialize the variable ('.*?') to silence this warning"]
            = (()=>{ return "警告を消すためには " + RegExp.$1 + " に初期値を代入してください"; });
        rules["('.*?') is a builtin with type ('.*?')"]
            = (()=>{ return RegExp.$1 + " は組み込み関数です"; });
        rules["uninitialized use occurs here"]
            = (()=>{ "ここで未初期化のまま参照されています"; });
        rules["remove the 'if' if its condition is always false"]
            = (()=>{ "本当に常に真でよい場合、if文は不要です"; });

        for(var rule in rules){
            try{
                if(text.match(new RegExp(rule))){
                    return (<any>RegExp).leftContext + rules[rule]() + (<any>RegExp).rightContext;
                }
            }catch(e){
                console.log(e);
                console.log(rule);
            }
        }
        return text;
    }

    function ConvertTerminalColor(text: string): string {
        return text.replace(/\[31m(.*)\[0m/g,'<span class="text-danger">$1</span>');
    }

    function ReplaceNewLine(text: string): string {
        return text.replace(/[\r\n|\r|\n]/g,"<br>\n");
    }

    function FormatMessage(text: string, filename: string): string {
        text = text.replace(/ERROR.*$/gm,"") // To remove a message that is not Clang one but Emscripten's.
                   .replace(/</gm, "&lt;")
                   .replace(/>/gm, "&gt;");

        var textlines: string[] = text.split(/[\r\n|\r|\n]/g);
        for(var i = 0; i < textlines.length; ++i){
            if(textlines[i].lastIndexOf(filename, 0) == 0){
                textlines[i] = textlines[i].replace(/ \[.*\]/gm, "");
                if(Aspen.Language == "ja"){
                    textlines[i] = TranslateMessageToJapanese(textlines[i]);
                }
                if(textlines[i+1].lastIndexOf(filename, 0) != 0){
                    var code = textlines[i+1];
                    var indicator = textlines[i+2];
                    var begin = indicator.indexOf("~");
                    var end = indicator.lastIndexOf("~") + 1;
                    var replacee = code.substring(begin, end);
                    var code = replacee.length > 0 ? code.replace(replacee, "<u>" + replacee + "</u>") : code;
                    var consumedLines = 1;
                    textlines[i+1] = "<code>" + code.replace(/ /gm, "&nbsp;") + "</code>";
                    if(textlines[i+2].lastIndexOf(filename, 0) != 0){
                        textlines[i+2] = "<samp>" + indicator.replace(/~/g, " ")
                                                  .replace(/ /gm, "&nbsp;")
                                                  .replace(/\^/, "<span class='glyphicon glyphicon-arrow-up'></span>") + "</samp>";
                        consumedLines++;
                    }
                    if(textlines[i+3].lastIndexOf(filename, 0) != 0){
                        textlines[i+3] = "<samp>" + textlines[i+3].replace(/ /gm, "&nbsp;") + "</samp>";
                        consumedLines++;
                    }
                    i += consumedLines;
                }
            }
        }

        return textlines.join("<br>\n")
            .replace(/(\d+).\d+: (note):(.*)$/gm,    " <b>line $1</b>: <span class='label label-info'>$2</span> <span class='text-info'>$3</span>")
            .replace(/(\d+).\d+: (warning):(.*)$/gm, " <b>line $1</b>: <span class='label label-warning'>$2</span> <span class='text-warning'>$3</span>")
            .replace(/(\d+).\d+: (error):(.*)$/gm,   " <b>line $1</b>: <span class='label label-danger'>$2</span> <span class='text-danger'>$3</span>")
            .replace(/(\d+).\d+: (fatal error):(.*)$/gm,   " <b>line $1</b>: <span class='label label-danger'>$2</span> <span class='text-danger'>$3</span>");
    }


    function FormatFilename(text:string, fileName: string): string {
        return text.replace(/\/.*\.c/g,fileName+".c")
                   .replace(/\/.*\/(.*\.h)/g, "$1");
    }

    export function FormatClangErrorMessage(text: string, fileName: string): string {
        return FormatMessage(FormatFilename(ConvertTerminalColor(text), fileName), fileName);
    }

    export function CheckFileName(name: string, DB: SourceDB): string {
        var filename = name;
        if(filename == null) {
            return null;
        }

        if(filename == "") {
            filename = "file"+ new Date().toJSON().replace(/\/|:|\./g,"-").replace(/20..-/,"").replace(/..-..T/,"").replace(/Z/g,"").replace(/-/g,"");
        }

        if(filename.match(/[\s\t\\/:\*\?\"\<\>\|]+/)) {//"
            alert("This file name is incorrect.");
            return null;
        }

        if(filename.match(/.*\.c/) == null) {
            filename += '.c';
        }
        if(DB.Exist(filename)) {
            alert("'"+filename+"' already exists.");
            return null;
        }
        return filename;
    }

    export function ConfirmAllRemove(): boolean {
        return confirm('All items will be delete immediately. Are you sure you want to continue?');
    }

    export function ConfirmToRemove(BaseName: string): boolean {
        return confirm('The item "'+BaseName+'.c" will be delete immediately. Are you sure you want to continue?');
    }
}
