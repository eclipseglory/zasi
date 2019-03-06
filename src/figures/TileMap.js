import Figure from "../Figure.js";
import PhysicsModel from "../physics/PhysicsModel.js";
import AbstractSpirit from "../spirit/AbstractSpirit.js";

let _data = Symbol('地图数据');
export default class TileMap extends Figure {
    constructor(p) {
        p = p || {};
        super(p);
        this.row = p['row'] || 1;
        this.column = p['column'] || 1;
        this.data = p['data'];
    }

    createDummyFigures() {
        if (this.data != null) {
            let tileSize = this.width / this.data.column;
            let  tested = false
            for (let i = 0; i < this.row; i++) {
                for (let j = 0; j < this.column; j++) {
                    let data = this.data.datas[i][j];
                    if (data != undefined && data.physicsModel != null) {
                        let vertices = data.physicsModel.vertices;
                        if (vertices != null) {
                            let f = new AbstractSpirit({
                                x: j * tileSize,
                                y: i * tileSize,
                                width: tileSize,
                                height: tileSize,
                                mass: Infinity,
                                visible:false
                            });
                            // f.visible = false;
                            let realVertices = [];
                            let left = undefined;
                            let top = undefined;
                            let right = undefined;
                            let bottom = undefined;
                            for (let k = 0; k < vertices.length; k++) {
                                let v = vertices[k];
                                    let rv = {x: v.x * tileSize, y: v.y * tileSize};
                                if (left == undefined) left = rv.x; else left = Math.min(rv.x, left);
                                if (top == undefined) top = rv.y; else top = Math.min(rv.y, top);
                                if (right == undefined) right = rv.x; else right = Math.max(rv.x, right);
                                if (bottom == undefined) bottom = rv.x; else bottom = Math.max(rv.y, bottom);
                                realVertices.push({x: v.x * tileSize, y: v.y * tileSize});
                            }
                            console.log(realVertices);
                            f.width = right - left;
                            f.height = bottom - top;
                            let pm = new PhysicsModel();
                            pm.generateModel(realVertices, {x: f.center.x, y: f.center.y}, f.mass);
                            f.physicsModel = pm;
                            this.addChild(f);
                        }
                    }
                }
            }
        }
    }

    set data(d) {
        this[_data] = d;
        if (d == undefined) {
            let temp = [];
            let length = this.childrenSize;
            for (let i = 0; i < length; i++) {
                let end = this.childrenSize;
                this.removeChild(this.getChild(end - 1));
            }
            this.row = 1;
            this.column = 1;
        } else {
            this.row = d.row;
            this.column = d.column;
            this.createDummyFigures();
        }
    }

    get data() {
        return this[_data];
    }

    fitWidth(width) {
        if (width == undefined) width = this.width;
        this.width = width;
        let size = width / this.column;
        this.height = size * this.row;
    }

    fitHeight(height) {
        if (height == undefined) height = this.height;
        this.height = height;
        let size = height / this.row;
        this.width = size * this.column;
    }

    alignV(align) {
        if (align == 'top') {
            this.y = 0;
        } else if (align == 'middle') {
            let graph = this.getGraph();
            this.y = (graph.height - this.height) / 2;
        } else if (align == 'bottom') {
            let graph = this.getGraph();
            this.y = graph.height - this.height;
        }
    }

    alignH(align) {
        if (align == 'left') {
            this.x = 0;
        } else if (align == 'middle') {
            let graph = this.getGraph();
            this.x = (graph.width - this.width) / 2;
        } else if (align == 'right') {
            let graph = this.getGraph();
            this.x = graph.width - this.width;
        }
    }

    drawSelf(ctx) {
        if (this.data == undefined) return;
        let tileSize = this.width / this.data.column;
        let texture = ctx.getTexture(this.data.textureId);
        if (texture == null) return;
        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.column; j++) {
                let data = this.data.datas[i][j];
                if (data != undefined && texture != undefined)
                    ctx.drawImage(texture, data.x, data.y, data.width, data.height,
                        j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }
}