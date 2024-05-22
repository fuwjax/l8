import { State, Expr, ParseError, Cache, concat, BaseSingleState } from "./core";

class RootState extends BaseSingleState {
    constructor(private rule: Expr, isComplete: boolean = false, buffer: any = undefined) {
        super(undefined, buffer, isComplete)
    }
    public start(cache: Cache): State[] {
        return this.rule.start(this, cache);
    }
    public advance(buffer: any, completed: boolean): State {
        return new RootState(this.rule, completed, buffer)
    }
    public complete(): State[] {
        return [];
    }
    public isEnd(): boolean {
        return this.isComplete;
    }
    public prefix(): string {
        return this.isComplete ? "$" : "";
    }
}


class Merge implements Expr {
    constructor(public expr: Expr) { }
    State = class extends BaseSingleState {
        constructor(private merge: Merge, parent: State, buffer: any, isComplete: boolean = false) {
            super(parent, buffer, isComplete);
        }
        public advance(buffer: any, completed: boolean): State {
            return new this.merge.State(this.merge, this.parent, buffer, completed);
        }
        public start(cache: Cache): State[] {
            return this.merge.expr.start(this, cache);
        }
        public prefix(): string {
            return undefined; // this is a synthetic state
        }
        public next(update: any): State[] {
            return super.next(concat(this.buffer, update));
        }
    }
    public start(parent: State, cache: Cache): State[] {
        return [new this.State(this, parent, parent.result())];
    }
    public toString(): string {
        return this.expr.toString();
    }
}

class Label implements Expr {
    constructor(public label: string, public expr: Expr) { }
    State = class extends BaseSingleState {
        constructor(private label: Label, parent: State, buffer: any, isComplete: boolean = false) {
            super(parent, buffer, isComplete);
        }
        public advance(buffer: any, completed: boolean): State {
            return new this.label.State(this.label, this.parent, buffer, completed);
        }
        public start(cache: Cache): State[] {
            return this.label.expr.start(this, cache);
        }
        public prefix(): string {
            return undefined; // this is a synthetic state
        }
        private set(value: any): any {
            if (value == undefined) {
                return this.buffer;
            }
            let buff: object;
            if (typeof this.buffer != "object") {
                buff = {};
            } else {
                buff = Object.assign({}, this.buffer);
            }
            if (this.label.label.endsWith("[]")) {
                let key = this.label.label.slice(0, -2);
                let val: any[];
                if (buff.hasOwnProperty(key)) {
                    buff[key] = [...buff[key], value];
                } else {
                    buff[key] = [value];
                }
            } else {
                buff[this.label.label] = value;
            }
            return buff;
        }
        public next(update: any): State[] {
            return super.next(this.set(update));
        }
    }
    public start(parent: State, cache: Cache): State[] {
        return [new this.State(this, parent, parent.result())];
    }
    public toString(): string {
        return `${this.label}:${this.expr}`;
    }
}

export class Ref implements Expr {
    constructor(public name: string) { }

    public start(parent: State, cache: Cache): State[] {
        let state = cache.getState(this.name);
        if (state instanceof RefState) {
            state.parents.push(parent);
            return [];
        }
        let rule = cache.getRule(this.name);
        if (rule === undefined) {
            throw new ParseError("Rule undefined: " + this.name);
        }
        state = new RefState(this.name, rule, [parent]);
        cache.setState(this.name, state);
        return [state];
    }

    public root(): State[] {
        return [new RootState(this)];
    }

    public label(label: string): Expr {
        return new Label(label, this);
    }

    public merge(): Expr {
        return new Merge(this);
    }

    public toString(): string {
        return this.name;
    }
}

class RefState extends BaseSingleState {
    constructor(private ref: string, private expr: Expr, public parents: State[], buffer: any = undefined,
        isComplete: boolean = false) {
        super(undefined, buffer, isComplete);
    }
    public advance(buffer: any, completed: boolean): State {
        return new RefState(this.ref, this.expr, this.parents, buffer, completed);
    }
    public start(cache: Cache): State[] {
        return this.expr.start(this, cache);
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parents.map(p => p.next(this.buffer)).reduce((a, r) => a.concat(r), []);
        }
        return [];
    }
    public prefix(): string {
        return this.isComplete ? this.ref : "";
    }
}
