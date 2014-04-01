///<reference path='../typings/jquery/jquery.d.ts'/>
///<reference path='../typings/jquery_plugins.d.ts'/>
///<reference path='./output.ts'/>

declare function saveAs(data :Blob, filename: String): void;
var _ua: any;

module AspenU {

    export function Compile(source, option, filename, isCached, Context, callback, onerror) {
        if(isCached) {
            $.ajax({
                type: "POST",
                url: "compile",
                data: JSON.stringify({source: source, option: option, filename: filename}),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                success: callback,
                error: onerror
            });
        } else {
            setTimeout(callback,200,Context);
        }
    }

    export function Run(source: string, ctx, out){
        ctx.source = source;
        var Module = {
            print: function(x){ out.PrintFromC(x); },
            canvas: document.getElementById("canvas") //TODO add canvas#canvas
        };
        try {
            var exe = new Function("Module", source);
            exe(Module);
        }catch(e) {
            out.Print(e);
        }
        out.Prompt();
    }

}

var Aspen: any = {};

$(function () {

    var Editor: AspenU.Editor   = new AspenU.Editor("editor");
    var Output: AspenU.Output   = new AspenU.Output($("#output"));
    var DB:     AspenU.SourceDB = new AspenU.SourceDB();
    var Context: any = {}; //TODO refactor AspenU.Response
    var Files: AspenU.FileCollection = new AspenU.FileCollection();

    Aspen.Editor = Editor;
    Aspen.Output = Output;
    Aspen.Source = DB;
    Aspen.Context = Context;
    Aspen.Files = Files;
    Aspen.Language = "en";
    Aspen.Debug = {};
    Aspen.Debug.DeleteAllKey = () => {
        while(localStorage.length > 1) {
            localStorage.removeItem(localStorage.key(0));
        }
    };
    Aspen.Debug.OutputClangMessage = (message, filename) => {
        Output.PrintLn('DEBUG');
        Output.PrintLn(AspenU.FormatClangErrorMessage(message, filename));
    };
    Aspen.Debug.PrintC = (message) => {
        Output.PrintFromC(message);
    };

    $("#close-console").click(()=>{
        Editor.Expand();
        Output.Shrink();
    });

    var changeFlag = true;
    Editor.OnChange((e: Event)=> {
        if(!Files.Empty()){
            changeFlag = true;
            DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
            Editor.Expand();
            Output.Shrink();
        }
    });

    var running = false;

    var DisableUI = () => {
        $(".disabled-on-running").addClass("disabled");
        Editor.Disable();
        Output.Expand();
        running = true;
    }

    var EnableUI = () => {
        $(".disabled-on-running").removeClass("disabled");
        Editor.Enable();
        running = false;
    }

    var ChangeCurrentFile = (e: Event) => {
        if(running) return
        Files.SetCurrent((<any>e.target).id);
        Editor.ChangeSession(DB.Load(Files.GetCurrent().GetName()));
    };

    Files.Show(ChangeCurrentFile);
    Output.Prompt();

    Aspen.Debug.SetRunning = (flag: boolean) => {
        if(flag){
            DisableUI();
        }else{
            EnableUI();
        }
    };

    var FindErrorNumbersInErrorMessage = (message: string) => {
        var errorLineNumbers = [];
        jQuery.each(message.split(".c"), (function(k, v){
            var match = v.match(/:(\d+):\d+:\s+error/);
            if(match && match[1]){
                errorLineNumbers.push(match[1]);
            }
        }));
        return errorLineNumbers;
    }

    var CompileCallback = (e: Event)=> {
        if(Files.Empty() || running) return;
        if(Editor.ContainsMultiByteSpace()) {
            if(confirm('ソースコード中に全角スペースが含まれています。半角スペースに置換しますか？\n(C言語では全角スペースを使えません)')) {
                Editor.ReplaceMultiByteSpace();
            }
        }
        var src = Editor.GetValue();
        var file = Files.GetCurrent();
        var opt = '-m'; //TODO
        Output.Clear();
        Output.Prompt();
        Output.PrintLn('gcc '+file.GetName()+' -o '+file.GetBaseName());
        DisableUI();
        Editor.RemoveAllErrorLine();

        AspenU.Compile(src, opt, file.GetName(), changeFlag, Context, function(res){
            try{
                changeFlag = false;
                if(res == null) {
                    Output.PrintErrorLn('Sorry, the server is something wrong.');
                    return;
                }
                if(res.error.length > 0) {
                    Output.PrintLn(AspenU.FormatClangErrorMessage(res.error, file.GetBaseName()));
                    Editor.SetErrorLines(FindErrorNumbersInErrorMessage(res.error));
                }
                Output.Prompt();

                Context.error = res.error;
                if(!res.error.match("error:")) {
                    Output.PrintLn('./' + file.GetBaseName());
                    AspenU.Run(res.source, Context, Output);
                } else {
                    Context.source = null;
                }
            }finally{
                EnableUI();
            }
        }, ()=>{
            Output.PrintErrorLn('Sorry, the server is something wrong.');
            EnableUI();
        });
    };

    $("#compile").click(CompileCallback);
    (<any>$("#compile")).tooltip({placement: "bottom", html: true});

    var SaveFunction = (e: Event)=> {
        if(Files.Empty()) return;
        var blob = new Blob([Editor.GetValue()], {type: 'text/plain; charset=UTF-8'});
        saveAs(blob, Files.GetCurrent().GetName());
    };
    $("#save-file-menu").click(SaveFunction);


    $("#open-file-menu").click((e: Event)=> {
        $("#file-open-dialog").click();
    });

    var endsWith = function(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    $("#file-open-dialog").change(function(e: Event) {
        var file: File = this.files[0];
        if(file) {
            if(!endsWith(file.name, ".c")){
                alert("Unsupported file type.\nplease select '*.c' file.");
                return;
            }
            var reader = new FileReader();
            reader.onerror = (e: Event)=> {
                alert(<any>e);
            };
            reader.onload = (e: Event)=> {
                DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
                var fileModel = new AspenU.FileModel(Files.MakeUniqueName(file.name));
                Files.Append(fileModel, ChangeCurrentFile);
                Files.SetCurrent(fileModel.GetBaseName());
                Editor.ChangeSession((<any>e.target).result);
                DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
            };
            reader.readAsText(file, 'utf-8');
        }
    });

    var OnFilesBecomeEmpty = () => {
        $("#delete-file").hide();
        $(".disabled-on-files-empty").addClass("disabled");
        Editor.Clear();
        Editor.Disable();
    };
    var OnFilesBecomeNotEmpty = () => {
        $("#delete-file").show();
        $(".disabled-on-files-empty").removeClass("disabled");
        Editor.Enable();
    };

    var CreateFileFunction = (e: Event) => {
        if(running) return;
        var filename = prompt("Please enter the file name.", AspenU.CheckFileName("", DB));
        filename = AspenU.CheckFileName(filename, DB);
        if(filename == null) {
            return;
        }

        var file = new AspenU.FileModel(filename);
        Files.Append(file, ChangeCurrentFile);
        Files.SetCurrent(file.GetBaseName());
        OnFilesBecomeNotEmpty();
        Editor.ResetHelloWorld();
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
    };
    (<any>$("#create-file")).tooltip({placement: "bottom", html: true});
    $("#create-file").click(CreateFileFunction);
    $("#create-file-menu").click(CreateFileFunction);

    var RenameFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
        var oldfilebasename = Files.GetCurrent().GetBaseName();
        var oldfilecontents = Editor.GetValue();

        var filename = prompt("Rename: Please enter the file name.", oldfilebasename+".c");
        filename = AspenU.CheckFileName(filename, DB);
        if(filename == null) {
            return;
        }
        Files.Rename(oldfilebasename, filename, oldfilecontents, ChangeCurrentFile, DB);
        Editor.SetValue(oldfilecontents);
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
    };
    $("#rename-menu").click(RenameFunction);

    var DeleteFileFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        var BaseName = Files.GetCurrent().GetBaseName();
        if(AspenU.ConfirmToRemove(BaseName)) {
            Files.Remove(BaseName);
            if(Files.Empty()){
                OnFilesBecomeEmpty();
            }else{
                Editor.SetValue(DB.Load(Files.GetCurrent().GetName()));
            }
        }
    };

    (<any>$("#delete-file")).tooltip({placement: "bottom", html: true});
    $("#delete-file").click(DeleteFileFunction);
    $("#delete-file-menu").click(DeleteFileFunction);

    var DeleteAllFilesFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        var BaseName = Files.GetCurrent().GetBaseName();
        if(AspenU.ConfirmAllRemove()) {
            Files.Clear();
        }
        OnFilesBecomeEmpty();
    };
    $("#delete-all-file-menu").click(DeleteAllFilesFunction);

    var JpModeCheckFunction = (function(e: Event) {
        Aspen.Language = this.checked ? "ja" : "en";
    });
    $("#JpModeCheck").click(JpModeCheckFunction);

    document.onkeydown = (ev: KeyboardEvent) => {
        if(ev.ctrlKey) {
            switch(ev.keyCode){
                case 13:/*Enter*/
                    ev.preventDefault();
                    ev.stopPropagation();
                    CompileCallback(ev);
                    return;
//                case 78:/*n*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    CreateFileFunction(ev);
//                    return;
//                case 87:/*w*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    DeleteFileFunction(ev);
//                    return;
//                case 82:/*r*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    RenameFunction(ev);
//                    return;
//                case 83:/*s*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    SaveFunction(ev);
//                    return;
//                case 79:/*o*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    $("#file-open-dialog").click();
//                    return;
            }
        }
    };

    $(window).on("beforeunload", (e: Event)=> {
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
    });

    if(DB.Exist(Files.GetCurrent().GetName())) {
        Editor.SetValue(DB.Load(Files.GetCurrent().GetName()));
    }

    if(_ua.Trident && _ua.ltIE9){
        $("#NotSupportedBrouserAlert").show();
        DisableUI();
    }
});
