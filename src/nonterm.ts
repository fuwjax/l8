
import { State, Expr, Cache, BaseSeqState } from "./core";

export class Sequence implements Expr {
    constructor(private symbols: Expr[]) { }
    State = class extends BaseSeqState {
        constructor(private seq: Sequence, parent: State, buffer: any, pos = 0) {
            super(parent, buffer, pos);
        }
        isComplete(): boolean {
            return this.pos == this.seq.symbols.length;
        }
        isPending(): boolean {
            return this.pos < this.seq.symbols.length;
        }
        start(cache: Cache): State[] {
            return this.seq.symbols[this.pos].start(this, cache);
        }
        advance(update: any, newPos: number): BaseSeqState {
            return new this.seq.State(this.seq, this.parent, update, newPos);
        }
        prefix(): string {
            return this.seq.symbols.slice(0, this.pos).join(" ");
        }
    }
    public start(parent: State, cache: Cache): State[] {
        return [new this.State(this, parent, parent.result())];
    }
    public toString(): string {
        return this.symbols.join(" ");
    }
}

export class Options implements Expr {
    constructor(public options: Expr[]) { }
    public start(parent: State, cache: Cache): State[] {
        return this.options.map(o => o.start(parent, cache)).reduce((a, r) => a.concat(r), []);
    }
    public toString(): string {
        return this.options.join(" | ");
    }
}

export class RangeExpr implements Expr {
    constructor(public symbol: Expr, public low: number, public high: number = Number.MAX_SAFE_INTEGER) {
        if (this.high < this.low) {
            throw new Error(`low ${this.low} must be less than or equal to high ${this.high}`);
        }
    }
    State = class extends BaseSeqState {
        constructor(private range: RangeExpr, parent: State, buffer: any, count = 0) {
            super(parent, buffer, count);
        }
        isComplete(): boolean {
            return this.pos >= this.range.low && this.pos <= this.range.high
        }
        isPending(): boolean {
            return this.pos < this.range.high;
        }
        start(cache: Cache): State[] {
            return this.range.symbol.start(this, cache);
        }
        advance(update: any, newPos: number): BaseSeqState {
            return new this.range.State(this.range, this.parent, update, newPos);
        }
        prefix(): string {
            if (this.pos == 0) {
                return "";
            }
            if (this.pos == 1) {
                return `${this.range.symbol}`;
            }
            return `(${this.range.symbol})+`;
        }
    }
    public start(parent: State): State[] {
        return [new this.State(this, parent, parent.result())];
    }
    public toString(): string {
        if (this.high == Number.MAX_SAFE_INTEGER) {
            if (this.low == 0) {
                return `${this.symbol}*`;
            } else if (this.low == 1) {
                return `${this.symbol}+`;
            }
            return `${this.symbol}{${this.low},}`;
        } else if (this.high == 1 && this.low == 0) {
            return `${this.symbol}?`;
        } else if (this.high == this.low) {
            return `${this.symbol}{${this.low}}`;
        }
        return `${this.symbol}{${this.low},${this.high}}`;
    }
}
