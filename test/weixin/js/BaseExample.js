export default class BaseExample {
    constructor(c) {
        let that = this;
        this.canvas = c;
        if (typeof wx !== 'undefined') {
            wx.onTouchStart(function (evt) {
                that.ontouch(evt);
            })
        } else {
            this.canvas.onmousedown = function (evt) {
                that.ontouch(evt);
            }
        }
        this.imagePath = '';
    }

    ontouch(evt) {

    }

    run(){

    }
}