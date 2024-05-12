
import { State, Expr, Cache, concat } from "./core";

class LiteralState implements State {
    constructor(private parent: State, private literal: string[], private buffer: any, private pos = 0) {
    }
    public predict(cache: Cache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (this.pos < this.literal.length && this.literal[this.pos] == ch) {
            return [new LiteralState(this.parent, this.literal, concat(this.buffer, ch), this.pos + 1)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.pos == this.literal.length) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        return '"' + this.literal.slice(0, this.pos).join("") + "·" + this.literal.slice(this.pos).join("") + '"';
    }
}

export class Literal implements Expr {
    literal: string[];
    constructor(literal: string) {
        this.literal = [...literal];
    }

    public start(parent: State): State[] {
        return [new LiteralState(parent, this.literal, parent.result())];
    }

    public toString(): string {
        return '"' + this.literal.join("") + '"';
    }
}

class DotState implements State {
    constructor(private parent: State, private buffer: any, private isComplete = false) {
    }
    public predict(cache: Cache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (!this.isComplete) {
            return [new DotState(this.parent, concat(this.buffer, ch), true)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        if (this.isComplete) {
            return ".·";
        }
        return '·.';
    }
}

export class Dot implements Expr {
    public start(parent: State): State[] {
        return [new DotState(parent, parent.result())];
    }
    public toString(): string {
        return '.';
    }
}

class RegExState implements State {
    constructor(private parent: State, private chars: RegExp, private buffer: any, private isComplete: boolean = false) {
    }
    public predict(cache: Cache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (!this.isComplete && this.chars.test(ch)) {
            return [new RegExState(this.parent, this.chars, concat(this.buffer, ch), true)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    isEnd(): boolean {
        return false;
    }
    public toString(): string {
        if (this.isComplete) {
            return `${this.chars}·`;
        }
        return `·${this.chars}`;
    }
}

// the intention is to only match character classes, i.e. [a-zA-Z0-9]
export class RegularExpr implements Expr {
    chars: RegExp;
    constructor(charclass: string | RegExp) {
        this.chars = new RegExp(charclass);
    }

    start(parent: State): State[] {
        return [new RegExState(parent, this.chars, parent.result())];
    }
    public toString(): string {
        return this.chars.toString();
    }
}
