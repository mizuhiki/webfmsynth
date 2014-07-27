var SpectrumView = function(canvas)
{
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fftSize;
    this.feedFrequencyData = function (data) {};

    window.requestAnimationFrame = (function(){
        return window.requestAnimationFrame     ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            window.oRequestAnimationFrame       ||
            window.msRequestAnimationFrame      ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
        })();
};

SpectrumView.prototype = {
    /**
    * ele canvas HTML Element
    * ctx canvas context 2d
    * data Time Damain Data
    */
    render : function(ele, ctx, data) {
        ctx.clearRect(0, 0, ele.width, ele.height);

        var value;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(98, 149, 211, 0.5)';
        for (var i = 0; i < data.length; ++i){
            value = 1.0 - (parseInt(data[i]) / 256);
            ctx.moveTo(i, ele.height);
            ctx.lineTo(i, value * ele.height);
        }
        ctx.closePath();
        ctx.stroke();
    },

    animationLoop : function(){
        var data = new Uint8Array(this.fftSize);
        this.feedFrequencyData(data);
        this.render(this.canvas, this.ctx, data);

        var self = this;
        requestAnimationFrame(function () { self.animationLoop() });
    },
};

