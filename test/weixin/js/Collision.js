import BaseExample from "./BaseExample.js";
import World from "../../../src/World.js";
import TestRectSpirit from "../../../src/spirit/TestRectSpirit.js";
import PhysicsModel from "../../../src/physics/PhysicsModel.js";

export default class Collision extends BaseExample {
    constructor(c) {
        super(c);
        this.rect1;
        this.world;
    }

    ontouch(evt, x, y) {
        let figure = new TestRectSpirit({
            velocity: {x: 0, y: 0},
            elastic: 0,
            rotate: 180,
            angularVelocity: 0.01,
            force: {x: 0, y: 0.1},
            x: x - 25,
            y: y - 25,
            width: 50,
            height: 50
        });
        let r = Math.floor(Math.random() * 255);
        let g = Math.floor(Math.random() * 255);
        let b = Math.floor(Math.random() * 255);
        figure.color = "rgb(" + r + "," + g + "," + b + ")";
        let random = Math.floor(Math.random() * 3);
        // random = 2:
        if (random == 0) {
            figure.physicsModel = PhysicsModel.createDefaultModel(figure);
        } else if (random == 1) {
            figure.physicsModel = PhysicsModel.createRegularHexagonModel(figure);
        } else if (random == 2) {
            figure.physicsModel = PhysicsModel.createRegularTriangleModel(figure);
        }
        figure.startMove();
        this.world.addChild(figure);
    }

    run(imageBasePath) {
        this.world = new World(this.canvas, {enableDepthTest: true, e: 0, showDebug: true});
        let world = this.world;
        if (typeof wx !== 'undefined') {
            let scale = wx.getSystemInfoSync().pixelRatio;
            console.log(scale);
            if (scale > 1.5) scale = 1.5;
            this.canvas.width *= scale;
            this.canvas.height *= scale;
            world.ctx.scale(scale, scale);
        }
        this.rect1 = new TestRectSpirit({
            velocity: {x: 0, y: 0},
            rotate: -30,
            // angularVelocity: 0.01,
            force: {x: 0, y: 0.1},
            x: 100,
            y: 100,
            width: 50,
            height: 300
        });
        let rect = this.rect1;
        rect.physicsModel = PhysicsModel.createDefaultModel(rect);

        let rect1 = new TestRectSpirit({
            velocity: {x: 0, y: -2},
            rotate: 0,
            // angularVelocity: 0.01,
            force: {x: 0, y: 0.1},
            x: 200,
            y: 200,
            width: 50,
            height: (50 / 2) * Math.tan(60 * Math.PI / 180),
            color: 'yellow'
        });
        rect1.physicsModel = PhysicsModel.createRegularTriangleModel(rect1);


        let border1 = new TestRectSpirit({
            x: -95,
            y: 1,
            width: 100,
            height: world.height,
            color: 'red',
            mass: Infinity
        });
        border1.physicsModel = PhysicsModel.createDefaultModel(border1);
        let border2 = new TestRectSpirit({
            x: 0,
            y: -95,
            width: world.width,
            height: 100,
            color: 'red',
            mass: Infinity
        });
        border2.physicsModel = PhysicsModel.createDefaultModel(border2);
        let border3 = new TestRectSpirit({
            x: world.width - 5,
            y: 5,
            width: 100,
            height: world.height - 10,
            color: 'red',
            mass: Infinity
        });
        border3.physicsModel = PhysicsModel.createDefaultModel(border3);
        let border4 = new TestRectSpirit({
            x: 5,
            y: world.height - 5,
            width: world.width - 10,
            height: 500,
            color: 'red',
            mass: Infinity
        });
        border4.physicsModel = PhysicsModel.createDefaultModel(border4);

        let border5 = new TestRectSpirit({
            x: -300,
            y: world.height - 200,
            width: 500,
            height: 500,
            color: 'red',
            mass: Infinity
        });
        border5.physicsModel = PhysicsModel.createRegularTriangleModel(border4);

        // world.addChild(rect);
        // world.addChild(rect1);
        world.addChild(border1);
        world.addChild(border2);
        world.addChild(border3);
        world.addChild(border4);
        // world.addChild(border5);
        world.startWorld();
    }
}