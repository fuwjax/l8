import { Expr } from "../src/core";
import Grammar, { hook, ref, required, lit, repeated, opt, re, seq, optional, dot } from "../src/parser";

const context = {
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
}

const grammar = new Grammar("grammar", context);
grammar.configure(String.raw`
grammar    => rules    = WS* rules[]:rule (WS+ rules[]:rule)* WS*
rule       => rule     = name:ident WS* ("=>" WS* hook:ident WS*)? "=" WS* rhs:expr
expr       => option   = exprs[]:seq (WS* "|" WS* exprs[]:seq)*
seq        => sequence = exprs[]:repetition (WS+ exprs[]:repetition)*
repetition => expr     = expr:term | expr:optional | expr:repeated | expr:required
optional   => optional = expr:term WS* "?"
repeated   => repeated = expr:term WS* "*"
required   => required = expr:term WS* "+"
term       => expr     = "(" WS* expr:expr WS* ")" | expr:ref | expr:literal | expr:regex | expr:dot
ref        => ref      = (label:label WS* ":" WS*)? name:ident
dot        => dot      = "."
literal    => literal  = "\"" lit:double '"' | "'" lit:single "'"
regex      => regex    = "/" pattern:re "/"

label  = ident "[]"?
ident  = /[a-zA-Z_]/ /[a-zA-Z0-9_]/* 
double = ("\\" . | /[^\\"]/)*
single = ("\\" . | /[^\\']/)*
re     = ("\\" . | /[^\\\/]/)+
WS     = /\s/
`);

const parser = grammar.parser();
export default parser;

export const stepParser = grammar.stepParser;
