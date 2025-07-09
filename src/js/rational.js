export default class Rational {
    static One = new Rational(1, 1);
    static Zero = new Rational(0, 1);
    _num;
    _den;
    constructor(num, den) {
        if (Math.floor(num) !== num)
            throw new Error('Numerator must be an integer');
        if (Math.floor(den) !== den)
            throw new Error('Denominator must be an integer');
        if (den === 0)
            throw new Error('Denominator cannot be zero');
        if (den < 0) {
            num *= -1;
            den *= -1;
        }
        const gcd = Rational.gcd(Math.abs(num), den);
        this._num = num / gcd;
        this._den = den / gcd;
    }
    static fromString(str) {
        const fractionIndex = str.indexOf('/');
        if (fractionIndex === -1) {
            const num = parseInt(str);
            if (num === Number.NaN) {
                throw new Error('Number must be an integer');
            }
            return new Rational(num, 1);
        }
        const num = parseInt(str.substring(0, fractionIndex));
        if (num === Number.NaN) {
            throw new Error('Numerator must be an integer');
        }
        const den = parseInt(str.substring(fractionIndex + 1));
        if (num === Number.NaN) {
            throw new Error('Denominator must be an integer');
        }
        return new Rational(num, den);
    }
    static gcd(a, b) {
        if (b === 0)
            return a;
        return Rational.gcd(b, a % b);
    }
    inc() {
        return this.add(Rational.One);
    }
    dec() {
        return this.sub(Rational.One);
    }
    neg() {
        return new Rational(-this._num, this._den);
    }
    inv() {
        return new Rational(this._den, this._num);
    }
    add(that) {
        return new Rational(this._num * that._den + that._num * this._den, this._den * that._den);
    }
    sub(that) {
        return this.add(that.neg());
    }
    mul(that) {
        return new Rational(this._num * that._num, this._den * that._den);
    }
    div(that) {
        return this.mul(that.inv());
    }
    eq(that) {
        return this._num === that._num && this._den === that._den;
    }
    lt(that) {
        return this.sub(that)._num < 0;
    }
    lte(that) {
        return this.sub(that)._num <= 0;
    }
    gt(that) {
        return this.sub(that)._num > 0;
    }
    gte(that) {
        return this.sub(that)._num >= 0;
    }
    str() {
        return this._den === 1 ? this._num + '' : `${this._num}/${this._den}`;
    }
    flt() {
        return this._num / this._den;
    }
}
