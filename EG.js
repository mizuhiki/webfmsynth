var EGPhase = {
    Stop    : 0,
    Attack  : 1,
    Decay   : 2,
    Sustain : 3,
    Release : 4,
    Dump    : 5
};

var EG = function() {
    this.amp = 0.0;
    this.state = EGPhase.Stop;
    this.loop = false;

    this.curEGseg_step = 0.0;
    this.curEGseg_length = 0;

    this.EGseg_step = new Array(3);
    this.EGseg_length = new Array(3);

    this.onUpdateSegment = null;
    
    this.onEGStopped = null;
};

EG.prototype.note_on = function() {
    if (this.state != EGPhase.Stop) {
        this.state = EGPhase.Dump;
        this.curEGseg_length = 128;
        this.curEGseg_step = -1 * this.amp / this.curEGseg_length;
    } else {
        this.amp = 0.0;
        this.state = EGPhase.Attack;
        this.curEGseg_step = this.EGseg_step[0];
        this.curEGseg_length = this.EGseg_length[0];
        this.onUpdateSegment(0);
    }
};

EG.prototype.note_off = function() {
    if (this.state != EGPhase.Stop) {
        this.state = EGPhase.Release;
        this.curEGseg_step = -1 * this.amp / this.EGseg_length[2];
        this.curEGseg_length = this.EGseg_length[2];
        this.onUpdateSegment(3);
    }
};

EG.prototype.next = function() {
    if (this.curEGseg_length <= 0) {
        return;
    }

    this.amp += this.curEGseg_step;
    if (this.amp > 1.0) {
        this.amp = 1.0;
    }
    this.curEGseg_length--;

    if (this.curEGseg_length <= 0) {
        switch (this.state) {
        case EGPhase.Dump:
            this.state = EGPhase.Attack;
            this.curEGseg_step = this.EGseg_step[0];
            this.curEGseg_length = this.EGseg_length[0];
            this.amp = 0.0;
	        this.onUpdateSegment(0);
            break;

        case EGPhase.Attack:
            this.state = EGPhase.Decay;
            this.curEGseg_step = this.EGseg_step[1];
            this.curEGseg_length = this.EGseg_length[1];
	        this.onUpdateSegment(1);
            break;

        case EGPhase.Decay:
            if (this.loop == false) {
                this.state = EGPhase.Sustain;
                this.curEGseg_step = 0.0;
                this.curEGseg_length = 0;
		        this.onUpdateSegment(2);
            } else {
                this.state = EGPhase.Attack;
                this.curEGseg_step = this.EGseg_step[0];
                this.curEGseg_length = this.EGseg_length[0];
                this.amp = 0.0;
		        this.onUpdateSegment(0);
            }
            break;

        case EGPhase.Release:
            this.state = EGPhase.Stop;
            this.amp = 0.0;
	        this.onUpdateSegment(-1);
            if (this.onEGStopped != null) {
            	this.onEGStopped();
            }
            break;
        }
    }
};

