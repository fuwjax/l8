import { State, Expr, ParseError, Cache, concat } from "./core";
import { Ref } from "./ref";
import { Sequence, Options, RangeExpr } from "./nonterm";
import { Dot, Literal, RegularExpr } from "./term";

export interface Parser {
    parse(input: Iterable<string>): any;
}

export interface StepParser {
    accept(ch: string);
    complete(): any;
}

class Rule implements Expr {
    rhs: Expr;
    startState: () => any;
    callback: (o: object) => any;
    constructor(public name: string, private hook: string, ...rhs: Expr[]) {
        this.rhs = seq(...rhs);
    }

    init(callbacks: object) {
        if (this.hook === undefined) {
            this.callback = o => o;
            this.startState = () => undefined;
        } else {
            this.startState = () => { return {} };
            this.callback = callbacks[this.hook];
            if (this.callback === undefined) {
                this.callback = (o: object) => o[this.hook];
            }
        }
    }

    start(parent: State, cache: Cache): State[] {
        return [new RuleState(this, parent, this.startState(), this.callback)];
    }

    add(...rhs: Expr[]) {
        if (this.rhs instanceof Options) {
            this.rhs.options.push(seq(...rhs));
        } else {
            this.rhs = opt(this.rhs, seq(...rhs));
        }
    }
    public toString(): string {
        return this.name;
    }
}

class RuleState implements State {
    constructor(private rule: Rule, public parent: State, private buffer: any,
        private hook: (o: object) => any = o => o, private isComplete: boolean = false) {
    }
    public predict(cache: Cache): State[] {
        if (!this.isComplete) {
            return this.rule.rhs.start(this, cache);
        }
        return [];
    }
    public complete(): State[] {
        if (this.isComplete) {
            let value = this.hook(this.buffer);
            return this.parent.next(value);
        }
        return [];
    }
    public next(update: any): State[] {
        return [new RuleState(this.rule, this.parent, update, this.hook, true)];
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
        return this.rule.toString();
    }
}

export default class Grammar {
    private rules: Map<string, Rule> = new Map<string, Rule>();
    constructor(private root: string, private callbacks = {}, ...rules: Rule[]) {
        for (let rule of rules) {
            this.add(rule);
        }
    }

    public add(rule: Rule) {
        if (this.rules.has(rule.name)) {
            this.rules.get(rule.name).add(rule.rhs);
        } else {
            rule.init(this.callbacks);
            this.rules.set(rule.name, rule);
        }
    }

    public configure(config: string) {
        let rules = sbnfg.parse(config);
        for (let rule of rules) {
            this.add(rule);
        }
    }

    StepParser = class implements StepParser {
        private line: number = 1;
        private char: number = 0;
        private total: number = 0;
        private states: State[];

        constructor(private grammar: Grammar) {
            this.states = new Ref(this.grammar.root).root();
        }

        RefCache = class implements Cache {
            private cache = new Map<string, State>();
            constructor(private grammar: Grammar) { }
            getState(ref: string): State {
                return this.cache.get(ref);
            }
            setState(ref: string, state: State) {
                this.cache.set(ref, state);
            }
            getRule(ref: string): Expr {
                return this.grammar.rules.get(ref);
            }
        }

        private stats(ch: string) {
            this.total += ch.length;
            if (ch == "\n") {
                this.line++;
                this.char = 0;
            } else {
                this.char += ch.length;
            }
        }

        private onError(e: Error): Error {
            e.message += ` at line ${this.line}: ${this.char} (${this.total})`;
            return e;
        }

        accept(ch: string) {
            this.stats(ch);
            let cache = new this.RefCache(this.grammar);
            var next: State[] = [];
            try {
                while (this.states.length > 0) {
                    var state: State = this.states.pop();
                    this.states.push(...state.predict(cache));
                    this.states.push(...state.complete());
                    if (ch != "") {
                        next.push(...state.scan(ch));
                    } else if (state.isEnd()) {
                        next.push(state);
                    }
                }
            } catch (e) {
                throw this.onError(e);
            }
            if (next.length == 0) {
                let escape = ch.replace('\n', '\\n').replace('\r', '\\r');
                throw this.onError(new ParseError(ch == "" ? "No more input" : `No production match for '${escape}'`));
            }
            this.states = next;
        }

        complete(): any {
            this.accept("");
            return this.states.pop().result();
        }
    }

    Parser = class implements Parser {
        constructor(private grammar: Grammar) { }

        public parse(input: Iterable<string>): any {
            let parse = this.grammar.stepParser();
            for (var ch of input) {
                parse.accept(ch);
            }
            return parse.complete();
        }
    };

