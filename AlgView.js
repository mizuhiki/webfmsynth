function pos(x, y)
{
    this.x = x;
    this.y = y;
}

var OpConnection = [
    [
      // OP1 OP2 OP3 OP4 = MOD
        [  0,  1,  0,  0 ], // OP1
        [  0,  0,  1,  0 ], // OP2
        [  0,  0,  0,  1 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  1,  0,  0,  0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  1,  0,  0 ], // OP1
        [  0,  0,  1,  1 ], // OP2
        [  0,  0,  0,  0 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  1,  0,  0,  0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  1,  0,  1 ], // OP1
        [  0,  0,  1,  0 ], // OP2
        [  0,  0,  0,  0 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  1,  0,  0,  0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  1,  1,  0 ], // OP1
        [  0,  0,  0,  0 ], // OP2
        [  0,  0,  0,  1 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  1,  0,  0,  0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  1,  0,  0 ], // OP1
        [  0,  0,  0,  0 ], // OP2
        [  0,  0,  0,  1 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  0.5, 0, 0.5, 0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  0,  0,  1 ], // OP1
        [  0,  0,  0,  1 ], // OP2
        [  0,  0,  0,  1 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  0.33, 0.33, 0.33, 0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  0,  0,  0 ], // OP1
        [  0,  0,  0,  0 ], // OP2
        [  0,  0,  0,  1 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  0.33, 0.33, 0.33, 0 ], // carrier
    ],
    [
      // OP1 OP2 OP3 OP4
        [  0,  0,  0,  0 ], // OP1
        [  0,  0,  0,  0 ], // OP2
        [  0,  0,  0,  0 ], // OP3
        [  0,  0,  0,  0 ], // OP4
        [  0.25,  0.25,  0.25,  0.25 ], // carrier
    ],
];


var AlgPos = [
    [
        new pos( 64 / 128.0, 100 / 128.0),
        new pos( 64 / 128.0,  75 / 128.0),
        new pos( 64 / 128.0,  50 / 128.0),
        new pos( 64 / 128.0,  25 / 128.0),
    ],
    [
        new pos( 64 / 128.0,  90 / 128.0),
        new pos( 64 / 128.0,  60 / 128.0),
        new pos( 44 / 128.0,  30 / 128.0),
        new pos( 84 / 128.0,  30 / 128.0),
    ],
    [
        new pos( 64 / 128.0,  90 / 128.0),
        new pos( 44 / 128.0,  60 / 128.0),
        new pos( 44 / 128.0,  30 / 128.0),
        new pos( 84 / 128.0,  60 / 128.0),
    ],
    [
        new pos( 64 / 128.0,  90 / 128.0),
        new pos( 44 / 128.0,  60 / 128.0),
        new pos( 84 / 128.0,  60 / 128.0),
        new pos( 84 / 128.0,  30 / 128.0),
    ],
    [
        new pos( 39 / 128.0,  80 / 128.0),
        new pos( 39 / 128.0,  40 / 128.0),
        new pos( 89 / 128.0,  80 / 128.0),
        new pos( 89 / 128.0,  40 / 128.0),
    ],
    [
        new pos( 29 / 128.0,  80 / 128.0),
        new pos( 64 / 128.0,  80 / 128.0),
        new pos( 99 / 128.0,  80 / 128.0),
        new pos( 64 / 128.0,  40 / 128.0),
    ],
    [
        new pos( 29 / 128.0,  80 / 128.0),
        new pos( 64 / 128.0,  80 / 128.0),
        new pos( 99 / 128.0,  80 / 128.0),
        new pos( 99 / 128.0,  40 / 128.0),
    ],
    [
        new pos( 22 / 128.0,  64 / 128.0),
        new pos( 50 / 128.0,  64 / 128.0),
        new pos( 78 / 128.0,  64 / 128.0),
        new pos(106 / 128.0,  64 / 128.0),
    ],
];

