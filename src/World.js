import Graph from "./Graph.js";
import LoopThreadWrapper from "./LoopThreadWrapper.js";
import AbstractSpirit from "./spirit/AbstractSpirit.js";
import UniformGrid from "./utils/UniformGrid.js";

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
        this.uniformGrid = new UniformGrid(gridRow, gridColumn, this.width, this.height);
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
        let sleeping = figure.isSleeping;
        let changed = figure.isTransformChanged;
        if (changed) {
            if(world.uniformGrid){
                world.uniformGrid.updateRegionsOfFigure(figure);
            }
        }
        // let testedPairs = [];
        // if (!sleeping) {
        //     let regionIds = figure.relatedRegions;
        //     for (let i = 0; i < regionIds.length; i++) {
        //         let id = regionIds[i];
        //         let region = this.uniformGrid.getRegion(id);
        //         for (let j = 0; j < region.relatedFigures.length; j++) {
        //             let f = region.relatedFigures.get(j);
        //             if (f == figure) {
        //                 continue;
        //             }
        //             if (isTested(f, figure)) {
        //                 continue;
        //             }
        //             if (Tools.overlaps(figure.getSelectBounds(), f.getSelectBounds())) {
        //                 let result = SAT.collisionTest(figure,f);
        //                 if(result.collision){
        //                     RigidPhysics.solveCollision(figure, f, result.centerA, result.centerB, result.verticesA, result.verticesB
        //                         , result.contactPoints, result.contactPlane, result.MTV.direction, 1, result.MTV.minOverlap.value);
        //                 }
        //             }
        //         }
        //     }
        // }
        //
        // function isTested(figure1, figure2) {
        //     for (let i = 0; i < testedPairs.length; i++) {
        //         let pair = testedPairs[i];
        //         if (pair.s == figure1 && pair.t == figure2) {
        //             return true;
        //         }
        //         if (pair.s == figure2 && pair.t == figure1) {
        //             return true;
        //         }
        //     }
        //     let pair = {};
        //     pair.s = figure1;
        //     pair.t = figure2;
        //     testedPairs.push(pair);
        //     return false;
        // }
        // testedPairs.length = 0;
        figure.getGraph().fireEvent('afterRepeat', evt);
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

}