export interface Cache {
    getState(ref: string): State;
    setState(ref: string, state: State);
    getRule(ref: string): Expr;
}

/**
 * A state of partial match during a parse. "State" is borrowed from Earley's white paper 
 * (archived at https://web.archive.org/web/20040708052627/http://www-2.cs.cmu.edu/afs/cs.cmu.edu/project/cmt-55/lti/Courses/711/Class-notes/p94-earley.pdf)
 * and is probably a poor name for this object in this OO version of the algoritm. 
 * 
 * A few upfront definitions: A Grammar is built of a series of Rules, one of which is called the Root. A Rule is a name plus an Expression.
 * An Expression, at least for purposes of this discussion, is a factory for producing States. The expression in a rule is called the 
 * right hand side (RHS) and is the root of a directed acyclic graph of Expressions. 
 * 
 * An Expression will either explicitly target characters from the input (called a terminal) or reference other expressions (non-terminals). During the parse,
 * an expression will "start", producing zero or more states. A state will either "predict" non-terminals or "scan" terminals as it walks a path on the
 * Expression DAG. When it reaches the end of the path it will "complete" calling "next" on the state that predicted it. 
 * 
 */
export interface State {
    predict(cache: Cache): State[];

    complete(): State[];

    scan(ch: string, log: Console): State[];

    next(update: any): State[];

    result(): any;

    isEnd(): boolean;
}

export interface Expr {
    start(parent: State, cache: Cache): State[];
}

export class ParseError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export function concat(...arr: any[]): any {
    let result = "";
    for (let e of arr) {
        if (e == undefined) {
            continue;
        }
        if (typeof e == "string") {
            result += e;
        } else {
            return e;
        }
    }
    return result == "" ? undefined : result;
}

export abstract class BaseState implements State {
    constructor(protected parent: State, protected buffer: any = undefined) { }
    abstract prefix(): string;

    public predict(cache: Cache): State[] {
        return [];
    }
    public complete(): State[] {
        return [];
    }
    public next(update: any): State[] {
        return [];
    }
    public scan(ch: string, log: Console): State[] {
        return [];
    }
    public result(): any {
        return this.buffer;
    }
    public isEnd(): boolean {
        return false;
    }
    public toString(): string {
        let s = this.prefix();
        if (this.parent === undefined) {
            return s;
        }
        return s ? `${this.parent} ${s}` : `${this.parent}`;
    }
}

export abstract class BaseSeqState extends BaseState {
    constructor(parent: State, buffer: any, protected pos = 0) {
        super(parent, buffer);
    }

    abstract start(cache: Cache): State[];
    abstract advance(update: any, newPos: number): State;
    abstract isPending(): boolean;
    abstract isComplete(): boolean;

    public predict(cache: Cache): State[] {
        if (this.isPending()) {
            return this.start(cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete()) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public next(update: any): State[] {
        return [this.advance(update, this.pos + 1)];
    }
}

export abstract class BaseSingleState extends BaseState {
    constructor(parent: State, buffer: any = undefined, protected isComplete: boolean = false) {
        super(parent, buffer);
    }
    abstract start(cache: Cache): State[];
    abstract advance(buffer: any, completed: boolean): State;

    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.start(cache);
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
        return [this.advance(update, true)];
    }
}

export abstract class BaseTerminalState extends BaseState {
    constructor(parent: State, buffer: any, private match: string = "") {
        super(parent, buffer);
    }
    abstract isComplete(): boolean;
    abstract accept(ch: string): boolean;
    abstract advance(update: any, newMatch: string): State;
    abstract lookahead(): string;

    public scan(ch: string, log: Console): State[] {
        if (this.isComplete()) {
            return [];
        }
        if (this.accept(ch)) {
            log.info(`✔ ${this}`);
            return [this.advance(concat(this.buffer, ch), this.match + ch)];
        }
        log.info(`✘ ${this}`);
        return [];
    }
    public complete(): State[] {
        if (this.isComplete()) {
            return this.parent.next(this.buffer);
        }
        return [];
    }
    public prefix(): string {
        if (this.match) {
            return this.isComplete() ? `'${this.match}'` : `'${this.match}' ● ${this.lookahead()}`
        }
        return this.isComplete() ? undefined : `● ${this.lookahead()}`
    }
}
