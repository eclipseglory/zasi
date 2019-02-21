import BaseExample from "./BaseExample.js";
// import World from "../../../src/World.js";
// import TestRectSpirit from "../../../src/spirit/TestRectSpirit.js";
// import PhysicsModel from "../../../src/physics/PhysicsModel.js";

export default class Collision extends BaseExample {
    constructor(c) {
        super(c);
    }

    run(imageBasePath) {
        let world = new zasi.World(this.canvas, {enableDepthTest: true, e: 1, showDebug: true});
        if (typeof wx !== 'undefined') {
            let scale = wx.getSystemInfoSync().pixelRatio;
            console.log(scale);
            if (scale > 1.5) scale = 1.5;
            this.canvas.width *= scale;
            this.canvas.height *= scale;
            world.ctx.scale(scale, scale);
        }
        let rect = new zasi.spirit.TestRectSpirit({
            velocity: {x: 1, y: 0},
            rotate: 30,
            angularVelocity: 0.01,
            // force: {x: 0, y: 0.01},
            x: 100,
            y: 100,
            width: 50,
            height: 50
        });
        rect.physicsModel = zasi.physics.PhysicsModel.createDefaultModel(rect);

        let rect1 = new zasi.spirit.TestRectSpirit({
            velocity: {x: 2, y: -2},
            rotate: 0,
            angularVelocity: 0.01,
            // force: {x: 0, y: 0.01},
            x: 200,
            y: 200,
            width: 50,
            height: (50 / 2) * Math.tan(60 * Math.PI / 180),
            color: 'yellow'
        });
        rect1.physicsModel = zasi.physics.PhysicsModel.createRegularTriangleModel(rect1);


        let border1 = new zasi.spirit.TestRectSpirit({
            x: -95,
            y: 1,
            width: 100,
            height: world.height,
            color: 'red',
            mass: Infinity
        });
        border1.physicsModel = zasi.physics.PhysicsModel.createDefaultModel(border1);
        let border2 = new zasi.spirit.TestRectSpirit({
            x: 0,
            y: -95,
            width: world.width,
            height: 100,
            color: 'red',
            mass: Infinity
        });
        border2.physicsModel = zasi.physics.PhysicsModel.createDefaultModel(border2);
        let border3 = new zasi.spirit.TestRectSpirit({
            x: world.width - 5,
            y: 5,
            width: 100,
            height: world.height - 10,
            color: 'red',
            mass: Infinity
        });
        border3.physicsModel = zasi.physics.PhysicsModel.createDefaultModel(border3);
        let border4 = new zasi.spirit.TestRectSpirit({
            x: 5,
            y: world.height - 5,
            width: world.width - 10,
            height: 500,
            color: 'red',
            mass: Infinity
        });
        border4.physicsModel = zasi.physics.PhysicsModel.createDefaultModel(border4);
        world.addChild(rect);
        world.addChild(rect1);
        world.addChild(border1);
        world.addChild(border2);
        world.addChild(border3);
        world.addChild(border4);
        world.startWorld();
    }
}