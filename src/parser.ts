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
interface State {
    predict(cache: RefCache): State[];

    complete(): State[];

    scan(ch: string): State[];

    next(result: any): State[];
}

interface Expr {
    start(parent: State, cache: RefCache): State[];
}

export class Stats {
    constructor(private line: number = 1, private char: number = 0, private total: number = 0) { }
    public accept(ch: string) {
        this.total += ch.length;
        if (ch == "\n") {
            this.line++;
            this.char = 0;
        } else {
            this.char += ch.length;
        }
    }

    wrap(e: Error): Error {
        if (e instanceof ParseError) {
            throw e.at(this);
        } else {
            throw e;
        }
    }

    toString(): string {
        return `at line ${this.line}: ${this.char} (${this.total})`;
    }
}

export class ParseError extends Error {
    private stats: Stats;
    constructor(message: string) {
        super(message);
    }
    public at(stats: Stats): ParseError {
        this.stats = stats;
        this.message += " " + stats;
        return this;
    }
}

class RootState implements State {
    constructor(private rule: Expr, public isComplete: boolean = false, public result: any = {}) { }
    public predict(cache: RefCache): State[] {
        if (!this.isComplete) {
            return this.rule.start(this, cache);
        }
        return [];
    }
    public next(result: any): State[] {
        return [new RootState(this.rule, true, result)];
    }
    public complete(): State[] {
        return [];
    }
    public scan(ch: string) {
        return [];
    }
}

class Ref implements Expr {
    constructor(private name: string) { }

    public start(parent: State, cache: RefCache): State[] {
        return cache.get(this.name, parent);
    }
}

class RefState implements State {
    constructor(private name: string, private expr: Expr, public parents: State[], private isComplete: boolean = false, private result: any[] = []) {
    }
    public predict(cache: RefCache): State[] {
        if (!this.isComplete) {
            return this.expr.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parents.map(p => p.next({ [this.name]: this.result })).reduce((a, r) => a.concat(r), []);
        }
        return [];
    }
    public next(result: any): State[] {
        return [new RefState(this.name, this.expr, this.parents, true, [...this.result, result])];
    }
    public scan(ch: string) {
        return [];
    }
}

class RefCache {
    private cache = new Map<string, RefState>();
    constructor(private rules: Map<string, Expr>) { }

    get(name: string, parent: State): State[] {
        let state = this.cache.get(name);
        if (state instanceof RefState) {
            state.parents.push(parent);
            return [];
        }
        let rule = this.rules.get(name);
        if (rule === undefined) {
            throw new ParseError("Rule undefined: " + name);
        }
        state = new RefState(name, rule, [parent]);
        this.cache.set(name, state);
        return [state];
    }
}

class SeqState implements State {
    constructor(private parent: State, private symbols: Expr[], private pos = 0, private result: any[] = []) {
    }
    public predict(cache: RefCache): State[] {
        if (this.pos < this.symbols.length) {
            return this.symbols[this.pos].start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.pos == this.symbols.length) {
            return this.parent.next(this.result);
        }
        return [];
    }
    public next(result: any): State[] {
        return [new SeqState(this.parent, this.symbols, this.pos + 1, [...this.result, result])];
    }
    public scan(ch: string) {
        return [];
    }
}

class Sequence implements Expr {
    constructor(private symbols: Expr[]) { }
    public start(parent: State, cache: RefCache): State[] {
        return [new SeqState(parent, this.symbols)];
    }
}

class Options implements Expr {
    constructor(public options: Expr[]) { }
    public start(parent: State, cache: RefCache): State[] {
        return this.options.map(o => o.start(parent, cache)).reduce((a, r) => a.concat(r), []);
    }
}

class RangeState implements State {
    constructor(private parent: State, private range: RangeExpr, private count = 0, private result: any[] = []) {
    }
    public predict(cache: RefCache): State[] {
        if (this.count < this.range.high) {
            return this.range.symbol.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.count >= this.range.low && this.count <= this.range.high) {
            return this.parent.next(this.result);
        }
        return [];
    }
    public next(result: any): State[] {
        return [new RangeState(this.parent, this.range, this.count + 1, [...this.result, result])];
    }
    public scan(ch: string) {
        return [];
    }
}

class UnboundedRangeState implements State {
    constructor(private parent: State, private range: RangeExpr, private count = 0, private result: any[] = []) {
    }
    public predict(cache: RefCache): State[] {
        return this.range.symbol.start(this, cache);
    }
    public complete(): State[] {
        if (this.count >= this.range.low) {
            return this.parent.next(this.result);
        }
        return [];
    }
    public next(result: any): State[] {
        return [new UnboundedRangeState(this.parent, this.range, this.count + 1, [...this.result, result])];
    }
    public scan(ch: string) {
        return [];
    }
}

