var Application = function() {
    this.theFMTG = new FMToneGenerator();
    this.theFMTG.changeAlgorithm(0);
    this.theEGView = new Array(4);
    this.theAlgView = 0;
    this.theFaderView_coarse = 0;
    this.theFaderView_fine = 0;
    this.theFaderView_feedback = 0;
    this.theFaderView_velocity = 0;
    this.theSpectrumView = 0;

    // Initialize Audio I/O
    const BUFFER_SIZE = 2048;
    const NUM_OUTPUTS = 2;

    //const NUM_INPUTS = 0; // Results in horrible noise in Safari 6
    const NUM_INPUTS = 1; // Works properly in Safari 6

    this.context = new webkitAudioContext();
    this.node = this.context.createJavaScriptNode(BUFFER_SIZE, NUM_INPUTS, NUM_OUTPUTS);

    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;

    this.convolver = this.context.createConvolver();
    var request = new XMLHttpRequest();
    var _this = this;
    request.open("GET", "DEP3_cheap.wav", true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        _this.context.decodeAudioData(request.response, function(buffer) {
            _this.convolver.buffer = buffer;
        })
    }
    request.send();

    this.compressor = this.context.createDynamicsCompressor();

    this.convolverGain = this.context.createGainNode();
    this.convolverGain.gain.value = 0.3;

    this.node.connect(this.analyzer);
    this.analyzer.connect(this.compressor);

    this.node.connect(this.convolver);
    this.convolver.connect(this.convolverGain);
    this.convolverGain.connect(this.compressor);

    this.compressor.connect(this.context.destination);

    this.theFMTG.sampleRate = this.context.sampleRate;

    this.velocity = 1.0;

    this.voice = new VoiceParameters();
    this.presetVoiceBank = new PresetVoiceBank();

    this.programNo = 1;
    this.presentedProgramNo = -1;

    this.FixedFreqBaseTable = new Array(100);
    var f = 1;
    for (var i = 0; i < 100; i++) {
        this.FixedFreqBaseTable[i] = f;
        f = Math.exp(Math.log(f) + 40 / (1200 / Math.log(2)));
    }


    var self = this;
    this.node.onaudioprocess = function(e) {
        self.theFMTG.generateAudio(e);
    };
}

Application.prototype.calcRatioFreq = function(coarse, fine) {
    var ratio = Math.ceil(coarse * 13);
    if (ratio == 0) {
        ratio = 0.5;
    }

    if (fine >= 1.0) {
        fine = 0.99;
    }
    ratio += fine;

    return ratio;
}

Application.prototype.calcFixedFreq = function(coarse, fine) {
    var rate = Math.pow(10, Math.floor(coarse * 3));
    var base = Math.floor(fine * 100);
    if (base > 99) {
        base = 99;
    }

    return this.FixedFreqBaseTable[base] * rate;
}

Application.prototype.calcFreq = function(op) {
    var ratio;
    if (this.voice.fixed[op] == false) {
        ratio = this.calcRatioFreq(this.voice.coarse[op], this.voice.fine[op]);
    } else {
        ratio = this.calcFixedFreq(this.voice.coarse[op], this.voice.fine[op]);
    }

    return ratio;
}

