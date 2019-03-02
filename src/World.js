import Graph from "./Graph.js";
import AbstractSpirit from "./spirit/AbstractSpirit.js";
import UniformGrid from "./utils/UniformGrid.js";
import Tools from "./utils/Tools.js";
import SAT from "./geometry/SAT.js";
import RigidPhysics from "./physics/RigidPhysics.js";
import List from "./common/List.js";
import Figure from "./Figure.js";
import Constraint from "./physics/Constraint.js";

export default class World extends Graph {
    constructor(canvas, p) {
        p = p || {};
        let gridRow = p['gridRow'] || 10;
        let gridColumn = p['gridColumn'] || 10;
        super(canvas);
        if (p['e'] != undefined) {
            this.collisionE = p['e'];
        } else {
            this.collisionE = 0;
        }
        this.uniformGrid = new UniformGrid(gridRow, gridColumn, this.width, this.height);
        this.showDebug = p['showDebug'] || false;
        this.models = new List();
        this.p1 = {x: 0, y: 0};
        this.collisionTestedPairs = {};
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

    modelAdded(evt) {
        let me = evt.figure.getGraph();
        let child = evt.property['child'];
        me.addModel(child);
    }

    modelRemoved(evt) {
        let me = evt.figure.getGraph();
        let child = evt.property['child'];
        me.removeModel(child);
    }

    afterFigureRefresh(evt) {

    }

    beforeFigureRefresh(evt) {
        let figure = evt.figure;
        let physicsModel = figure.physicsModel;
        // 目前UniformGrid只为碰撞模型服务，不具备碰撞条件的图形不管
        if (physicsModel == null || !figure.contactable) return;
        let world = figure.getGraph();
        let changed = figure.isTransformChanged;
        // 没有发生变换的图形也不管，只以动的图形为主，不同的图形为参考
        physicsModel.applyCurrentTransform(figure.absoluteRotate, figure.getRelativeTransformMatrix(world));
        if (!changed) return;
        if (world.uniformGrid) {
            world.uniformGrid.updateRegionsOfFigure(figure);
        }

        // let sleeping = figure.isSleeping;
        // if (!sleeping) {
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
                if (isTested(f, figure, world.collisionTestedPairs)) {
                    continue;
                }
                let pairs = world.collisionTestedPairs[figure.id];
                if (pairs == undefined) {
                    pairs = [];
                    world.collisionTestedPairs[figure.id] = pairs;
                }
                pairs.push(f.id);
                if (Tools.overlaps(figure.getSelectBounds(), f.getSelectBounds())) {
                    let modelA = physicsModel;
                    let modelB = f.physicsModel;
                    modelA.applyCurrentTransform(figure.absoluteRotate, figure.getRelativeTransformMatrix(world));
                    modelB.applyCurrentTransform(f.absoluteRotate, f.getRelativeTransformMatrix(world));
                    let result = SAT.collisionTest(modelA, modelB);
                    if (result.collision) {
                        let c = result.contactPoints[0];
                        world.p1.x = c.vertices[c.index].x;
                        world.p1.y = c.vertices[c.index].y;
                        let V = Constraint.solve(figure, f, result.centerA, result.centerB, result.verticesA, result.verticesB
                            , result.contactPoints, result.contactPlane, result.MTV.direction, world.collisionE, result.MTV.minOverlap.value);

                        figure.angularVelocity += V.w1;
                        f.angularVelocity -= V.w2;
                        tielifa.Vector2.plus(figure.velocity, figure.velocity, V.v1);
                        tielifa.Vector2.sub(f.velocity, f.velocity, V.v2);

                        figure.x += V.v1.x;
                        figure.y += V.v1.y;
                        f.x -= V.v2.x;
                        f.y -= V.v2.y;
                        figure.rotate += V.w1 * 180 / Math.PI;
                        f.rotate -= V.w2 * 180 / Math.PI;
                        // figure.x += figure.velocity.x;
                        // figure.y += figure.velocity.y;
                        // f.x -= f.velocity.x;
                        // f.y -= f.velocity.y;
                        // figure.rotate += figure.au * 180 / Math.PI;
                        // f.rotate -= V.w2 * 180 / Math.PI;


                        // RigidPhysics.solveCollision(figure, f, result.centerA, result.centerB, result.verticesA, result.verticesB
                        //     , result.contactPoints, result.contactPlane, result.MTV.direction, world.collisionE, result.MTV.minOverlap.value);
                        // // figure.contactable =false;
                    }
                }
            }
        }

