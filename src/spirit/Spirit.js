import AbstractSpirit from "./AbstractSpirit.js";
import Animation from "../Animation.js";

export default class Spirit extends AbstractSpirit {
    get texture() {
        return this.defaultTexture;
    }

    set texture(value) {
        this.defaultTexture = value;
    }

    get textureIndex() {
        return this._defaultTextureIndex;
    }

    set textureIndex(index) {
        this._defaultTextureIndex = index;
    }

    constructor(properties) {
        super(properties);
        if (properties == null) properties = {};
        this.targetTop = properties['targetTop'] || 0;
        this.targetLeft = properties['targetLeft'] || 0;
        this.targetWidth = properties['targetWidth'] || 0;
        this.targetHeight = properties['targetHeight'] || 0;
        if (properties['texture']) {
            this._texture = properties['texture'];
            this.defaultTexture = properties['texture'];
        }
        this._textureIndex = -1;
        this._defaultTextureIndex = -1;
        this.sheetAnimationMap = {};
        this.currentAnimation = {key: null, animation: new Animation(this)};
        if (properties['textureIndex'] != undefined) {
            this._textureIndex = properties['textureIndex'];
            this._defaultTextureIndex = properties['textureIndex'];
        }
    }

    addSheetAnimation(properties) {
        if (properties) {
            let key = properties['key'];
            let start = properties['start'];
            let end = properties['end'];
            let time = properties['time'] || 500;
            let loop = properties['loop'] || false;
            let texture = properties['_texture'];
            this.sheetAnimationMap[key] = {
                start: start,
                end: end + 0.9,
                time: time,
                loop: loop,
                texture: texture
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
            this._textureIndex = animationInfo.start;
            if (animation.texture != undefined)
                this._texture = animation.texture;
            animation.propertyChangeTo(animationInfo.end, '_textureIndex');
            let that = this;
            animation.start({
                complete: function () {
                    that._texture = that.defaultTexture;
                    that._textureIndex = that._defaultTextureIndex;
                    if (callbacks && callbacks.complete) {
                        callbacks.complete();
                    }
                }, stop: function () {
                    that._texture = that.defaultTexture;
                    that._textureIndex = that._defaultTextureIndex;
                    if (callbacks && callbacks.stop) {
                        callbacks.stop();
                    }
                }
            });
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
        if (this._texture == undefined) {
            this._texture = this.defaultTexture;
        }
        if (this._texture == undefined) return;
        let texture = this._texture;
        if (this._textureIndex != -1) {
            texture = this._texture.splitedTextures[Math.floor(this._textureIndex)];
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