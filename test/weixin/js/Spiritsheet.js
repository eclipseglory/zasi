import BaseExample from "./BaseExample.js";

export default class Spiritsheet extends BaseExample {
    constructor(c) {
        super(c);
    }


    run(imageBasePath) {
        imageBasePath = imageBasePath || '';
        let filter = 0;
        this.ontouch = function (evt) {
            spirit.opacity = 1;
            filter++;
            if (filter > 12) filter = 0;
            spirit.filter = filter;
            if (spirit.currentSheetAnimation.key !== 'boom') {
                spirit.playSheetAnimation('boom', {
                    complete: function () {
                    }
                });
            } else {
                // if (spirit.paused) {
                //     spirit.startMove();
                // } else {
                //     spirit.pauseMove();
                // }
                if (spirit.currentSheetAnimationPaused) {
                    spirit.playCurrentSheetAnimation();
                } else {
                    spirit.pauseCurrentSheetAnimation();
                }
            }
        }
        let webgl = this.canvas;
        let graph = new zasi.Graph(webgl);
        let min = Math.min(webgl.width, webgl.height);
        let w = min / 2;
        let h = w;
        let spirit = new zasi.spirit.Spirit({
            x: (webgl.width - w) / 2,
            y: (webgl.height - h) / 2,
            width: w,
            height: h,
            angularVelocity: 0.01
        });
        graph.loadImage('boom', imageBasePath + 'images/fire_001.png', {
            success: function (texture) {
                spirit.texture = texture;
                spirit.addSheetAnimation({
                    time: 1000,
                    start: 0,
                    end: 19,
                    loop: true,
                    key: 'boom'
                });
            }
        }, {row: 4, column: 5});
        spirit.startMove();
        graph.addChild(spirit);
        graph.startLoopRefresh();
    }
}