Application.prototype.noteOn = function(noteNo, velocity) {
    // copy parameters to Tone Generator from UI
    for (var i = 0; i < 4; i++) {
        const EG_TOTAL_TIME = 15 * this.context.sampleRate;

        var length;

        // Attack
        length = Math.pow(this.voice.EGpos[i][0].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        this.theFMTG.eg[i].EGseg_length[0] = length;
        this.theFMTG.eg[i].EGseg_step[0] = (1.0 - this.voice.EGpos[i][0].y) / length;

        // Decay
        length = Math.pow(this.voice.EGpos[i][1].x - this.voice.EGpos[i][0].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        this.theFMTG.eg[i].EGseg_length[1] = length;
        this.theFMTG.eg[i].EGseg_step[1] = -1 * (this.voice.EGpos[i][1].y - this.voice.EGpos[i][0].y) / length;

        // Release
        length = Math.pow(1.0 - this.voice.EGpos[i][2].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        this.theFMTG.eg[i].EGseg_length[2] = length;
        this.theFMTG.eg[i].EGseg_step[2] = -1 * (1.0 - this.voice.EGpos[i][2].y) / length;

        this.theFMTG.freq[i] = this.calcFreq(i);
        this.theFMTG.fixed[i] = this.voice.fixed[i];
        this.theFMTG.velsens[i] = this.voice.velsens[i];
        this.theFMTG.eg[i].loop = this.voice.egloop[i];
    }

    this.theFMTG.feedback = this.voice.feedback;
    this.theFMTG.changeAlgorithm(this.voice.algorithm);

    this.theFMTG.noteOn(noteNo, velocity);
}

Application.prototype.noteOff = function(noteNo) {
    this.theFMTG.noteOff(noteNo);
}

Application.prototype.updateView = function () {
    var curOp = this.theAlgView.op;
    this.theAlgView.setAlgorithm(this.voice.algorithm);

    for (var i = 0; i < 4; i++) {
        var id = "#OP" + (i + 1) + "_text";
        if (i == curOp) {
            $(id).css("color", "lightgreen");
        } else {
            $(id).css("color", "white");
        }

           this.theEGView[i].setEGpos(this.voice.EGpos[i]);
    }

    if (this.voice.egloop[curOp] == true) {
        $("#led_egloop").show();
    } else {
        $("#led_egloop").fadeOut('fast');
    }

    if (this.voice.velsens[curOp] == true) {
        $("#led_velsens").show();
        this.theEGView[curOp].setHeightScale(p.velocity);
    } else {
        $("#led_velsens").fadeOut('fast');
        this.theEGView[curOp].setHeightScale(1.0);
    }

    if (this.voice.fixed[this.theAlgView.op] == false) {
        $("#led_ratio").show();
        $("#led_fixed").fadeOut('fast');
    } else {
        $("#led_ratio").fadeOut('fast');
        $("#led_fixed").show();
    }

    $("#curOP").html(curOp + 1);

    this.theFaderView_coarse.setValue(this.voice.coarse[curOp]);
    this.theFaderView_fine.setValue(this.voice.fine[curOp]);

    var ratio = this.calcFreq(curOp);
    $("#ratio").html("%.2f".sprintf(ratio));

    this.theFaderView_feedback.setValue(this.voice.feedback);
    $("#feedback").html("%.2f".sprintf(this.voice.feedback));

    this.theFaderView_velocity.setValue(this.velocity);

    $("#VoiceName").html(this.voice.name);

    if (this.programNo != this.presentedProgramNo) {
        var digit1 = this.programNo % 10;
        var digit2 = Math.floor(this.programNo / 10);
        $("#ProgramNo").html("<img src=\"images/LED_No" + digit2 + ".png\"><img src=\"images/LED_No" + digit1 + ".png\">");
        this.presentedProgramNo = this.programNo;
    }
}

Application.prototype.onload = function() {
    var self = this;
    this.theAlgView = new AlgView(document.getElementById('canvas_ALG'));
    this.theAlgView.onChangeAlgorithm = function(algNo) {
        self.voice.algorithm = algNo;
    }
    this.theAlgView.onChangeOperator = function(opNo) {
        self.updateView();
    }

    for (var i = 0; i < 4; i++) {
        var id = "#OP" + (i + 1) + " canvas";
        this.theEGView[i] = new EGView($(id)[0]);
        this.theEGView[i].opNo = i;
        this.theEGView[i].onMouseDown = function (opNo) {
            self.theAlgView.setOperator(opNo);
        };
        this.theEGView[i].onUpdateEGpos = function (opNo, EGpos) {
            self.voice.EGpos[opNo] = EGpos;
        };

        this.theFMTG.eg[i].EGView = this.theEGView[i];
    }

    this.theFaderView_coarse = new FaderView(document.getElementById('knob_coarse'), 100 /* height */);
    this.theFaderView_coarse.onUpdateValue = function(value) {
        var op = self.theAlgView.op;
        self.voice.coarse[op] = value;

        self.updateView();
    }

    this.theFaderView_fine = new FaderView(document.getElementById('knob_fine'), 100);
    this.theFaderView_fine.onUpdateValue = function(value) {
        var op = self.theAlgView.op;
        self.voice.fine[op] = value;

        self.updateView();
    }

    this.theFaderView_feedback = new FaderView(document.getElementById('knob_feedback'), 100);
    this.theFaderView_feedback.onUpdateValue = function(value) {
        self.voice.feedback = value;

        self.updateView();
    }

    this.theFaderView_velocity = new FaderView(document.getElementById('knob_velocity'), 72);
    this.theFaderView_velocity.onUpdateValue = function(value) {
        self.velocity = value;
        for (var i = 0; i < 4; i++) {
            if (self.voice.velsens[i] == true) {
                self.theEGView[i].setHeightScale(value);
            }
        }
    }

    this.theSpectrumView = new SpectrumView(document.getElementById('canvas_SPECTRUM'));
    this.theSpectrumView.fftSize = this.analyzer.frequencyBinCount;

    var self = this;
    this.theSpectrumView.feedFrequencyData = function (data) {
        self.analyzer.getByteFrequencyData(data);
    }

    this.theSpectrumView.animationLoop();

    if (this.isUserVoiceAvailable()) {
        this.programNo = 0;
    }

    this.recallPresetVoice(this.programNo);
    this.updateView();
}

Application.prototype.recallPresetVoice = function(no) {
    if (no == 0 && this.isUserVoiceAvailable()) {
        this.voice.recallVoiceParam(location.href);
    } else if (1 <= no && no <= this.presetVoiceBank.numOfPresets()) {
        this.voice.recallVoiceParam(this.presetVoiceBank.presetVoiceURL(no - 1));
    }

    this.updateView();
}

Application.prototype.isUserVoiceAvailable = function() {
    var param = new parseUri(location.href);
    if (param.queryKey['v']) {
        return true;
    }

    return false;
}

var paramURL = "";
function share()
{
    var locationArray = location.href.split('?');
    paramURL = locationArray[0] + "?" + p.voice.stringParameter();

    var login  = 'takmiz';
    var apiKey = 'R_1d20bba381cee9ec2773585c09ed0d8a';
    bitly = 'http://api.bit.ly/shorten'
        + '?version=2.0.1&format=json&callback=bitlyCallback'
        + '&login=' + login
        + '&apiKey=' + apiKey + '&longUrl=';
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = bitly + encodeURIComponent(paramURL);
    document.body.appendChild(script);
}

function bitlyCallback(bitlyResponse)
{
    var title = '';
    var url = 'http://twitter.com/share?text='
        + encodeURIComponent('"' + p.voice.name + '" made with Web FM synthesizer')
        + '&hashtags=webfmsynth&url='
        + encodeURIComponent(bitlyResponse.results[paramURL]['shortUrl']);

    location.href = url;
}

function NoteTableItem(x, y, w, h, noteNo)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.noteNo = noteNo;
}

onload = function() {
    var noteTable = [
        // black keys
        new NoteTableItem( 28, 0, 44, 110, 54),
        new NoteTableItem( 89, 0, 44, 110, 56),
        new NoteTableItem(150, 0, 44, 110, 58),
        new NoteTableItem(233, 0, 44, 110, 61),
        new NoteTableItem(303, 0, 44, 110, 63),
        new NoteTableItem(386, 0, 44, 110, 66),
        new NoteTableItem(447, 0, 44, 110, 68),
        new NoteTableItem(508, 0, 44, 110, 70),
        new NoteTableItem(590, 0, 44, 110, 73),
        new NoteTableItem(660, 0, 44, 110, 75),
        new NoteTableItem(743, 0, 44, 110, 78),
        new NoteTableItem(804, 0, 44, 110, 80),
        new NoteTableItem(866, 0, 44, 110, 82),

        // white keys
        new NoteTableItem(  0, 0,  9, 188, 52),
        new NoteTableItem(  9, 0, 51, 188, 53),
        new NoteTableItem( 60, 0, 51, 188, 55),
        new NoteTableItem(111, 0, 51, 188, 57),
        new NoteTableItem(162, 0, 51, 188, 59),
        new NoteTableItem(213, 0, 51, 188, 60),
        new NoteTableItem(264, 0, 51, 188, 62),
        new NoteTableItem(315, 0, 51, 188, 64),
        new NoteTableItem(366, 0, 51, 188, 65),
        new NoteTableItem(417, 0, 51, 188, 67),
        new NoteTableItem(468, 0, 51, 188, 69),
        new NoteTableItem(519, 0, 51, 188, 71),
        new NoteTableItem(570, 0, 51, 188, 72),
        new NoteTableItem(621, 0, 51, 188, 74),
        new NoteTableItem(672, 0, 51, 188, 76),
        new NoteTableItem(723, 0, 51, 188, 77),
        new NoteTableItem(774, 0, 51, 188, 79),
        new NoteTableItem(825, 0, 51, 188, 81),
        new NoteTableItem(876, 0, 51, 188, 83),
    ];

    function getNoteTableIndexFromPos(x, y) {
        var noteNo = 0;
        var index = 0;
        for (var i = 0; i < noteTable.length; i++) {
            if (noteTable[i].x <= x && x <= noteTable[i].x + noteTable[i].w &&
                noteTable[i].y <= y && y <= noteTable[i].y + noteTable[i].h) {
                index = i;
                break;
            }
        }
        return index;
    }

    $("#keyboard").mousedown(function(e) {
        var rect = e.target.getBoundingClientRect();
        var mouseX1 = e.clientX - rect.left;
        var mouseY1 = e.clientY - rect.top;

        var i = getNoteTableIndexFromPos(mouseX1, mouseY1);
        var noteNo = noteTable[i].noteNo;

        p.noteOn(noteNo, p.velocity);

        $("#keymask").css("left", noteTable[i].x).width(noteTable[i].w).height(noteTable[i].h).show();
    });

    $("#keyboard").mouseup(function(e) {
        var rect = e.target.getBoundingClientRect();
        var mouseX1 = e.clientX - rect.left;
        var mouseY1 = e.clientY - rect.top;

        var i = getNoteTableIndexFromPos(mouseX1, mouseY1);
        var noteNo = noteTable[i].noteNo;

        p.noteOff(noteNo);

        $("#keymask").hide();
    });

    $("#button_egloop").mousedown(function(e) {
        var op = p.theAlgView.op;
        p.voice.egloop[op] = !p.voice.egloop[op];

        p.updateView();
    });

    $("#button_velsens").mousedown(function(e) {
        var op = p.theAlgView.op;
        p.voice.velsens[op] = !p.voice.velsens[op];

        p.updateView();
    });

    $("#button_ratio").mousedown(function(e) {
        var op = p.theAlgView.op;
        p.voice.fixed[op] = false;

        p.updateView();
    });

    $("#button_fixed").mousedown(function(e) {
        var op = p.theAlgView.op;
        p.voice.fixed[op] = true;

        p.updateView();
    });

    $("#button_edit").mousedown(function(e) {
       $("#edit").fadeToggle('fast');
    });

    $("#button_effect").mousedown(function(e) {
       $("#effect").fadeToggle('fast');
    });

    $("#button_sequencer").mousedown(function(e) {
       $("#sequencer").fadeToggle('fast');
    });

    $("#button_recorder").mousedown(function(e) {
       $("#recorder").fadeToggle('fast');
    });

    $("#button_waveselect").mousedown(function(e) {
       $("#waveselect").fadeToggle('fast');
    });

    $("#button_progUp").mousedown(function(e) {
        var minProgramNo = 1;
        if (p.isUserVoiceAvailable()) {
            minProgramNo = 0;
        }

        if (p.programNo > minProgramNo) {
               p.programNo--;
           }
           p.recallPresetVoice(p.programNo);
    });

    $("#button_progDown").mousedown(function(e) {
        if (p.programNo < p.presetVoiceBank.numOfPresets()) {
               p.programNo++;
           }
           p.recallPresetVoice(p.programNo);
    });

    $("#VoiceName").click(function(e) {
        $("#VoiceNameEdit").val(p.voice.name).show().focus();
    });

    $("#VoiceNameEdit").keypress(function(e) {
        if (e.keyCode && e.keyCode == 13) {
            p.voice.name = $("#VoiceNameEdit").val();
            p.updateView();
            $("#VoiceNameEdit").hide();
        }
    });

    $("#VoiceNameEdit").blur(function(e) {
        p.voice.name = $("#VoiceNameEdit").val();
        p.updateView();
        $("#VoiceNameEdit").hide();
    });

    if (typeof(webkitAudioContext) == "undefined") {
        $("#webaudioalert").show();
    }

    p.onload();
}


var p = new Application();
