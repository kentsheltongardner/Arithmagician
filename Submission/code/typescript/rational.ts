export default class Rational {
    public static readonly One  = new Rational(1, 1)
    public static readonly Zero = new Rational(0, 1)

    private _num: number
    private _den: number

    constructor(num: number, den: number) {
        if (Math.floor(num) !== num) throw new Error('Numerator must be an integer')
        if (Math.floor(den) !== den) throw new Error('Denominator must be an integer')
        if (den === 0) throw new Error('Denominator cannot be zero')
        if (den < 0) {
            num *= -1
            den *= -1
        }
        const gcd = Rational.gcd(Math.abs(num), den)
        this._num = num / gcd
        this._den = den / gcd
    }
    
    public static fromString(str: string): Rational {
        const fractionIndex = str.indexOf('/')
        if (fractionIndex === -1) {
            const num = parseInt(str)
            if (num === Number.NaN) {
                throw new Error('Number must be an integer')
            }
            return new Rational(num, 1)
        }
        const num = parseInt(str.substring(0, fractionIndex))
        if (num === Number.NaN) {
            throw new Error('Numerator must be an integer')
        }
        const den = parseInt(str.substring(fractionIndex + 1))
        if (num === Number.NaN) {
            throw new Error('Denominator must be an integer')
        }
        return new Rational(num, den)
    }

    private static gcd(a: number, b: number): number {
        if (b === 0) return a
        return Rational.gcd(b, a % b)
    }

    public inc(): Rational {
        return this.add(Rational.One)
    }
    public dec(): Rational {
        return this.sub(Rational.One)
    }
    public neg(): Rational {
        return new Rational(-this._num, this._den)
    }
    public inv(): Rational {
        return new Rational(this._den, this._num)
    }

    public add(that: Rational): Rational {
        return new Rational(this._num * that._den + that._num * this._den, this._den * that._den)
    }
    public sub(that: Rational): Rational {
        return this.add(that.neg())
    }
    public mul(that: Rational): Rational {
        return new Rational(this._num * that._num, this._den * that._den)
    }
    public div(that: Rational): Rational {
        return this.mul(that.inv())
    }

    public eq(that: Rational): boolean {
        return this._num === that._num && this._den === that._den
    }
    public lt(that: Rational): boolean {
        return this.sub(that)._num < 0
    }
    public lte(that: Rational): boolean {
        return this.sub(that)._num <= 0
    }
    public gt(that: Rational): boolean {
        return this.sub(that)._num > 0
    }
    public gte(that: Rational): boolean {
        return this.sub(that)._num >= 0
    }

    public str(): string {
        return this._den === 1 ? this._num + '' : `${this._num}/${this._den}`
    }
    public flt(): number {
        return this._num / this._den
    }
}