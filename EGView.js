function pos(x, y)
{
    this.x = x;
    this.y = y;
}

var EGView = function(canvas)
{
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.EGpos = [
            new pos(0.05, 0.0),
            new pos(0.3, 0.5),
            new pos(0.9, 0.5),
        ];

    this.dragSegIdx = -1;

    var _this = this;
    canvas.addEventListener("mousedown", function (event) { _this.mouseDownListener(event); }, false);
    canvas.addEventListener("mousemove", function (event) { _this.mouseMoveListener(event); }, false);
    canvas.addEventListener("mouseup",   function (event) { _this.mouseUpListener(event); },   false);
    canvas.addEventListener("mouseout",  function (event) { _this.mouseUpListener(event); },   false);

    this.onMouseDown = 0;
    this.onUpdateEGpos = 0;
    this.opNo = 0;

    this.heightScale = 1.0;

    this.draw(-1);
};

EGView.prototype = {
    setEGpos : function (EGpos) {
        this.EGpos = EGpos;
        this.draw(-1);
    },

    setHeightScale : function(scale) {
        this.heightScale = scale;
        this.draw(-1);
    },

    draw : function (stage) {
        var canvas = this.canvas;
        var ctx = this.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var offsetY = canvas.height * (1.0 - this.heightScale);

        if (this.heightScale < 1.0) {
            ctx.beginPath();
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.moveTo(0, offsetY);
            ctx.lineTo(canvas.width, offsetY);
            ctx.lineWidth = 2.0;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width * this.EGpos[0].x, offsetY + this.heightScale * canvas.height * this.EGpos[0].y);
        ctx.lineTo(canvas.width * this.EGpos[1].x, offsetY + this.heightScale * canvas.height * this.EGpos[1].y);
        ctx.lineTo(canvas.width * this.EGpos[2].x, offsetY + this.heightScale * canvas.height * this.EGpos[2].y);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.beginPath();
        ctx.rect(canvas.width * this.EGpos[0].x - 5, offsetY + this.heightScale * canvas.height * this.EGpos[0].y - 5, 10, 10);
        ctx.rect(canvas.width * this.EGpos[1].x - 5, offsetY + this.heightScale * canvas.height * this.EGpos[1].y - 5, 10, 10);
        ctx.rect(canvas.width * this.EGpos[2].x - 5, offsetY + this.heightScale * canvas.height * this.EGpos[2].y - 5, 10, 10);
        ctx.fill();

        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.globalAlpha = 0.4;

        switch (stage) {
            case 0:
                ctx.fillRect(0, 0, canvas.width * this.EGpos[0].x, canvas.height);
                break;

            case 1:
                ctx.fillRect(canvas.width * this.EGpos[0].x, 0, canvas.width * (this.EGpos[1].x - this.EGpos[0].x), canvas.height);
                break;

            case 2:
                ctx.fillRect(canvas.width * this.EGpos[1].x, 0, canvas.width * (this.EGpos[2].x - this.EGpos[1].x), canvas.height);
                break;

            case 3:
                ctx.fillRect(canvas.width * this.EGpos[2].x, 0, canvas.width, canvas.height);
                break;

            default:
                break;
        }

    },

    mouseDownListener : function(e) {
        var rect = e.target.getBoundingClientRect();
        var canvas = e.target;

        var mouseX1 = e.clientX - rect.left;
        var mouseY1 = e.clientY - rect.top;

        var offsetY = canvas.height * (1.0 - this.heightScale);

        this.dragSegIdx = -1;
        for (var i = 0; i < this.EGpos.length; i++) {
            if (mouseX1 > canvas.width  * this.EGpos[i].x - 20 && mouseX1 < canvas.width  * this.EGpos[i].x + 20 &&
                mouseY1 > offsetY + this.heightScale * canvas.height * this.EGpos[i].y - 20 &&
                mouseY1 < offsetY + this.heightScale * canvas.height * this.EGpos[i].y + 20) {
                this.dragSegIdx = i;
                break;
               }
        }

        this.onMouseDown(this.opNo);
    },

    mouseMoveListener : function(e) {
        if (this.dragSegIdx >= 0) {
            var rect = e.target.getBoundingClientRect();
            var canvas = e.target;

            var mouseX2 = e.clientX - rect.left;
            var mouseY2 = e.clientY - rect.top;

            if (mouseX2 < 0) {
                mouseX2 = 0;
            }

            if (mouseX2 > canvas.width) {
                mouseX2 = canvas.width;
            }

            var offsetY = canvas.height * (1.0 - this.heightScale);

            if (mouseY2 < offsetY) {
                mouseY2 = offsetY;
            }

            if (mouseY2 > canvas.height) {
                mouseY2 = canvas.height;
            }

            this.EGpos[this.dragSegIdx].x = mouseX2 / canvas.width;

            this.EGpos[this.dragSegIdx].y = (mouseY2 - offsetY) / (canvas.height * this.heightScale);

            switch (this.dragSegIdx) {
                case 0:
                    if (this.EGpos[0].x > this.EGpos[1].x) {
                        this.EGpos[0].x = this.EGpos[1].x;
                    }
                    break;

                case 1:
                    if (this.EGpos[1].x > this.EGpos[2].x) {
                        this.EGpos[1].x = this.EGpos[2].x;
                    }

                    if (this.EGpos[1].x < this.EGpos[0].x) {
                        this.EGpos[1].x = this.EGpos[0].x;
                    }

                    this.EGpos[2].y = this.EGpos[1].y;

                    break;

                case 2:
                    if (this.EGpos[2].x < this.EGpos[1].x) {
                        this.EGpos[2].x = this.EGpos[1].x;
                    }

                    this.EGpos[1].y = this.EGpos[2].y;

                    break;
            }

            this.draw(-1);
        }
    },

    mouseUpListener : function(e) {
        var rect = e.target.getBoundingClientRect();

        if (this.dragSegIdx >= 0) {
            this.dragEnd();
        }
    },

    dragEnd : function() {
        this.dragSegIdx = -1;
        this.onUpdateEGpos(this.opNo, this.EGpos);
    }

};


