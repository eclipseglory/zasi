import Graph from "./Graph.js";
import LoopThreadWrapper from "./LoopThreadWrapper.js";
import AbstractSpirit from "./spirit/AbstractSpirit.js";
import UniformGrid from "./utils/UniformGrid.js";
import Tools from "./utils/Tools.js";
import SAT from "./common/SAT.js";
import RigidPhysics from "./physics/RigidPhysics.js";

export default class World extends Graph {
    constructor(canvas, p) {
        p = p || {};
        let gridRow = p['gridRow'] || 10;
        let gridColumn = p['gridColumn'] || 10;
        super(canvas);
        this._loop = new LoopThreadWrapper();
        let that = this;
        this._loop.repeat = function (refreshCount) {
            that.repeat(refreshCount);
        };
        this.p1 = undefined;
        this.p2 = undefined;
        this.collisionE = p['e'] || 1;
        this.uniformGrid = new UniformGrid(gridRow, gridColumn, this.width, this.height);
        this.showDebug = p['showDebug'] || false;
    }

    repeat(refreshCount) {
        // this.contactTest();
        this.update(this.id);
    }

    contactTest() {
        let testedFigures = [];
        for (let i = 0; i < this.childrenSize; i++) {
            let child = this.getChild(i);
            for (let j = 0; j < this.childrenSize; j++) {
                let childb = this.getChild(j);
                if (child.overlap)
                    if (child.overlap(childb)) {

                    }
            }
        }
    }

    monitorSpiritBeforeMove(evt) {
        let figure = evt.figure;
        figure.getGraph().fireEvent('beforeRepeat', evt);
    }

    monitorSpiritAfterMove(evt) {
        let figure = evt.figure;
        let world = figure.getGraph();
        let physicsModel = figure.physicsModel;
        let changed = figure.isTransformChanged;
        if (changed) {
            if (world.uniformGrid) {
                world.uniformGrid.updateRegionsOfFigure(figure);
            }
        }
        let testedPairs;
        if (figure.contactable && physicsModel != null) {
            testedPairs = [];
            let sleeping = figure.isSleeping;
            if (!sleeping) {
                let regionIds = figure.relatedRegions;
                for (let i = 0; i < regionIds.length; i++) {
                    let id = regionIds[i];
                    let region = world.uniformGrid.getRegion(id);
                    for (let j = 0; j < region.relatedFigures.length; j++) {
                        let f = region.relatedFigures.get(j);
                        if (f == figure) {
                            continue;
                        }
                        if (f.physicsModel == null) continue;
                        if (isTested(f, figure)) {
                            continue;
                        }
                        testedPairs.push({s: figure, t: f});
                        if (Tools.overlaps(figure.getSelectBounds(), f.getSelectBounds())) {
                            let modelA = physicsModel;
                            let modelB = f.physicsModel;
                            modelA.applyCurrentTransform(figure.absoluteRotate, figure.getTransformMatrix());
                            modelB.applyCurrentTransform(f.absoluteRotate, f.getTransformMatrix());
                            let result = SAT.collisionTest(modelA, modelB);
                            if (result.collision) {
                                RigidPhysics.solveCollision(figure, f, result.centerA, result.centerB, result.verticesA, result.verticesB
                                    , result.contactPoints, result.contactPlane, result.MTV.direction, 1, result.MTV.minOverlap.value);
                            }
                        }
                    }
                }
            }


            testedPairs.length = 0;
        }
        world.fireEvent('afterRepeat', evt);

        function isTested(figure1, figure2) {
            for (let i = 0; i < testedPairs.length; i++) {
                let pair = testedPairs[i];
                if (pair.s == figure1 && pair.t == figure2) {
                    return true;
                }
                if (pair.s == figure2 && pair.t == figure1) {
                    return true;
                }
            }
            let pair = {};
            pair.s = figure1;
            pair.t = figure2;
            testedPairs.push(pair);
            return false;
        }
    }

    startWorld() {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.getChild(i);
            if (child instanceof AbstractSpirit) {
                this.uniformGrid.updateRegionsOfFigure(child);
                if (!child.isStaticFigure)
                    child.startMove();
            }
        }
        this._loop.start();
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.showDebug)
            this._debug_drawPhysicsModel();
        // ctx.save();
        // drawPoint(ctx, this.p1, "green");
        // drawPoint(ctx, this.p2, "red");
        // drawPoint(ctx, this.p3, "blue");
        // drawPoint(ctx, this.p4, "yellow");
        // linePoints(ctx, this.p1, this.p2, 'yellow');
        // ctx.restore();
        //
        // // linePoints(ctx,this.p3,this.p4,'yellow');
        //
        // function linePoints(ctx, point1, point2, color) {
        //     if (point1 == undefined || point2 == undefined) return;
        //     ctx.save();
        //     ctx.globalAlpha = 0.5;
        //     ctx.beginPath();
        //     ctx.moveTo(point1.x, point1.y);
        //     ctx.lineTo(point2.x, point2.y);
        //     ctx.closePath();
        //
        //     ctx.strokeStyle = color;
        //     ctx.stroke();
        // }
        //
        // function drawPoint(ctx, point, color) {
        //     if (point == undefined) return;
        //     ctx.save();
        //     ctx.globalAlpha = 0.5;
        //     ctx.fillStyle = color;
        //     ctx.beginPath();
        //     ctx.arc(point.x, point.y, 5, 0, Tools.PI2);
        //     ctx.closePath();
        //     ctx.fill();
        //     ctx.restore();
        // }
        //
        // // for (let i = 0; i < this.childrenSize; i++) {
        // //     let child = this.getChild(i);
        // //     let bounds = child.getSelectBounds();
        // //     ctx.beginPath();
        // //     ctx.rect(bounds.left - 1, bounds.top - 1, bounds.width + 2, bounds.height + 2);
        // //     ctx.closePath();
        // //     ctx.strokeStyle = 'green';
        // //     ctx.stroke();
        // // }
    }

    _debug_drawPhysicsModel() {
        this.ctx.save();
        this.ctx.strokeStyle = 'red';
        for (let i = 0; i < this.children.length; i++) {
            let c = this.getChild(i);
            let m = c.physicsModel;
            if (m) {
                this.ctx.beginPath();
                this.ctx.moveTo(m.vertices[0].x, m.vertices[0].y);
                for (let j = 1; j < m.vertices.length; j++) {
                    let v = m.vertices[j];
                    this.ctx.lineTo(v.x, v.y);
                }
                this.ctx.closePath();
                let length = 10;
                for (let j = 0; j < m.axis.length; j++) {
                    let a = m.axis[j];
                    this.ctx.moveTo(m.center.x, m.center.y);
                    let x1 = a.x * length;
                    let y1 = a.y * length;
                    this.ctx.lineTo(m.center.x + x1, m.center.y + y1);
                }
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }

}