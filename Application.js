var ChannelInfo = function() {
	this.tg = null;
	this.scriptProcessor = null;
	this.noteNo = 0;
};

var Application = function() {
	this.channelTable = new Array();

    this.theEGView = new Array(4);
    this.theAlgView = 0;
    this.theFaderView_coarse = 0;
    this.theFaderView_fine = 0;
    this.theFaderView_feedback = 0;
    this.theFaderView_velocity = 0;
    this.theSpectrumView = 0;

    this.context = new AudioContext();

    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;

    this.compressor = this.context.createDynamicsCompressor();

    this.analyzer.connect(this.compressor);

    this.compressor.connect(this.context.destination);

    this.velocity = 1.0;

    this.voice = new VoiceParameters();
    this.presetVoiceBank = new PresetVoiceBank();

	this.latestNoteNo = 0;
    this.programNo = 1;
    this.presentedProgramNo = -1;

    this.FixedFreqBaseTable = new Array(100);
    var f = 1;
    for (var i = 0; i < 100; i++) {
        this.FixedFreqBaseTable[i] = f;
        f = Math.exp(Math.log(f) + 40 / (1200 / Math.log(2)));
    }
    
	this.MIDIinputs = null;
};

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
};

Application.prototype.calcFixedFreq = function(coarse, fine) {
    var rate = Math.pow(10, Math.floor(coarse * 3));
    var base = Math.floor(fine * 100);
    if (base > 99) {
        base = 99;
    }

    return this.FixedFreqBaseTable[base] * rate;
};

Application.prototype.calcFreq = function(op) {
    var ratio;
    if (this.voice.fixed[op] == false) {
        ratio = this.calcRatioFreq(this.voice.coarse[op], this.voice.fine[op]);
    } else {
        ratio = this.calcFixedFreq(this.voice.coarse[op], this.voice.fine[op]);
    }

    return ratio;
};