class RangeExpr implements Expr {
    constructor(public symbol: Expr, public low: number, public high: number) { }
    public start(parent: State): State[] {
        if (this.high == -1) {
            return [new UnboundedRangeState(parent, this)];
        }
        return [new RangeState(parent, this)];
    }
}

class LiteralState implements State {
    constructor(private parent: State, private literal: string[], private pos = 0, private result = "") {
    }
    public predict(cache: RefCache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (this.pos < this.literal.length && this.literal[this.pos] == ch) {
            return [new LiteralState(this.parent, this.literal, this.pos + 1, this.result + ch)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.pos == this.literal.length) {
            return this.parent.next(this.result);
        }
        return [];
    }
}

class Literal implements Expr {
    literal: string[];
    constructor(literal: string) {
        this.literal = [...literal];
    }

    public start(parent: State): State[] {
        return [new LiteralState(parent, this.literal)];
    }
}

class DotState implements State {
    constructor(private parent: State, private isComplete = false, private result = "") {
    }
    public predict(cache: RefCache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (!this.isComplete) {
            return [new DotState(this.parent, true, ch)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.result);
        }
        return [];
    }
}

class Dot implements Expr {
    public start(parent: State): State[] {
        return [new DotState(parent)];
    }
}

class RegExState implements State {
    constructor(private parent: State, private chars: RegExp, private isComplete: boolean = false, private result = "") {
    }
    public predict(cache: RefCache): State[] {
        return [];
    }
    public next(result: any): State[] {
        return [];
    }
    public scan(ch: string): State[] {
        if (!this.isComplete && this.chars.test(ch)) {
            return [new RegExState(this.parent, this.chars, true, ch)];
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            return this.parent.next(this.result);
        }
        return [];
    }
}

// the intention is to only match character classes, i.e. [a-zA-Z0-9]
class RegularExpr implements Expr {
    chars: RegExp;
    constructor(charclass: string) {
        this.chars = new RegExp(charclass);
    }

    start(parent: State): State[] {
        return [new RegExState(parent, this.chars)];
    }
}

export interface Parser {
    parse(input: Iterable<string>): any;
}

export default class Grammar {
    constructor(private root: string, private rules = new Map<string, Expr>()) { }

    public add(name: string, rhs: Expr) {
        if (this.rules.has(name)) {
            let exist = this.rules.get(name);
            if (exist instanceof Options) {
                exist.options.push(rhs);
            } else {
                this.rules.set(name, new Options([exist, rhs]))
            }
        } else {
            this.rules.set(name, rhs);
        }
    }

    GParser = class implements Parser {
        constructor(private grammar: Grammar) { }

        private accept(ch: string, stats: Stats, states: State[]): State[] {
            stats.accept(ch);
            let cache = new RefCache(this.grammar.rules);
            var next: State[] = [];
            try {
                while (states.length > 0) {
                    var state: State = states.pop();
                    states.push(...state.predict(cache));
                    states.push(...state.complete());
                    if (ch != "") {
                        next.push(...state.scan(ch));
                    } else if (state instanceof RootState && state.isComplete) {
                        next.push(state);
                    }
                }
            } catch (e) {
                throw stats.wrap(e);
            }
            if (next.length == 0) {
                throw new ParseError(ch == "" ? "No more input" : "No production match").at(stats);
            }
            return next;
        }

        public parse(input: Iterable<string>): any {
            let stats = new Stats();
            var states: State[] = [new RootState(new Ref(this.grammar.root))];
            for (var ch of input) {
                states = this.accept(ch, stats, states);
            }
            states = this.accept("", stats, states);
            return (states.pop() as RootState).result;
        }
    };

    public parser(): Parser {
        return new this.GParser(this);
    }

    public parse(input: Iterable<string>): any {
        return this.parser().parse(input);
    }
}

export function dot(): Expr {
    return new Dot();
}

export function lit(expr: string): Expr {
    return new Literal(expr);
}

export function cc(expr: string): Expr {
    return new RegularExpr(expr);
}

export function seq(...exprs: Expr[]): Expr {
    return new Sequence(exprs);
}

export function opt(...exprs: Expr[]): Expr {
    return new Options(exprs);
}

export function range(expr: Expr, low: number, high: number): Expr {
    return new RangeExpr(expr, low, high);
}

export function optional(expr: Expr): Expr {
    return range(expr, 0, 1);
}

export function required(expr: Expr): Expr {
    return range(expr, 1, -1);
}

export function repeated(expr: Expr): Expr {
    return range(expr, 0, -1);
}

export function ref(name: string): Expr {
    return new Ref(name);
}
