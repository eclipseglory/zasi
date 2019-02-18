import LoopThreadWrapper from "./LoopThreadWrapper.js";

let _delay = Symbol("动画延迟开始的时间值");
let _loop = Symbol("动画循环次数");
let _temploop = Symbol();
let _totalTime = Symbol('动画的总时长,单位毫秒');

const PRE_FRAME_REFRESH_NUM = 60 / 1000;
export default class Animation {

    get isRunning() {
        return this.loopThread.isRunning;
    }

    get loop() {
        return this[_loop];
    }

    set loop(number) {
        this[_loop] = number;
        this[_temploop] = number;
    }

    get delay() {
        return this[_delay];
    }

    set delay(delay) {
        this[_delay] = delay;
    }

    get totalTime() {
        return this[_totalTime];
    }

    set totalTime(value) {
        this[_totalTime] = value;
    }

    static get EASE() {
        return EASE;
    }

    static get EASE_OUT() {
        return EASE_OUT;
    }

    static get EASE_IN_OUT() {
        return EASE_IN_OUT;
    }

    static get EASE_OUT_IN() {
        return EASE_OUT_IN;
    }

    static get LINEAR() {
        return LINEAR;
    }

    constructor(figure, totalTime, type, callbacks) {
        this.id = new Date().getTime().toString() + Math.floor(Math.random() * 100);
        if (!figure) throw Error('动画主体figure不能为空');
        this.figure = figure;
        this.type = type || LINEAR;
        this[_totalTime] = totalTime || 500;
        this.finalValues = [];
        this.originalValues = [];
        this.applyProperties = [];
        var that = this;
        this.loopThread = new LoopThreadWrapper();
        this.loopThread.setRepeatFunction(function (refreshCount) {
            that.repeat(refreshCount);
        });
        this.preAnimation = undefined;
        this.nextAnimation = undefined;
        this[_loop] = 0;
        this[_temploop] = 0;
        this._totalTime = totalTime;
        this.callbacks = callbacks;
    }


    recordFigureValues(finalValue, originalValue, propertyName) {
        // if (finalValue != originalValue) {
        this.finalValues[propertyName] = finalValue;
        if (this.preAnimation) {
            var preFinalValue = this.preAnimation.finalValues[propertyName];
            if (preFinalValue) {
                this.originalValues[propertyName] = preFinalValue;
            } else {
                this.originalValues[propertyName] = originalValue;
            }
        } else {
            this.originalValues[propertyName] = originalValue;
        }
        this.applyProperties.push(propertyName);
        // }
    }

    moveTo(x, y) {
        this.recordFigureValues(x, this.figure.left, 'left');
        this.recordFigureValues(y, this.figure.top, 'top');
        return this;
    }

    scaleTo(scaleX, scaleY) {
        this.recordFigureValues(scaleX, this.figure.scaleX, 'scaleX');
        this.recordFigureValues(scaleY, this.figure.scaleY, 'scaleY');
        return this;
    }

    propertyChangeTo(finalValue, propertyName) {
        this.recordFigureValues(finalValue, this.figure[propertyName], propertyName);
        return this;
    }

    rotateTo(rotate) {
        this.recordFigureValues(rotate, this.figure.rotate, 'rotate');
        return this;
    }

    applyOriginalValue() {
        for (var index = 0; index < this.applyProperties.length; index++) {
            var property = this.applyProperties[index];
            this.figure[property] = this.originalValues[property];
        }
    }

    applyDeltaValue(deltaValues) {
        for (var index = 0; index < this.applyProperties.length; index++) {
            var property = this.applyProperties[index];
            this.figure[property] += deltaValues[property];
        }
    }

    applyFigureChange(refreshCount) {
        for (var index = 0; index < this.applyProperties.length; index++) {
            var property = this.applyProperties[index];
            var originalValue = this.originalValues[property];
            var delta = this.calculateDeltaValue(refreshCount, property);
            this.figure[property] = originalValue + delta;
        }
    }

    applyFinalValue() {
        for (var index = 0; index < this.applyProperties.length; index++) {
            var property = this.applyProperties[index];
            this.figure[property] = this.finalValues[property];
        }
    }

    then(totalTime, type) {
        this.nextAnimation = new Animation(this.figure, totalTime, type);
        this.nextAnimation.preAnimation = this;
        return this.nextAnimation;
    }

