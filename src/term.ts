
import { State, Expr, BaseTerminalState } from "./core";

export class Literal implements Expr {
    private literal: string[];
    constructor(literal: string) {
        //        console.log((typeof literal) + JSON.stringify(literal));
        this.literal = [...literal];
    }
    State = class extends BaseTerminalState {
        constructor(private literal: Literal, parent: State, buffer: any = parent.result(), match: string = "", private pos = 0) {
            super(parent, buffer, match);
        }
        public isComplete(): boolean {
            return this.pos == this.literal.literal.length;
        }
        public advance(update: any, match: string): State {
            return new this.literal.State(this.literal, this.parent, update, match, this.pos + 1);
        }
        public accept(ch: string): boolean {
            return this.literal.literal[this.pos] == ch;
        }
        public lookahead(): string {
            return "'" + this.literal.literal.slice(this.pos).join("") + "'";
        }
    }
    public start(parent: State): State[] {
        return [new this.State(this, parent)];
    }
    public toString(): string {
        return '"' + this.literal.join("") + '"';
    }
}

export class Dot implements Expr {
    State = class extends BaseTerminalState {
        constructor(parent: State, buffer: any = parent.result(), match: string = "", private completed = false) {
            super(parent, buffer, match);
        }
        public isComplete(): boolean {
            return this.completed;
        }
        public advance(update: any, match: string): State {
            return new DOT.State(this.parent, update, match, true);
        }
        public accept(ch: string): boolean {
            return true;
        }
        public lookahead(): string {
            return ".";
        }
    }
    public start(parent: State): State[] {
        return [new this.State(parent)];
    }
    public toString(): string {
        return '.';
    }
}
const DOT = new Dot();

// the intention is to only match single character patterns like character classes, i.e. [a-zA-Z0-9]
export class RegularExpr implements Expr {
    public chars: RegExp;
    constructor(charclass: string | RegExp) {
        this.chars = new RegExp(charclass);
    }
    State = class extends BaseTerminalState {
        constructor(private re: RegularExpr, parent: State, buffer: any = parent.result(), match: string = "", private completed = false) {
            super(parent, buffer, match);
        }
        public accept(ch: string): boolean {
            return this.re.chars.test(ch);
        }
        public advance(update: any, newMatch: string): State {
            return new this.re.State(this.re, this.parent, update, newMatch, true);
        }
        public isComplete(): boolean {
            return this.completed;
        }
        public lookahead(): string {
            return `${this.re.chars}`;
        }
    }
    public start(parent: State): State[] {
        return [new this.State(this, parent)];
    }
    public toString(): string {
        return this.chars.toString();
    }
}
