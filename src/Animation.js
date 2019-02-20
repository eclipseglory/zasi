import LoopThreadWrapper from "./LoopThreadWrapper.js";
import Figure from "./Figure.js";

let _delay = Symbol("动画延迟开始的时间值");
let _loop = Symbol("动画循环次数");
let _temploop = Symbol('xunhuancishu temp');
let _totalTime = Symbol('动画的总时长,单位毫秒');
const COMPLETE = 'complete';
const INTERRUPT = 'interrupt';
const PRE_FRAME_REFRESH_NUM = 60 / 1000;
export default class Animation {

    get isRunning() {
        return this._startRun;
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
        this._startRun = false;
        this.preAnimation = undefined;
        this.nextAnimation = undefined;
        let that = this;
        this.loopFunction = function (evt) {
            if (!that._startRun) return;
            that.repeat();
            that.refreshCount++;
        };
        this._paused = false;
        this[_loop] = 0;
        this[_temploop] = undefined;
        this.callbacks = callbacks;
        this.refreshCount = 0;
    }

    get paused() {
        let runnedAnimation = this;
        while (runnedAnimation) {
            if (runnedAnimation._paused) {
                return true;
            }
            runnedAnimation = runnedAnimation.preAnimation;
        }
        let unRunnedAnimation = this;
        while (unRunnedAnimation) {
            if (unRunnedAnimation._paused) {
                return true;
            }
            unRunnedAnimation = unRunnedAnimation.nextAnimation;
        }
        return false;
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
        this.nextAnimation.loop = this.loop;
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
        this[_loop] = this[_temploop];
    }

    repeat() {
        this.applyFigureChange(this.refreshCount);
        if (this.reachFinalFrame(this.refreshCount)) {
            this.applyFinalValue();
            this.complete();
            if (this.nextAnimation) {
                this.nextAnimation.launchImmediately();
            }
        }
    }

    complete() {
        this.stop(COMPLETE);
    }

    interrupt() {
        this.stop(INTERRUPT);
    }

    stop(type) {
        type = type || INTERRUPT;
        if (type === INTERRUPT) {
            //如果被打断，恢复figure之前的所有数据
            let runnedAnimation = this;
            while (runnedAnimation !== null) {
                runnedAnimation.applyOriginalValue();
                this.figure.removeEventListener(Figure.EVENT_BEFORE_DRAW_SELF, runnedAnimation.loopFunction);
                runnedAnimation = runnedAnimation.preAnimation;
            }
            let unRunnedAnimation = this.nextAnimation;
            while (unRunnedAnimation !== null) {
                this.figure.removeEventListener(Figure.EVENT_BEFORE_DRAW_SELF, unRunnedAnimation.loopFunction);
                unRunnedAnimation = unRunnedAnimation.nextAnimation;
            }
            return;
        }

        // 先让当前动画停下来
        this._startRun = false;
        this.refreshCount = 0;
        if (this.loop > 0) this.loop--;
        // 说明是无限循环的
        let firstAnimation = this.preAnimation;
        if (firstAnimation) {
            while (firstAnimation.preAnimation != null) {
                firstAnimation = firstAnimation.preAnimation;
            }
        } else {
            firstAnimation = this;
        }
        if (this.loop === 0) {
            this.cleanAnimationData();
            this.figure.removeEventListener(Figure.EVENT_BEFORE_DRAW_SELF, this.loopFunction);
            if (this.callbacks) {
                if (type === INTERRUPT) {
                    if (this.callbacks.stop) {
                        this.callbacks.stop();
                    }
                } else if (type === COMPLETE) {
                    if (this.callbacks.complete) {
                        this.callbacks.complete();
                    }
                }
            }
        } else {
            if (this.nextAnimation) {
                // 这说明还有下一个动画，不能重复当前动画：
                this.nextAnimation.launchImmediately();
                return;
            }
            // 如果没有下一个动画而有前一个动画，说明是动画链,且目前是动画链最后一个
            // 则找到动画链最开始的动画来一遍，在开始之前，要把动画链所有的初始状态恢复给figure
            if (this.preAnimation) {
                let runnedAnimation = this;
                while (runnedAnimation !== firstAnimation) {
                    runnedAnimation.applyOriginalValue();
                    runnedAnimation = runnedAnimation.preAnimation;
                }
                firstAnimation.launchImmediately();
                return;
            }
            // 如果不是动画链，则重新来一次：
            this.launchImmediately();
        }
    }

    setRunningAnimationOnChainPause(flag) {

        if (flag && this.isRunning){
            this._startRun = !flag;
            this._paused = flag;
            return;
        }
        if(!flag && this._paused){
            this._startRun = !flag;
            this._paused = flag;
            return;
        }

        let runnedAnimation = this.preAnimation;
        while (runnedAnimation) {
            if (flag && runnedAnimation.isRunning){
                runnedAnimation._startRun = !flag;
                runnedAnimation._paused = flag;
            }
            if(!flag && runnedAnimation._paused){
                runnedAnimation._startRun = !flag;
                runnedAnimation._paused = flag;
            }
            runnedAnimation = runnedAnimation.preAnimation;
        }
        let unRunnedAnimation = this.nextAnimation;
        while (unRunnedAnimation) {
            if (flag && unRunnedAnimation.isRunning){
                unRunnedAnimation._startRun = !flag;
                unRunnedAnimation._paused = flag;
            }
            if(!flag && unRunnedAnimation._paused){
                unRunnedAnimation._startRun = !flag;
                unRunnedAnimation._paused = flag;
            }
            unRunnedAnimation = unRunnedAnimation.nextAnimation;
        }
        return;
    }

    pause() {
        this.setRunningAnimationOnChainPause(true);
    }

    start(callbacks) {
        if (this.paused) {
            this.setRunningAnimationOnChainPause(false);
        } else {
            this.figure.addEventListener(Figure.EVENT_BEFORE_DRAW_SELF, this.loopFunction);
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
    }

    launchImmediately() {
        let that = this;
        if (this.delay != null) {
            setTimeout(function () {
                that.refreshCount = 0;
                this._startRun = true;
            }, this.delay);
        } else {
            this.refreshCount = 0;
            this._startRun = true;
        }
    }
}
const EASE_IN_OUT = 'ease_in_out';
const EASE_OUT_IN = 'ease_out_in';
const EASE_OUT = 'ease_out';
const EASE = 'ease';
const LINEAR = 'linear';