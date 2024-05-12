import { State, Expr, ParseError, Cache, concat } from "./core";

class RootState implements State {
    constructor(private rule: Expr, public isComplete: boolean = false, public buffer: any = undefined) { }
    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.rule.start(this, cache);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new RootState(this.rule, true, update)];
    }
    public complete(): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    public isEnd(): boolean {
        return this.isComplete;
    }
    public toString(): string {
        return "<ROOT>";
    }
}

class Merge implements Expr {
    constructor(public expr: Expr) { }
    public start(parent: State, cache: Cache): State[] {
        return [new MergeState(this, parent, parent.result())];
    }
    public toString(): string {
        return this.expr.toString();
    }
}

class MergeState implements State {
    constructor(private merge: Merge, public parent: State, private buffer: any, private isComplete: boolean = false) { }
    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.merge.expr.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new MergeState(this.merge, this.parent, concat(this.buffer, update), true)];
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
        return this.merge.toString();
    }
}

class Label implements Expr {
    constructor(public label: string, public expr: Expr) { }
    public start(parent: State, cache: Cache): State[] {
        return [new LabelState(this, parent, parent.result())];
    }
    public toString(): string {
        return `${this.label}:${this.expr}`;
    }
}

class LabelState implements State {
    constructor(private label: Label, public parent: State, private buffer: any, private isComplete: boolean = false) { }
    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.label.expr.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    set(value: any): any {
        if (typeof this.buffer == "string") {
            throw new ParseError(`cannot set with string accumulation`);
        }
        if (value == undefined) {
            return this.buffer;
        }
        if (this.label.label.endsWith("[]")) {
            let key = this.label.label.slice(0, -2);
            let val: any[];
            if (this.buffer.hasOwnProperty(key)) {
                val = [...this.buffer[key], value];
            } else {
                val = [value];
            }
            return Object.assign({}, this.buffer, { [key]: val });
        }
        return Object.assign({}, this.buffer, { [this.label.label]: value });
    }
    public next(update: any): State[] {
        return [new LabelState(this.label, this.parent, this.set(update), true)];
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
        return this.label.toString();
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

class RefState implements State {
    constructor(private ref: string, private expr: Expr, public parents: State[], private buffer: any = undefined,
        private isComplete: boolean = false) {
    }
    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.expr.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parents.map(p => p.next(this.buffer)).reduce((a, r) => a.concat(r), []);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new RefState(this.ref, this.expr, this.parents, update, true)];
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
        return this.ref;
    }
}
