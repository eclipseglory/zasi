import Figure from "../Figure.js";

export default class ImageFigure extends Figure {
    constructor(properties) {
        super(properties);
        if (properties == null) properties = {};
        this.targetTop = properties['targetTop'] || 0;
        this.targetLeft = properties['targetLeft'] || 0;
        this.targetWidth = properties['targetWidth'] || 0;
        this.targetHeight = properties['targetHeight'] || 0;
        if (properties['texture']) {
            this.texture = properties['texture'];
        }
    }

    drawSelf(ctx) {
        if(this.texture == null) return;
        if (this.targetWidth == 0 || this.targetHeight == 0) {
            ctx.drawImage(this.texture, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(this.texture, this.targetLeft, this.targetTop, this.targetWidth, this.targetHeight,
                0, 0, this.width, this.height);
        }
    }
}