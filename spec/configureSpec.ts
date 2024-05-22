import "jasmine";
import { ParseError } from "../src/core";
import Grammar, { rule, hook, range, ref, required, lit, repeated, opt, re, seq, optional, dot } from "../src/parser";
import { RegularExpr } from "../src/term";
let WS = () => repeated(ref("WS"));

describe("WS", () => {
    const parser = new Grammar("WS", {},
        rule("WS", re(/\s/))
    );
    it("should parse space", () => {
        expect(parser.parse(" ")).toEqual(" ");
    })
    it("should parse newline", () => {
        expect(parser.parse("\n")).toEqual("\n");
    })
    it("should not parse a", () => {
        expect(() => parser.parse("a")).toThrow(new ParseError("No production match for 'a' at line 1: 1 (1)"));
    })
});

describe("re", () => {
    const parser = new Grammar("re", {},
        rule("re", required(opt(seq(lit("\\"), dot()), re(/[^\\/]/))))
    );
    it("should parse space", () => {
        expect(parser.parse(" ")).toEqual(" ");
    })
    it("should parse text", () => {
        expect(parser.parse("a big deal")).toEqual("a big deal");
    })
    it("should parse escape n", () => {
        expect(parser.parse("\\n")).toEqual("\\n");
    })
    it("should parse char class", () => {
        expect(parser.parse("[^=+]")).toEqual("[^=+]");
    })
    it("should not parse single backslash", () => {
        expect(() => parser.parse("\\")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    })
});

describe("single", () => {
    const parser = new Grammar("single", {},
        rule("single", repeated(opt(seq(lit("\\"), dot()), re(/[^\\']/)))),
    );
    it("should parse space", () => {
        expect(parser.parse(" ")).toEqual(" ");
    })
    it("should parse text", () => {
        expect(parser.parse("a big deal")).toEqual("a big deal");
    })
    it("should parse escape n", () => {
        expect(parser.parse("\\n")).toEqual("\\n");
    })
    it("should not parse single backslash", () => {
        expect(() => parser.parse("\\")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    })
    it("should not parse single single quote", () => {
        expect(() => parser.parse("'")).toThrow(new ParseError("No production match for ''' at line 1: 1 (1)"));
    })
});

describe("double", () => {
    const parser = new Grammar("double", {},
        rule("double", repeated(opt(seq(lit("\\"), dot()), re(/[^\\"]/)))),
    );
    it("should parse space", () => {
        expect(parser.parse(" ")).toEqual(" ");
    })
    it("should parse text", () => {
        expect(parser.parse("a big deal")).toEqual("a big deal");
    })
    it("should parse escape n", () => {
        expect(parser.parse("\\n")).toEqual("\\n");
    })
    it("should not parse single backslash", () => {
        expect(() => parser.parse("\\")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    })
    it("should not parse single double quote", () => {
        expect(() => parser.parse("\"")).toThrow(new ParseError("No production match for '\"' at line 1: 1 (1)"));
    })
});

describe("ident", () => {
    const parser = new Grammar("ident", {},
        rule("ident", re(/[a-zA-Z_]/), repeated(re(/[a-zA-Z0-9_]/)))
    );
    it("should not parse space", () => {
        expect(() => parser.parse(" ")).toThrow(new ParseError("No production match for ' ' at line 1: 1 (1)"));
    })
    it("should parse ident", () => {
        expect(parser.parse("identity")).toEqual("identity");
    })
    it("should parse single char", () => {
        expect(parser.parse("x")).toEqual("x");
    })
});

describe("label", () => {
    const parser = new Grammar("label", {},
        rule("label", ref("ident"), optional(lit("[]"))),
        rule("ident", re(/[a-zA-Z_]/), repeated(re(/[a-zA-Z0-9_]/)))
    );
    it("should not parse space", () => {
        expect(() => parser.parse(" ")).toThrow(new ParseError("No production match for ' ' at line 1: 1 (1)"));
    })
    it("should parse ident", () => {
        expect(parser.parse("identity")).toEqual("identity");
    })
    it("should parse array ident", () => {
        expect(parser.parse("identity[]")).toEqual("identity[]");
    })
    it("should parse single char", () => {
        expect(parser.parse("x")).toEqual("x");
    })
});

describe("regex", () => {
    const parser = new Grammar("regex", {
        regex: (o: { pattern: string }) => re(o.pattern)
    },
        hook("regex", "regex", lit("/"), ref("re", "pattern"), lit("/")),
        rule("re", required(opt(seq(lit("\\"), dot()), re(/[^\\/]/))))
    );
    it("should not parse space", () => {
        expect(() => parser.parse(" ")).toThrow(new ParseError("No production match for ' ' at line 1: 1 (1)"));
    })
    it("should parse ident", () => {
        let act = parser.parse("/x/");
        let exp = re(/x/);
        expect(`${(act as RegularExpr).chars}`).toEqual(`${(exp as RegularExpr).chars}`);
    })
    it("should parse array ident", () => {
        let act = parser.parse(String.raw`/\s/`);
        let exp = re(/\s/);
        expect(`${(act as RegularExpr).chars}`).toEqual(`${(exp as RegularExpr).chars}`);
    })
    it("should parse single char", () => {
        let act = parser.parse("/[a-z]/");
        let exp = re(/[a-z]/);
        expect(`${(act as RegularExpr).chars}`).toEqual(`${(exp as RegularExpr).chars}`);
    })
});