    calculateDeltaValue(refreshCount, property) {
        var originalValue = this.originalValues[property];
        var finalValue = this.finalValues[property];
        var changeValue = finalValue - originalValue;
        if (changeValue == 0) return 0;
        let totalRefreshNum = Math.floor(this.totalTime * PRE_FRAME_REFRESH_NUM);
        var delta;
        var type = this.type;
        var plusChangeValue = false;
        if (type == EASE_IN_OUT || type == EASE_OUT_IN) {
            changeValue = changeValue / 2;
            totalRefreshNum = totalRefreshNum / 2;
            type = EASE;
            if (type == EASE_OUT_IN) {
                type = EASE_OUT;
            }
            var currentValue = this.figure[property];
            if (Math.abs(currentValue - originalValue) >= Math.abs(changeValue)) {
                type = EASE_OUT;
                if (type == EASE_OUT_IN) {
                    type = EASE;
                }
                plusChangeValue = true;
                refreshCount = refreshCount - totalRefreshNum;
            }
        }
        if (type == LINEAR) {
            var changeVelocity = changeValue / totalRefreshNum;
            delta = changeVelocity * refreshCount;
        }
        if (type == EASE) {
            var delta = (changeValue * refreshCount * refreshCount) / (totalRefreshNum * totalRefreshNum);
        }
        if (type == EASE_OUT) {
            var changeVelocity = (changeValue * 2) / (totalRefreshNum * totalRefreshNum);
            var startVelocity = changeVelocity * totalRefreshNum;
            var delta = startVelocity * refreshCount - (changeVelocity * refreshCount * refreshCount) / 2;
        }
        if (plusChangeValue) {
            delta += changeValue;
        }
        return delta;
    }

    reachFinalFrame(refreshCount) {
        let totalRefreshNum = Math.floor(this.totalTime * PRE_FRAME_REFRESH_NUM);
        if (refreshCount >= totalRefreshNum) return true;
        var reach = true;
        for (var index = 0; index < this.applyProperties.length; index++) {
            var property = this.applyProperties[index];
            var c = this.finalValues[property] - this.originalValues[property];
            // c大于0说明是在递增
            if (c > 0) {
                if (!(this.figure[property] >= this.finalValues[property])) {
                    reach = false;
                }
            }
            if (c < 0) {
                if (!(this.figure[property] <= this.finalValues[property])) {
                    reach = false;
                }
            }
        }
        return reach;
    }


    cleanAnimationData() {
        this.finalValues.length = 0;
        this.originalValues.length = 0;
        this.applyProperties.length = 0;
        this[_temploop] = this[_loop];
        if (this.figure.getGraph().runningAnimation == this.id) {
            this.figure.getGraph().runningAnimation = null;
        }
    }

    repeat(refreshCount) {
        this.applyFigureChange(refreshCount);
        if (this.reachFinalFrame(refreshCount)) {
            this.applyFinalValue();
            this.figure.update(this.id);
            // 如果有回调接口，务必传给他的next动画，让next动画去完成回调
            let tempCallback = undefined;
            if (this.callbacks && this.nextAnimation) {
                tempCallback = this.callbacks;
                this.callbacks = undefined;
            }
            this.complete();
            if (this.nextAnimation) {
                this.nextAnimation.callbacks = tempCallback;
                this.nextAnimation.launchImmediately();
                return;
            }

            return;
        }
        this.figure.update(this.id);
    }

    complete() {
        this.stop('complete');
    }

    interrupt() {
        this.stop('interrupt');
    }

    stop(type) {
        type = type || 'interrupt';
        this.loopThread.stop();
        if (this.figure.getGraph().runningAnimation == this.id) {
            this.figure.getGraph().runningAnimation = null;
        }
        if (this[_temploop] != 0) {
            this[_temploop]--;
            this.start();
        } else {
            this.cleanAnimationData();
            if (this.callbacks) {
                if (type == 'interrupt') {
                    if (this.callbacks.stop) {
                        this.callbacks.stop();
                    }
                } else if (type == 'complete') {
                    if (this.callbacks.complete) {
                        this.callbacks.complete();
                    }
                }
            }
        }
    }

    start(callbacks) {
        if (callbacks)
            this.callbacks = callbacks;
        if (this.preAnimation) {
            this.preAnimation.start();
        } else {
            // 先将figure的值设置成初始值在开始运行动画
            this.applyOriginalValue();
            this.launchImmediately();
        }
    }

    launchImmediately() {
        let that = this;
        if (this.delay != null && this.delay != undefined) {
            setTimeout(function () {
                that.loopThread.start();
            }, this.delay);
        } else {
            this.loopThread.start();
        }
    }
}
const EASE_IN_OUT = 'ease_in_out';
const EASE_OUT_IN = 'ease_out_in';
const EASE_OUT = 'ease_out';
const EASE = 'ease';
const LINEAR = 'linear';