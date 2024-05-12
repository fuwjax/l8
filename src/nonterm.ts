
import { State, Expr, Cache } from "./core";

class SeqState implements State {
    constructor(private parent: State, private symbols: Expr[], private buffer: any, private pos = 0) {
    }
    public predict(cache: Cache): State[] {
        if (this.pos < this.symbols.length) {
            return this.symbols[this.pos].start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.pos == this.symbols.length) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new SeqState(this.parent, this.symbols, update, this.pos + 1)];
    }
    public scan(ch: string): State[] {
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        return this.symbols.slice(0, this.pos).join(" ") + "·" + this.symbols.slice(this.pos).join(" ");
    }
}

export class Sequence implements Expr {
    constructor(private symbols: Expr[]) { }
    public start(parent: State, cache: Cache): State[] {
        return [new SeqState(parent, this.symbols, parent.result())];
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

class RangeState implements State {
    constructor(private parent: State, private range: RangeExpr, private buffer: any, private count = 0) {
    }
    public predict(cache: Cache): State[] {
        if (this.count < this.range.high) {
            return this.range.symbol.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.count >= this.range.low && this.count <= this.range.high) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new RangeState(this.parent, this.range, update, this.count + 1)];
    }
    public scan(ch: string): State[] {
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        return `${this.range.symbol}{${this.count}}·`;
    }
}

class UnboundedRangeState implements State {
    constructor(private parent: State, private range: RangeExpr, private buffer: any, private count = 0) {
    }
    public predict(cache: Cache): State[] {
        return this.range.symbol.start(this, cache);
    }
    public complete(): State[] {
        if (this.count >= this.range.low) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new UnboundedRangeState(this.parent, this.range, update, this.count + 1)];
    }
    public scan(ch: string) {
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        return `${this.range.symbol}{${this.count}}·`;
    }
}

export class RangeExpr implements Expr {
    constructor(public symbol: Expr, public low: number, public high: number) {
        if (this.high != -1 && this.high < this.low) {
            throw new Error(`low ${this.low} must be less than or equal to high ${this.high}`);
        }
    }
    public start(parent: State): State[] {
        if (this.high == -1) {
            return [new UnboundedRangeState(parent, this, parent.result())];
        }
        return [new RangeState(parent, this, parent.result())];
    }
    public toString(): string {
        if (this.high == -1) {
            if (this.low == 0) {
                return this.symbol + "*";
            } else if (this.low == 1) {
                return this.symbol + "+";
            }
        } else if (this.high == 1 && this.low == 0) {
            return this.symbol + "?";
        } else if (this.high == this.low) {
            return `${this.symbol}{${this.low}}`;
        } else if (this.high == -1) {
            return `${this.symbol}{${this.low},}`;
        }
        return `${this.symbol}{${this.low},${this.high}}`;
    }
}
