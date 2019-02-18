export default class LoopThreadWrapper {
    get isRunning() {
        return this._isRunning;
    }
    constructor(repeat, stopcallback) {
        this.debug = false;
        this.repeat = repeat;
        this.stopcallback = stopcallback;
        this.threadId = null;
        this.stopped = true;
        this.refreshCount = 0;
        this._isRunning = false;
    }

    loop(refreshCount) {
        if (this.stopped) return;
        if (this.debug) {
            console.log(this.threadId + " 正在运行");
        }
        if (this.repeat != null && this.repeat != undefined) {
            this.repeat(refreshCount);
        }
        this.threadId = null;
        if (this.stopped) return;
        this.start();
    }

    setRepeatFunction(repeat) {
        this.repeat = repeat;
    }

    pause() {
        let refCount = this.refreshCount;
        this.stop();
        this.refreshCount = refCount;
    }


    start() {
        if (this.threadId == null) {
            let that = this;
            this._isRunning = true;
            this.stopped = false;
            this.threadId = requestAnimationFrame(function repeat() {
                that.refreshCount++;
                that.loop(that.refreshCount);
            });
            if (this.debug) {
                console.log(this.threadId + " 就绪");
            }
        }
    }

    stop() {
        // if (this.threadId != null || this.threadId == undefined) {
            if (this.debug) {
                console.log(this.threadId + " 停止");
            }
            this.stopped = true;
            cancelAnimationFrame(this.threadId);
            this.threadId = null;
            this._isRunning = false;
            if (this.stopcallback) {
                this.stopcallback(this.refreshCount);
            }
            this.refreshCount = 0;
        // }
    }
}