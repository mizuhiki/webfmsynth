var FMToneGenerator = function() {
    this.sampleRate = 0;
    this.algorithm = 0;

    this.phaseIncrement = new Array(4);
    this.fixed = new Array(4);
    this.freq = new Array(4);
    this.phase = new Array(4);
    this.output = new Array(4);
    this.eg = new Array(4);
    this.velsens = new Array(4);
    this.velocity = 0.0;
    this.feedback = 0.0;

	this.egStopCount = 0;
	this.onAllEGStopped = null;

    for (var i = 0; i < 4; i++) {
        this.phaseIncrement[i] = 0.0;
        this.freq[i]  = 0.0;
        this.phase[i]  = 0.0;
        this.output[i] = 0.0;
        this.eg[i] = new EG();
        this.velsens[i] = false;
    }
};

FMToneGenerator.prototype.generateAudio = function(e) {
    var left  = e.outputBuffer.getChannelData(0);
    var right = e.outputBuffer.getChannelData(1);

    var numSamples = right.length;
    for (var i = 0; i < numSamples; i++) {
        main_output = 0;
        for (var op = 3; op >= 0; op--) {
            var mod_output = 0;
            for (var op_mod = 0; op_mod < 4; op_mod++) {
                mod_output += this.algorithm[op][op_mod] * this.output[op_mod];
            }

            mod_output *= 10;

            if (op == 3) {
                mod_output += this.output[op] * this.feedback * 3;
            }
			
            this.output[op] = Math.sin(this.phase[op] + mod_output) * this.eg[op].amp * this.eg[op].amp;
            if (this.velsens[op]) {
                this.output[op] *= this.velocity;
            }

            this.phase[op] += this.phaseIncrement[op];

            main_output += this.output[op] * this.algorithm[4][op];
        }

        right[i] = left[i] = main_output;

        for (var op = 0; op < 4; op++) {
            this.eg[op].next();
        }
    }
};

FMToneGenerator.prototype.noteOn = function(noteNo, velocity) {
    var self = this;
    function calcPhaseIncrement(freq) {
        return 2 * Math.PI * freq / self.sampleRate;
    }

    this.velocity = velocity;

    for (var i = 0; i < 4; i++) {
        if (this.fixed[i] == true) {
            this.phaseIncrement[i] = calcPhaseIncrement(this.freq[i]);
        } else {
            this.phaseIncrement[i] = calcPhaseIncrement(440 * Math.pow(2.0, (noteNo - 69) / 12.0)) * this.freq[i];
        }
        this.phase[i] = 0.0;
        this.output[i] = 0.0;
    }

    for (var i = 0; i < 4; i++) {
        this.eg[i].note_on();
    }
};

FMToneGenerator.prototype.noteOff = function(noteNo) {
    this.egStopCount = 4;
    
    for (var i = 0; i < 4; i++) {
        this.eg[i].onEGStopped = function () {
			this.egStopCount--;
			if (this.egStopCount == 0) {
				if (this.onAllEGStopped != null) {
					this.onAllEGStopped();
				}
			}        	
        }.bind(this);

        this.eg[i].note_off();
    }
};

FMToneGenerator.prototype.changeAlgorithm = function(algNo) {
    this.algorithm = OpConnection[algNo];
};

