import AbstractSpirit from "./AbstractSpirit.js";

export default class TestRectSpirit extends AbstractSpirit {
    constructor(p) {
        super(p);
        this.color = p['color'] || 'white';
    }

    drawSelf(ctx) {
        let m = this.getTransformMatrix();
        if (this.physicsModel) {
            ctx.beginPath();
            let vertices = this.physicsModel.originalVertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                let ver = vertices[i];
                ctx.lineTo(ver.x, ver.y);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.rect(0, 0, this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

    }
}