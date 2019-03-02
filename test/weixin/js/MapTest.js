import BaseExample from "./BaseExample.js";
import TileMap from "../../../src/figures/TileMap.js";
import Tools from "../../../src/utils/Tools.js";
import ImageFigure from "../../../src/figures/ImageFigure.js";
import World from "../../../src/World.js";
import TestRectSpirit from "../../../src/spirit/TestRectSpirit.js";
import PhysicsModel from "../../../src/physics/PhysicsModel.js";

export default class MapTest extends BaseExample {
    constructor(c) {
        super(c);
        this.rect = null;
    }

    ontouch(evt, x, y) {
        let bounds = this.rect.getSelectBounds();
        let center = {x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2};
        let speed = 2;
        let v = {x: x - center.x, y: y - center.y};
        let length = v.x * v.x + v.y * v.y;
        length = Math.sqrt(length);
        let vn = {x: v.x / length, y: v.y / length};
        this.rect.velocity.x += vn.x * speed;
        this.rect.velocity.y += vn.y * speed;

    }

    run(imageBasePath) {
        imageBasePath = imageBasePath || '';
        let webgl = this.canvas;
        let graph = new World(webgl, {e: 0.1, showDebug: false});
        let figureImage = new ImageFigure();
        graph.loadImage('background', imageBasePath + 'images/blue_grass.png', {
            success: function (texture) {
                let w = texture.width;
                let h = texture.height;
                let width = w;
                let height = width * h / w;
                figureImage.width = width;
                figureImage.height = height;
                figureImage.y = (graph.height - height) / 2;
                figureImage.texture = texture;
            }
        });
        graph.addChild(figureImage);
        let tiledInfo = null;
        let map = new TileMap();
        this.rect = new TestRectSpirit({
            velocity: {x: -0.1, y: -2},
            rotate: 0,
            angularVelocity: 0.01,
            force: {x: 0, y: 3.6},
            x: 200,
            y: 200,
            width: 50,
            height: (50 / 2) * Math.tan(60 * Math.PI / 180),
            color: 'yellow',
            mass :36
        });
        let rect1 = this.rect;
        rect1.physicsModel = PhysicsModel.createRegularHexagonModel(rect1);
        graph.addChild(rect1);
        graph.addChild(map);
        Tools.loadResource(imageBasePath + 'images/tiledmap0.json', {
            success: function (text) {
                tiledInfo = JSON.parse(text);
                Tools.loadResource(imageBasePath + 'images/textureName0.json', {
                    success: function (text, directory) {
                        let tiledMapInfo = JSON.parse(text);
                        graph.loadImage(tiledMapInfo.image, directory + tiledMapInfo.image, {
                            success: function (texture) {
                                map.row = tiledInfo.row;
                                map.column = tiledInfo.column;
                                map.fitWidth(graph.width);
                                map.alignV('bottom');
                                map.data = tiledInfo;

                                graph.startWorld();
                            }
                        });
                    }
                });
            }
        });

        // graph.loadImage('bubbles', imageBasePath + 'images/tiles.png', {
        //     success: function (texture) {
        //         imageTile1.texture = texture;
        //     }
        // }, {row: 13, column: 12});

    }
}