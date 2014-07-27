function VoiceParameters() {
    // Parameters
    this.name = "";
    this.algorithm = 0;
    this.coarse = [ 0, 0, 0, 0 ];
    this.fine = [ 0, 0, 0, 0 ];
    this.fixed = [ false, false, false, false ];
    this.feedback = 0.0;
    this.velsens = [ false, false, false, false ];
    this.egloop = [ false, false, false, false ];

    this.EGpos = new Array(4);
    for (var op = 0; op < 4; op++) {
        this.EGpos[op] = [
                             new pos (0, 0),
                             new pos (0, 0),
                             new pos (0, 0)
        ];
    }

}

VoiceParameters.prototype.stringParameter = function() {
    // パラメータから URI を生成する。
    var string = "v=1&";

    for (var op = 0; op < 4; op++) {
        string += "fx" + op + "=" + (this.fixed[op] ? 1 : 0) + "&";
        string += "v"  + op + "=" + (this.velsens[op] ? 1 : 0) + "&";
        string += "el" + op + "=" + (this.egloop[op] ? 1 : 0) + "&";
        string += "fc" + op + "=" + this.coarse[op].toFixed(3) + "&";
        string += "ff" + op + "=" + this.fine[op].toFixed(3) + "&";

        for (var seg = 0; seg < 3; seg++) {
            string += "eX" + op + seg + "=" + this.EGpos[op][seg].x.toFixed(3) + "&";
            string += "eY" + op + seg + "=" + this.EGpos[op][seg].y.toFixed(3) + "&";
        }
    }

    string += "fb=" + this.feedback.toFixed(3) + "&";
    string += "a="  + this.algorithm + "&";
    string += "n="  + this.name;

    return string;
};

VoiceParameters.prototype.recallVoiceParam = function(uri) {
    // URI からパラメータを復元する
    var param = new parseUri(decodeURIComponent(uri));
    for (var op = 0; op < 4; op++) {
        var fixed = param.queryKey['fx' + op];
        if (fixed) {
            this.fixed[op] = parseInt(fixed);
        }

        var velsens = param.queryKey['v' + op];
        if (velsens) {
            this.velsens[op] = parseInt(velsens);
        }

        var egloop = param.queryKey['el' + op];
        if (egloop) {
            this.egloop[op] = parseInt(egloop);
        }

        var coarse = param.queryKey['fc' + op];
        if (coarse) {
            this.coarse[op] = parseFloat(coarse);
        }

        var fine = param.queryKey['ff' + op];
        if (fine) {
            this.fine[op] = parseFloat(fine);
        }

        for (var seg = 0; seg < 3; seg++) {
            var posX = param.queryKey['eX' + op + seg];
            if (posX) {
                this.EGpos[op][seg].x = parseFloat(posX);
            }

            var posY = param.queryKey['eY' + op + seg];
            if (posY) {
                this.EGpos[op][seg].y = parseFloat(posY);
            }
        }
    }

    var feedback = param.queryKey['fb'];
    if (feedback) {
        this.feedback = parseFloat(feedback);
    }

    var algorithm = param.queryKey['a'];
    if (algorithm) {
        this.algorithm = algorithm;
    }

    var name = param.queryKey['n'];
    if (name) {
        this.name = name;
    } else {
        this.name = "";
    }
};