Application.prototype.noteOn = function(noteNo, velocity) {
 	var tg = new FMToneGenerator();
    //this.theFMTG.changeAlgorithm(0);
    tg.sampleRate = this.context.sampleRate;

    // Initialize Audio I/O
    const BUFFER_SIZE = 2048;
    const NUM_OUTPUTS = 2;

    //const NUM_INPUTS = 0; // Results in horrible noise in Safari 6
    const NUM_INPUTS = 1; // Works properly in Safari 6

    var scriptProcessor = this.context.createScriptProcessor(BUFFER_SIZE, NUM_INPUTS, NUM_OUTPUTS);
    scriptProcessor.connect(this.analyzer);
    scriptProcessor.onaudioprocess = function(e) {
    	// var Time1 = performance.now();
		
		tg.generateAudio(e);
		
		// var Time2 = performance.now();
    	// console.log(Math.floor((Time2 - Time1) * 1000) + "ns");
    };

	// copy parameters to Tone Generator from UI
    for (var i = 0; i < 4; i++) {
        const EG_TOTAL_TIME = 15 * this.context.sampleRate;

        var length;

        // Attack
        length = Math.pow(this.voice.EGpos[i][0].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        tg.eg[i].EGseg_length[0] = length;
        tg.eg[i].EGseg_step[0] = (1.0 - this.voice.EGpos[i][0].y) / length;

        // Decay
        length = Math.pow(this.voice.EGpos[i][1].x - this.voice.EGpos[i][0].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        tg.eg[i].EGseg_length[1] = length;
        tg.eg[i].EGseg_step[1] = -1 * (this.voice.EGpos[i][1].y - this.voice.EGpos[i][0].y) / length;

        // Release
        length = Math.pow(1.0 - this.voice.EGpos[i][2].x, 2) * EG_TOTAL_TIME;
        if (length == 0) {
            length = 1;
        }
        tg.eg[i].EGseg_length[2] = length;
        tg.eg[i].EGseg_step[2] = -1 * (1.0 - this.voice.EGpos[i][2].y) / length;

        tg.freq[i] = this.calcFreq(i);
        tg.fixed[i] = this.voice.fixed[i];
        tg.velsens[i] = this.voice.velsens[i];
        tg.eg[i].loop = this.voice.egloop[i];

		(function() {
			var _i = i;
			var self = this;
			tg.eg[_i].onUpdateSegment = function(segment) {
				self.theEGView[_i].draw(segment);
			};
		}).bind(this)();
    }

    tg.feedback = this.voice.feedback;
    tg.changeAlgorithm(this.voice.algorithm);

    tg.noteOn(noteNo, velocity);
	
	var channelInfo = new ChannelInfo();
	channelInfo.tg = tg;
	channelInfo.scriptProcessor = scriptProcessor;
	channelInfo.noteNo = noteNo;

	this.channelTable.push(channelInfo);
};

Application.prototype.noteOff = function(noteNo) {
	var foundIndex = -1;
	for (var i = 0; i < this.channelTable.length; i++) {
		var info = this.channelTable[i];
		if (info.noteNo == noteNo) {
			foundIndex = i;
			break;
		}
	}
	
	if (foundIndex != -1) {
		var info = this.channelTable[foundIndex];
		info.noteNo = -1;
		info.tg.noteOff(noteNo);
		info.tg.onAllEGStopped = function() {
			info.scriptProcessor.disconnect();
			var i = this.channelTable.indexOf(info);
			this.channelTable.splice(i, 1);
		}.bind(this);
	}
};

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
};

Application.prototype.onload = function() {
    var self = this;
    this.theAlgView = new AlgView(document.getElementById('canvas_ALG'));
    this.theAlgView.onChangeAlgorithm = function(algNo) {
        self.voice.algorithm = algNo;
    };
    this.theAlgView.onChangeOperator = function(opNo) {
        self.updateView();
    };

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
    }

    this.theFaderView_coarse = new FaderView(document.getElementById('knob_coarse'), 100 /* height */);
    this.theFaderView_coarse.onUpdateValue = function(value) {
        var op = self.theAlgView.op;
        self.voice.coarse[op] = value;

        self.updateView();
    };

    this.theFaderView_fine = new FaderView(document.getElementById('knob_fine'), 100);
    this.theFaderView_fine.onUpdateValue = function(value) {
        var op = self.theAlgView.op;
        self.voice.fine[op] = value;

        self.updateView();
    };

    this.theFaderView_feedback = new FaderView(document.getElementById('knob_feedback'), 100);
    this.theFaderView_feedback.onUpdateValue = function(value) {
        self.voice.feedback = value;

        self.updateView();
    };

    this.theFaderView_velocity = new FaderView(document.getElementById('knob_velocity'), 72);
    this.theFaderView_velocity.onUpdateValue = function(value) {
        self.velocity = value;
        for (var i = 0; i < 4; i++) {
            if (self.voice.velsens[i] == true) {
                self.theEGView[i].setHeightScale(value);
            }
        }
    };

    this.theSpectrumView = new SpectrumView(document.getElementById('canvas_SPECTRUM'));
    this.theSpectrumView.fftSize = this.analyzer.frequencyBinCount;

    var self = this;
    this.theSpectrumView.feedFrequencyData = function (data) {
        self.analyzer.getByteFrequencyData(data);
    };

    this.theSpectrumView.animationLoop();

    if (this.isUserVoiceAvailable()) {
        this.programNo = 0;
    }

    this.recallPresetVoice(this.programNo);
    this.updateView();


    // Setup MIDI I/O
    if (window.navigator.requestMIDIAccess) {
    	window.navigator.requestMIDIAccess().then( success, function() { alert("requestMIDIAccess() failed."); });
    }

    function success(access) {
    	var inputs;
        if (typeof access.inputs === "function") {
        	inputs = access.inputs();
      	} else {
      		var inputIterator = access.inputs.values();
      		inputs = [];
      		for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
      			inputs.push(o.value);
      		}
      	}
        
        for (var port = 0; port < inputs.length; port++) {
            inputs[port].onmidimessage = function (event) {
				var status = event.data[0] & 0xF0;
				var noteNo = event.data[1];
				var velocity = event.data[2];
				if (status == 0x90) {
					self.noteOn(noteNo, velocity / 127);
				} else if (status == 0x80) {
					self.noteOff(noteNo);
				}
			};
        }

        self.MIDIinputs = inputs;
    }
};

Application.prototype.recallPresetVoice = function(no) {
    if (no == 0 && this.isUserVoiceAvailable()) {
        this.voice.recallVoiceParam(location.href);
    } else if (1 <= no && no <= this.presetVoiceBank.numOfPresets()) {
        this.voice.recallVoiceParam(this.presetVoiceBank.presetVoiceURL(no - 1));
    }

    this.updateView();
};

Application.prototype.isUserVoiceAvailable = function() {
    var param = new parseUri(location.href);
    if (param.queryKey['v']) {
        return true;
    }

    return false;
};

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
        var mouseX1 = e.offsetX;
        var mouseY1 = e.offsetY;

        var i = getNoteTableIndexFromPos(mouseX1, mouseY1);
        var noteNo = noteTable[i].noteNo;

        p.noteOn(noteNo, p.velocity);
		this.latestNoteNo = noteNo;

        $("#keymask").css("left", noteTable[i].x).width(noteTable[i].w).height(noteTable[i].h).show();
    });

    $("#keyboard").mouseup(function(e) {
        var noteNo = this.latestNoteNo;

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

    if (typeof(window.AudioContext) == "undefined") {
        $("#webaudioalert").show();
    }

    p.onload();
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var p = new Application();