    public parser(): Parser {
        return new this.Parser(this);
    }

    public stepParser(): StepParser {
        return new this.StepParser(this);
    }

    public parse(input: Iterable<string>): any {
        return this.parser().parse(input);
    }
}

export function hook(name: string, hook: string, ...rhs: Expr[]) {
    return new Rule(name, hook, ...rhs);
}

export function rule(name: string, ...rhs: Expr[]) {
    return hook(name, undefined, ...rhs);
}

export function dot(): Expr {
    return new Dot();
}

export function lit(expr: string): Expr {
    return new Literal(expr);
}

export function re(expr: string | RegExp): Expr {
    return new RegularExpr(expr);
}

export function seq(...exprs: Expr[]): Expr {
    if (exprs.length == 1) {
        return exprs[0];
    }
    return new Sequence(exprs);
}

export function opt(...exprs: Expr[]): Expr {
    if (exprs.length == 1) {
        return exprs[0];
    }
    return new Options(exprs);
}

export function range(expr: Expr, low: number, high: number): Expr {
    return new RangeExpr(expr, low, high);
}

export function optional(...exprs: Expr[]): Expr {
    return range(seq(...exprs), 0, 1);
}

export function required(...exprs: Expr[]): Expr {
    return range(seq(...exprs), 1, -1);
}

export function repeated(...exprs: Expr[]): Expr {
    return range(seq(...exprs), 0, -1);
}

export function ref(name: string, label: string = undefined): Expr {
    if (label === undefined) {
        return new Ref(name).merge();
    }
    return new Ref(name).label(label);
}

let WS = () => repeated(ref("WS"));
const sbnfg = new Grammar("grammar", {
    rule: (o: { name: string, hook: string, rhs: Expr }) => hook(o.name, o.hook, o.rhs),
    option: (o: { exprs: Expr[] }) => opt(...o.exprs),
    sequence: (o: { exprs: Expr[] }) => seq(...o.exprs),
    optional: (o: { expr: Expr }) => optional(o.expr),
    repeated: (o: { expr: Expr }) => repeated(o.expr),
    required: (o: { expr: Expr }) => required(o.expr),
    ref: (o: { name: string, label: string }) => ref(o.name, o.label),
    dot: () => dot(),
    literal: (o: { lit: string }) => lit(o.lit),
    regex: (o: { pattern: string }) => re(o.pattern),
},
    hook("grammar", "rules", WS(), ref("rule", "rules[]"), required(required(ref("WS")), ref("rule", "rules[]")), WS()),
    hook("rule", "rule", ref("ident", "name"), WS(), optional(lit("=>"), WS(), ref("ident", "hook"), WS()), lit("="), WS(), ref("expr", "rhs")),
    hook("expr", "option", ref("seq", "exprs[]"), repeated(WS(), lit("|"), WS(), ref("seq", "exprs[]"))),
    hook("seq", "sequence", ref("repetition", "exprs[]"), repeated(required(ref("WS")), ref("repetition", "exprs[]"))),
    hook("repetition", "expr", opt(ref("term", "expr"), ref("optional", "expr"), ref("repeated", "expr"), ref("required", "expr"))),
    hook("optional", "optional", ref("term", "expr"), WS(), lit("?")),
    hook("repeated", "repeated", ref("term", "expr"), WS(), lit("*")),
    hook("required", "required", ref("term", "expr"), WS(), lit("+")),
    hook("term", "expr", opt(seq(lit("("), WS(), ref("expr", "expr"), WS(), lit(")")), ref("ref", "expr"), ref("literal", "expr"), ref("regex", "expr"), ref("dot", "expr"))),
    hook("ref", "ref", optional(ref("label", "label"), WS(), lit(":"), WS()), ref("ident", "name")),
    hook("dot", "dot", lit(".")),
    hook("literal", "literal", opt(seq(lit("\""), ref("double", "lit"), lit("\"")), seq(lit("'"), ref("single", "lit"), lit("'")))),
    hook("regex", "regex", lit("/"), ref("re", "pattern"), lit("/")),
    rule("label", ref("ident"), optional(lit("[]"))),
    rule("ident", re(/[a-zA-Z_]/), repeated(re(/[a-zA-Z0-9_]/))),
    rule("double", repeated(opt(seq(lit("\\"), dot()), re(/[^\\"]/)))),
    rule("single", repeated(opt(seq(lit("\\"), dot()), re(/[^\\']/)))),
    rule("re", required(opt(seq(lit("\\"), dot()), re(/[^\\/]/)))),
    rule("WS", re(/\s/))
);