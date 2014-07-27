var FaderView = function(elementToDrag, height) {
    this.elementToDrag = elementToDrag;

    var _this = this;
    this.elementToDrag.addEventListener("mousedown", function(event) { _this.downHandler(event); }, false);
    document.addEventListener("mousemove", function(event) { _this.moveHandler(event); }, false);
    document.addEventListener("mouseup", function(event) { _this.upHandler(event); }, false);

    this.deltaY = 0;
    this.topY = elementToDrag.offsetTop - height;
    this.bottomY = elementToDrag.offsetTop;

    this.onUpdateValue = function(value) {};
    this.value = 0;

    this.isDragged = false;
};

FaderView.prototype = {
    setValue : function(value) {
        this.value = value;
        this.elementToDrag.style.top = this.bottomY - (this.bottomY - this.topY) * this.value + "px";
    },

    downHandler : function(e) {
        var startY = e.clientY;
        var origY = this.elementToDrag.offsetTop;
        this.deltaY = startY - origY;

        this.isDragged = true;
    },

    moveHandler : function(e) {
        if (this.isDragged == false) {
            return;
        }

        var newY = (e.clientY - this.deltaY);

        if (newY < this.topY) {
            newY = this.topY;
        }

        if (newY > this.bottomY) {
            newY = this.bottomY;
        }

        this.elementToDrag.style.top = newY + "px";

        // 更新値を計算
        this.value = (newY - this.bottomY) / (this.topY - this.bottomY);
        this.onUpdateValue(this.value);
    },

    upHandler : function(e) {
        if (this.isDragged == false) {
            return;
        }

        this.isDragged = false;
    }
};