var AlgView = function(canvas)
{
    this.alg = 0;
    this.op = 0;

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    var _this = this;
    this.canvas.addEventListener("mouseup", function(event) { _this.mouseUpListener(event); }, false);

    this.onChangeAlgorithm = function(algNo) {};
    this.onChangeOperator = function(opNo) {};

    this.draw();
};

AlgView.prototype = {
    setOperator : function(op) {
        this.op = op;
        this.draw();
        this.onChangeOperator(op);
    },

    setAlgorithm : function(alg) {
        this.alg = alg;
        this.draw();
        this.onChangeAlgorithm(alg);
    },

    draw : function() {
        var canvas = this.canvas;
        var ctx = this.ctx;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // drawing lines connecting between operator boxes
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.beginPath();
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                if (OpConnection[this.alg][i][j] > 0) {
                    ctx.moveTo(AlgPos[this.alg][i].x * canvas.width, AlgPos[this.alg][i].y * canvas.height);
                    ctx.lineTo(AlgPos[this.alg][j].x * canvas.width, AlgPos[this.alg][j].y * canvas.height);
                }
            }
        }

        var min_x = canvas.width;
        var max_x = 0;
        var max_y = 0;

        for (var i = 0; i < 4; i++) {
            if (OpConnection[this.alg][4][i] > 0) {
                var x = AlgPos[this.alg][i].x * canvas.width;
                var y = AlgPos[this.alg][i].y * canvas.height;

                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 15);

                if (min_x > x) {
                    min_x = x;
                }

                if (max_x < x) {
                    max_x = x;
                }

                if (max_y < y + 15) {
                    max_y = y + 15;
                }
            }
        }

        ctx.moveTo(min_x, max_y);
        ctx.lineTo(max_x, max_y);

        var center_x = (min_x + max_x) / 2;
        ctx.moveTo(center_x, max_y);
        ctx.lineTo(center_x, max_y + 5);

        // feedback
        var op1x = AlgPos[this.alg][3].x * canvas.width;
        var op1y = AlgPos[this.alg][3].y * canvas.height;
        ctx.moveTo(op1x     , op1y     );
        ctx.lineTo(op1x + 15, op1y     );
        ctx.lineTo(op1x + 15, op1y - 15);
        ctx.lineTo(op1x     , op1y - 15);
        ctx.lineTo(op1x     , op1y     )

        ctx.lineWidth = 1.0;
        ctx.stroke();

        // drawing operator boxes
        for (var i = 0; i < 4; i++) {
            if (i == this.op) {
                ctx.fillStyle = "rgb(255, 128, 128)";
            } else {
                ctx.fillStyle = "rgb(255, 255, 255)";
            }

            ctx.beginPath();
            ctx.rect(AlgPos[this.alg][i].x * canvas.width - 10, AlgPos[this.alg][i].y * canvas.height - 10, 20, 20);
            ctx.fill();
        }

        ctx.font = "15px Arial";
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.beginPath();

        for (var i = 0; i < 4; i++) {
            ctx.fillText(i + 1, AlgPos[this.alg][i].x * canvas.width - 4, AlgPos[this.alg][i].y * canvas.height + 6);
        }

        ctx.fill();
    },

    mouseUpListener : function(e) {
        var rect = e.target.getBoundingClientRect();
        var canvas = e.target;

        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;

        for (var i = 0; i < 4; i++) {
            var x = AlgPos[this.alg][i].x * canvas.width;
            var y = AlgPos[this.alg][i].y * canvas.height;
            if (x - 10 < mouseX && mouseX < x + 10 && y - 10 < mouseY && mouseY < y + 10) {
                this.op = i;
                this.draw();
                this.onChangeOperator(this.op);
                break;
            }
        }

        if (canvas.height * 0.8 < mouseY) {
            if (mouseX < canvas.width / 2) {
                if (this.alg > 0) {
                    this.alg--;
                    this.onChangeAlgorithm(this.alg);
                }
            } else {
                if (this.alg < 7) {
                    this.alg++;
                    this.onChangeAlgorithm(this.alg);
                }
            }
        }

        this.draw();
    }
};

