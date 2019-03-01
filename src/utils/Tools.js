const EPSILON = 0.00001;
const PI2 = Math.PI * 2;
const PIDIV180 = Math.PI / 180;
export default class Tools {
    static overlaps(bounds1, bounds2) {
        let a = bounds1;
        let b = bounds2;
        return (a.left <= b.right && a.right >= b.left
            && a.bottom >= b.top && a.top <= b.bottom);
    }

    static get PIDIV180() {
        return PIDIV180;
    }

    static get PI2() {
        return PI2;
    }

    static get EPSILON() {
        return EPSILON;
    }

    static equals(a, b) {
        // return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
        return Math.abs(a - b) <= EPSILON;
    }

    static clamp(value, min, max) {
        if (value > max) {
            return max;
        }
        if (value < min) {
            return min;
        }
        return value;
    }

    static loadResource(fntFileURL, callbacks) {

        callbacks = callbacks || {};
        fntFileURL = fntFileURL.replace(/\\/g, '/');
        let parentDir = '';
        let index = fntFileURL.lastIndexOf('/');
        if (index != -1) {
            parentDir = fntFileURL.slice(0, index);
            parentDir += '/';
        }

        if (typeof wx !== 'undefined') {
            wx.getFileSystemManager().readFile({
                filePath: fntFileURL,
                encoding: 'utf8',
                success: function (res) {
                    if (callbacks.success) {
                        callbacks.success(res.data, parentDir);
                    }
                },
                fail: function (res) {
                    if (callbacks.fail) {
                        callbacks.fail(res.errMsg);
                    }
                },
                complete: function () {
                    if (callbacks.complete) {
                        callbacks.complete();
                    }
                }
            });
        } else {
            let request = new XMLHttpRequest();
            request.open('GET', fntFileURL, true);
            request.responseType = 'text';
            request.onload = function (evt) {
                if (request.status == 200) {
                    let text = request.responseText;
                    if (callbacks.success) {
                        callbacks.success(text, parentDir);
                    }
                } else {
                    if (callbacks.fail) {
                        callbacks.fail(request.statusText);
                    }
                }
            };
            request.send(null);
            if (callbacks.complete) {
                callbacks.complete();
            }
        }
    }

}