import AbstractSpirit from "./AbstractSpirit.js";
import Animation from "../Animation.js";

export default class Spirit extends AbstractSpirit {
    constructor(properties) {
        super(properties);
        if (properties == null) properties = {};
        this.targetTop = properties['targetTop'] || 0;
        this.targetLeft = properties['targetLeft'] || 0;
        this.targetWidth = properties['targetWidth'] || 0;
        this.targetHeight = properties['targetHeight'] || 0;
        if (properties['texture']) {
            this.texture = properties['texture'];
        }
        this.textureIndex = -1;
        this.sheetAnimationMap = {};
        this.currentAnimation = {key: null, animation: new Animation(this)};
    }

    addSheetAnimation(properties) {
        if (properties) {
            let key = properties['key'];
            let start = properties['start'];
            let end = properties['end'];
            let time = properties['time'] || 500;
            let loop = properties['loop'] || false;
            this.sheetAnimationMap[key] = {
                start: start,
                end: end + 0.9,
                time: time,
                loop: loop
            }
        }
    }

    removeSheetAnimation(key) {
        this.sheetAnimationMap[key] = undefined;
    }

    get currentSheetAnimationPaused() {
        return this.currentAnimation.animation.paused;
    }

    get currentSheetAnimationRunning() {
        return this.currentAnimation.animation.isRunning;
    }

    get currentSheetAnimation() {
        return this.currentAnimation;
    }

    playCurrentSheetAnimation(callbacks) {
        if (this.currentAnimation.key == null) return;
        this.playSheetAnimation(this.currentAnimation.key, callbacks);
    }

    playSheetAnimation(key, callbacks) {
        if (this.currentAnimation.key === key) {
            if (this.currentAnimation.animation.isRunning) {
                return;
            }
            if (this.currentAnimation.animation.paused) {
                this.currentAnimation.animation.start();
                return;
            }
        }
        let animationInfo = this.sheetAnimationMap[key];
        if (animationInfo) {
            this.currentAnimation.key = key;
            let animation = this.currentAnimation.animation;
            animation.totalTime = animationInfo.time;
            if (animationInfo.loop) {
                animation.loop = -1;
            }
            this.textureIndex = animationInfo.start;
            animation.propertyChangeTo(animationInfo.end, 'textureIndex');
            animation.start(callbacks);
        }
    }

    pauseCurrentSheetAnimation() {
        if (this.currentAnimation.animation.isRunning) {
            this.currentAnimation.animation.pause();
        }
    }

    stopCurrentSheetAnimation() {
        if (this.currentAnimation.animation.isRunning) {
            this.currentAnimation.animation.interrupt();
        }
    }

    drawSelf(ctx) {
        if (this.texture == undefined) return;
        let texture = this.texture;
        if (this.textureIndex != -1) {
            texture = this.texture.splitedTextures[Math.floor(this.textureIndex)];
        }
        if (texture == undefined) return;
        if (this.targetWidth == 0 || this.targetHeight == 0) {
            ctx.drawImage(texture, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(texture, this.targetLeft, this.targetTop, this.targetWidth, this.targetHeight,
                0, 0, this.width, this.height);
        }
    }
}