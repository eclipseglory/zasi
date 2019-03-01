export default class BaseExample {
    constructor(c) {
        let that = this;
        this.canvas = c;
        if (typeof wx !== 'undefined') {
            wx.onTouchStart(function (evt) {
                that.ontouch(evt,evt.touches[0].x,evt.touches[0].y);
            })
        } else {
            this.canvas.onmousedown = function (evt) {
                that.ontouch(evt,evt.offsetX,evt.offsetY);
            }
        }
    }

    ontouch(evt,x,y) {

    }

    run(imageBasePath) {

    }
}