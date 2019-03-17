import AbstractSpirit from "./AbstractSpirit.js";

export default class TestCircleSpirit extends AbstractSpirit {
    constructor(p) {
        super(p);
        this.color = p['color'] || 'white';
    }

    drawSelf(ctx) {
        ctx.drawCircle(this.width / 2, this.width / 2, this.width / 2, this.color);
        ctx.beginPath();
        ctx.moveTo(this.width / 2, this.width / 2);
        ctx.lineTo(this.width, this.width / 2)
        ctx.strokeStyle = 'white';
        ctx.stroke();
        // let m = this.getTransformMatrix();
        //
        // if (this.physicsModel) {
        //     ctx.beginPath();
        //     let vertices = this.physicsModel.originalVertices;
        //     ctx.moveTo(vertices[0].x, vertices[0].y);
        //     for (let i = 1; i < vertices.length; i++) {
        //         let ver = vertices[i];
        //         ctx.lineTo(ver.x, ver.y);
        //     }
        //     ctx.closePath();
        //     ctx.fillStyle = this.color;
        //     ctx.fill();
        // } else {
        //     ctx.drawCircle(this.width / 2, this.width / 2, this.width / 2, this.color);
        // }
    }
}