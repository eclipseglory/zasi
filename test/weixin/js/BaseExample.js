export default class BaseExample {
    constructor(c) {
        let that = this;
        this.canvas = c;
        this.canvas.oncontextmenu = function (evt) {
            return false;
        };
        if (typeof wx !== 'undefined') {
            wx.onTouchStart(function (evt) {
                that.ontouch(evt, evt.touches[0].x, evt.touches[0].y);
            });
            wx.onTouchMove(function (evt) {
                that.onmove(evt, evt.touches[0].x, evt.touches[0].y);
            });
            wx.onTouchEnd(function (evt) {
                that.ontouchend(evt, evt.touches[0].x, evt.touches[0].y);
            })
        } else {
            this.canvas.onmousedown = function (evt) {
                that.ontouch(evt, evt.offsetX, evt.offsetY);
            };
            this.canvas.onmousemove = function (evt) {
                that.onmove(evt, evt.offsetX, evt.offsetY);
            };
            this.canvas.onmouseup = function (evt) {
                that.ontouchend(evt, evt.offsetX, evt.offsetY);
            };

            this.canvas.onmouseover = function (evt) {
                that.onover(evt, evt.offsetX, evt.offsetY);
            };
        }
    }

    onover(evt, x, y) {
    }

    ontouchend(evt, x, y) {

    }

    onmove(evt, x, y) {

    }

    ontouch(evt, x, y) {

    }

    run(imageBasePath) {

    }
}