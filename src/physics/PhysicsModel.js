/**
 * 包含有边，以及边的法向量，质量，转动官能等以及模型类型（多边形或圆形）
 */
import GeometryTools from "../geometry/GeometryTools.js";
import Tools from "../utils/Tools.js";

const POLYGON_TYPE = 0;
const ELLIPSE_TYPE = 1;
const TEMP_VERTEX = [0, 0, 1];
export default class PhysicsModel {
    constructor(p) {
        p = p || {};
        this.type = p['type'] || POLYGON_TYPE;
        this.axis = [];
        this.vertices = null;
        this.radiusX = null;
        this.radiusY = null;
        this.originalVertices = [];
        this.originalAxis = [];
        this.originalCenter = null;
        this.center = null;
        this._mass = 1;
        this.inertia;
        if (p['friction'] != undefined) {
            this.friction = p['friction'];
        } else {
            this.friction = 1;
        }
        if (p['elastic'] != undefined) {
            this.elastic = p['elastic'];
        } else {
            this.elastic = 0;
        }
    }

    static get POLYGON_TYPE() {
        return POLYGON_TYPE;
    }

    static get ELLIPSE_TYPE() {
        return ELLIPSE_TYPE;
    }

    get mass() {
        return this._mass;
    }

    set mass(m) {
        this._mass = m;
    }

    get momentInertia() {
        if (this.mass == Infinity) return Infinity;
        if (this.inertia == undefined) {
            if (this.type == POLYGON_TYPE) {
                let numerator = 0;
                let denominator = 0;
                let v = this.vertices;
                for (let n = 0; n < v.length; n++) {
                    let j = (n + 1) % v.length;
                    let cross = Math.abs(tielifa.Vector2.cross(v[j], v[n]));
                    numerator += cross * (tielifa.Vector2.dot(v[j], v[j]) + tielifa.Vector2.dot(v[j], v[n]) + tielifa.Vector2.dot(v[n], v[n]));
                    denominator += cross;
                }
                if (denominator == 0) {
                    return 1;
                }
                this.inertia = (this.mass / 6) * (numerator / denominator);
            } else if (this.type == ELLIPSE_TYPE) {
                this.inertia = this.mass * (this.radiusX * this.radiusX + this.radiusY * this.radiusY) / 4;
            }
        }
        return this.inertia;
    }

    static createEllipseModel(figure, property) {
        let m = new PhysicsModel(property);
        m.generateModel({radiusX: figure.width/2, radiusY: figure.height/2}, figure.center, figure.mass);
        return m;
    }

    static createDefaultModel(figure, property) {
        let m = new PhysicsModel(property);
        let vertices = [];
        vertices.push({x: 0, y: 0});
        vertices.push({x: figure.width, y: 0});
        vertices.push({x: figure.width, y: figure.height});
        vertices.push({x: 0, y: figure.height});
        m.generateModel(vertices, figure.center, figure.mass);
        return m;
    }

    static createRegularTriangleModel(figure, property) {
        let m = new PhysicsModel(property);
        let vertices = [];
        vertices.push({x: figure.width / 2, y: 0});
        vertices.push({x: 0, y: figure.height});
        vertices.push({x: figure.width, y: figure.height});
        m.generateModel(vertices, figure.center, figure.mass);
        return m;
    }

    static createRegularHexagonModel(figure, property) {
        let m = new PhysicsModel(property);
        let vertices = [];
        vertices.push({x: figure.width / 3, y: 0});
        vertices.push({x: figure.width / 3 * 2, y: 0});
        vertices.push({x: figure.width, y: figure.height / 2});
        vertices.push({x: figure.width / 3 * 2, y: figure.height});
        vertices.push({x: figure.width / 3, y: figure.height});
        vertices.push({x: 0, y: figure.height / 2});
        m.generateModel(vertices, figure.center, figure.mass);
        return m;
    }

    generateModel(shapeInfor, center, mass) {
        if (shapeInfor instanceof Array) {
            this.type = POLYGON_TYPE;
            this.vertices = shapeInfor;
            GeometryTools.getAxis(this.vertices, this.axis);
            for (let i = 0; i < this.vertices.length; i++) {
                let vertex = this.vertices[i];
                this.originalVertices.push({x: vertex.x, y: vertex.y});
            }
            for (let i = 0; i < this.axis.length; i++) {
                let a = this.axis[i];
                this.originalAxis.push(new tielifa.Vector2(a.x, a.y));
            }
            this.center = {x: center.x, y: center.y};
            this.originalCenter = {x: center.x, y: center.y};
        } else {
            this.type = ELLIPSE_TYPE;
            this.center = {x: center.x, y: center.y};
            this.originalCenter = {x: center.x, y: center.y};
            this.radiusX = shapeInfor.radiusX;
            this.radiusY = shapeInfor.radiusY;
        }
        this.mass = mass;
        this.momentInertia;
    }

    applyCurrentTransform(rotate, matrix) {

        let tempVertex = TEMP_VERTEX;

        let m = tielifa.Mat3.TEMP_MAT3[0];
        m[0] = matrix[0];
        m[1] = matrix[1];
        m[2] = 0;
        m[3] = matrix[4];
        m[4] = matrix[5];
        m[5] = 0;
        m[6] = matrix[12];
        m[7] = matrix[13];
        m[8] = 1;

        if (this.type === POLYGON_TYPE) {
            if (!Math.abs(rotate) < 0.0000001) {
                for (let i = 0; i < this.axis.length; i++) {
                    let a = this.axis[i];
                    let oa = this.originalAxis[i];
                    tielifa.Vector2.rotate(a, oa, rotate * Tools.PIDIV180);
                }
            }

            for (let i = 0; i < this.originalVertices.length; i++) {
                let vertex = this.originalVertices[i];
                tielifa.Mat3.multiplyWithVertex(tempVertex, m, [vertex.x, vertex.y, 1]);
                this.vertices[i].x = tempVertex[0];
                this.vertices[i].y = tempVertex[1];
            }
        } else if (this.type === ELLIPSE_TYPE) {
            // TODO 计算圆形是否被拉伸，重置半径
        }


        tielifa.Mat3.multiplyWithVertex(tempVertex, m, [this.originalCenter.x, this.originalCenter.y, 1]);
        this.center.x = tempVertex[0];
        this.center.y = tempVertex[1];
    }
}