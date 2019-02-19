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

    static get PIDIV180(){
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

}