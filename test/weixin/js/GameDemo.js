import BaseExample from "./BaseExample.js";
import World from "../../../src/World.js";
import TestRectSpirit from "../../../src/spirit/TestRectSpirit.js";
import PhysicsModel from "../../../src/physics/PhysicsModel.js";
import TestCircleSpirit from "../../../src/spirit/TestCircleSpirit.js";

export default class GameDemo extends BaseExample {
    constructor(p) {
        super(p);
        this.lines = [];
        this.drawLine = false;
        this.minLength = 50;
        this.startPoint = {x: undefined, y: undefined};
        this.endPoint = undefined;
        this.world;
    }

    ontouch(evt, x, y) {
        if(evt.button == 2){
            let ball = new TestCircleSpirit({
                velocity: {x: 0, y: 0},
                elastic: 0,
                rotate: 180,
                angularVelocity: 0.01,
                force: {x: 0, y: 0.36},
                x: x - 25,
                y: y - 25,
                width: 50,
                height: 50,
                mass: 3.6,
                color : 'red'
            });
            ball.physicsModel = PhysicsModel.createEllipseModel(ball);
            ball.startMove();
            this.world.addChild(ball);
            return;
        }
        this.drawLine = true;
        this.startPoint.x = x;
        this.startPoint.y = y;
    }

    onmove(evt, x, y) {
        if (this.drawLine) {
            let test = tielifa.Vector2.TEMP_VECTORS[0];
            test.x = x;
            test.y = y;
            let dis = tielifa.Tools.getDistance(this.startPoint, test);
            if (dis < this.minLength) {
                return;
            }
            let oldx = this.startPoint.x;
            let oldy = this.startPoint.y;
            let left = this.startPoint.x;
            let top = this.startPoint.y - 5;
            this.startPoint.x = x;
            this.startPoint.y = y;
            let testRect = new TestRectSpirit({
                x: left,
                y: top,
                width: this.minLength,
                height: 10
            });
            testRect.transformAnchorCalculator = function (figure) {
                if (figure.ta == undefined) {
                    figure.ta = {x: 0, y: figure.height / 2};
                }
                return figure.ta;
            };
            let theta = Math.atan2(y - oldy, x - oldx);
            testRect.rotate = theta * 180 / Math.PI;
            testRect.mass = Infinity;
            testRect.physicsModel = PhysicsModel.createDefaultModel(testRect);
            this.world.addChild(testRect);
        }
    }

    ontouchend(evt, x, y) {
        this.drawLine = false;
    }

    onover(evt, x, y) {
        this.drawLine = false;
        this.startPoint.x = undefined;
        this.startPoint.y = undefined;
    }

    run(imageBasePath) {
        this.world = new World(this.canvas);
        this.world.startWorld();
    }
}