        function isTested(figure1, figure2, collisionPairs) {
            let p1 = collisionPairs[figure1.id];
            if (p1 != undefined) {
                for (let i = 0; i < p1.length; i++) {
                    if (p1[i] == figure2.id)
                        return true;
                }
            }
            let p2 = collisionPairs[figure2.id];
            if (p2 != undefined) {
                for (let i = 0; i < p2.length; i++) {
                    if (p2[i] == figure1.id)
                        return true;
                }
            }
            return false;
        }

    }

    removeModel(figure) {
        if (figure.physicsModel != null) {
            this.models.remove(figure.physicsModel);
        }
        // figure.removeEventListener(Figure.EVENT_TRANSFORM_CHANGED, this.updateModel);
        figure.removeEventListener(Figure.EVENT_ADD_CHILD, this.modelAdded);
        figure.removeEventListener(Figure.EVENT_REMOVE_CHILD, this.modelRemoved);
        figure.removeEventListener(Figure.EVENT_BEFORE_DRAW_SELF, this.beforeFigureRefresh);
        for (let i = 0; i < figure.childrenSize; i++) {
            let c = figure.getChild(i);
            this.removeModel(c);
        }
    }

    addModel(figure) {
        if (figure.physicsModel != null) {
            this.models.add(figure.physicsModel);
        }
        let me = figure.getGraph();
        if (me && figure.physicsModel != null && figure.contactable) {
            me.uniformGrid.updateRegionsOfFigure(figure);
        }
        // figure.addEventListener(Figure.EVENT_TRANSFORM_CHANGED, this.updateModel);
        figure.addEventListener(Figure.EVENT_ADD_CHILD, this.modelAdded);
        figure.addEventListener(Figure.EVENT_REMOVE_CHILD, this.modelRemoved);
        figure.addEventListener(Figure.EVENT_BEFORE_DRAW_SELF, this.beforeFigureRefresh);
        for (let i = 0; i < figure.childrenSize; i++) {
            let c = figure.getChild(i);
            this.addModel(c);
        }
    }

    startWorld() {
        this.addModel(this);
        for (let i = 0; i < this.children.length; i++) {
            let child = this.getChild(i);
            if (child instanceof AbstractSpirit) {
                // this.uniformGrid.updateRegionsOfFigure(child);
                if (!child.isStaticFigure)
                    child.startMove();
            }
        }
        this.startLoopRefresh();
    }


    updateChildren(ctx) {
        super.updateChildren(ctx);
        if (this.showDebug)
            this._debug_drawPhysicsModel();

    }

    update() {
        this.collisionTestedPairs = {};
        super.update();
    }

    _debug_drawPhysicsModel() {
        this.ctx.save();
        this.ctx.strokeStyle = 'red';

        function drawModel(m, ctx) {
            ctx.beginPath();
            ctx.moveTo(m.vertices[0].x, m.vertices[0].y);
            for (let j = 1; j < m.vertices.length; j++) {
                let v = m.vertices[j];
                ctx.lineTo(v.x, v.y);
            }
            ctx.closePath();
            // let length = 10;
            // for (let j = 0; j < m.axis.length; j++) {
            //     let a = m.axis[j];
            //     this.ctx.moveTo(m.center.x, m.center.y);
            //     let x1 = a.x * length;
            //     let y1 = a.y * length;
            //     this.ctx.lineTo(m.center.x + x1, m.center.y + y1);
            // }
            ctx.stroke();
        }

        if (this.m1 != null) {
            drawModel(this.m1, this.ctx);
        }
        if (this.m2 != null) {
            drawModel(this.m2, this.ctx);
        }

        // for (let i = 0; i < this.models.length; i++) {
        //     let m = this.models.get(i);
        //     if (m) {
        //         this.ctx.beginPath();
        //         this.ctx.moveTo(m.vertices[0].x, m.vertices[0].y);
        //         for (let j = 1; j < m.vertices.length; j++) {
        //             let v = m.vertices[j];
        //             this.ctx.lineTo(v.x, v.y);
        //         }
        //         this.ctx.closePath();
        //         let length = 10;
        //         for (let j = 0; j < m.axis.length; j++) {
        //             let a = m.axis[j];
        //             this.ctx.moveTo(m.center.x, m.center.y);
        //             let x1 = a.x * length;
        //             let y1 = a.y * length;
        //             this.ctx.lineTo(m.center.x + x1, m.center.y + y1);
        //         }
        //         this.ctx.stroke();
        //     }
        // }
        // this.ctx.fillStyle = 'red';
        // this.ctx.globalAlpha = 0.5;
        // for (let i = 0; i < this.uniformGrid.row; i++) {
        //     for (let j = 0; j < this.uniformGrid.column; j++) {
        //         let id = this.uniformGrid.getRegionId({row: i, column: j});
        //         let region = this.uniformGrid.getRegion(id);
        //         if (region.relatedFigures.length != 0) {
        //             for(let k=0;k<region.relatedFigures.length;k++){
        //                 let f = region.relatedFigures.get(k);
        //                 let bounds = f.getSelectBounds();
        //                 this.ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
        //             }
        //         }
        //     }
        // }
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.p1.x, this.p1.y, 5, 5);
        this.ctx.restore();
    }

}