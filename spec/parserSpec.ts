import "jasmine";
import Parser, * as G from "../src/parser";

describe("dot", () => {
    const parser = new Parser("A");
    parser.add("A", G.dot());
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    })
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual({ A: ["b"] });
    })
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    })
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    })
});

describe("literal character", () => {
    const parser = new Parser("A");
    parser.add("A", G.lit("a"));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("literal string", () => {
    const parser = new Parser("A");
    parser.add("A", G.lit("aa"));
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual({ A: ["aa"] });
    });
    it("should not parse a", () => {
        expect(() => parser.parse("a")).toThrow(new G.ParseError("No more input at line 1: 1 (1)"));
    });
    it("should not parse aaa", () => {
        expect(() => parser.parse("aaa")).toThrow(new G.ParseError("No production match at line 1: 3 (3)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
});

describe("character class", () => {
    const parser = new Parser("A");
    parser.add("A", G.cc("[ab]"));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual({ A: ["b"] });
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("sentence", () => {
    const parser = new Parser("A");
    parser.add("A", G.seq(G.lit("a"), G.lit("a")));
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual({ A: [["a", "a"]] });
    });
    it("should not parse a", () => {
        expect(() => parser.parse("a")).toThrow(new G.ParseError("No more input at line 1: 1 (1)"));
    });
    it("should not parse aaa", () => {
        expect(() => parser.parse("aaa")).toThrow(new G.ParseError("No production match at line 1: 3 (3)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse bb", () => {
        expect(() => parser.parse("bb")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
});

describe("options", () => {
    const parser = new Parser("A");
    parser.add("A", G.opt(G.lit("a"), G.lit("b")));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual({ A: ["b"] });
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("optional", () => {
    const parser = new Parser("A");
    parser.add("A", G.optional(G.lit("a")));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: [["a"]] });
    });
    it("should parse nothing", () => {
        expect(parser.parse("")).toEqual({ A: [[]] });
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new G.ParseError("No production match at line 1: 2 (2)"));
    });
});

describe("repeated", () => {
    const parser = new Parser("A");
    parser.add("A", G.repeated(G.lit("a")));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: [["a"]] });
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual({ A: [["a", "a"]] });
    });
    it("should parse nothing", () => {
        expect(parser.parse("")).toEqual({ A: [[]] });
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
});

describe("required", () => {
    const parser = new Parser("A");
    parser.add("A", G.required(G.lit("a")));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: [["a"]] });
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual({ A: [["a", "a"]] });
    });
    it("should parse not nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
});

describe("range", () => {
    const parser = new Parser("A");
    parser.add("A", G.range(G.lit("a"), 2, 3));
    it("should parse a", () => {
        expect(() => parser.parse("a")).toThrow(new G.ParseError("No more input at line 1: 1 (1)"));
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual({ A: [["a", "a"]] });
    });
    it("should parse aaa", () => {
        expect(parser.parse("aaa")).toEqual({ A: [["a", "a", "a"]] });
    });
    it("should not parse aaaa", () => {
        expect(() => parser.parse("aaaa")).toThrow(new G.ParseError("No production match at line 1: 4 (4)"));
    });
    it("should parse not nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
});

describe("add rule option", () => {
    const parser = new Parser("A");
    parser.add("A", G.lit("a"));
    parser.add("A", G.lit("b"));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual({ A: ["b"] });
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
});

describe("add more rule options", () => {
    const parser = new Parser("A");
    parser.add("A", G.lit("a"));
    parser.add("A", G.lit("b"));
    parser.add("A", G.lit("c"));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: ["a"] });
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual({ A: ["b"] });
    });
    it("should parse c", () => {
        expect(parser.parse("c")).toEqual({ A: ["c"] });
    });
});

describe("ref", () => {
    const parser = new Parser("A");
    parser.add("A", G.ref("B"));
    parser.add("B", G.lit("a"));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: [{ B: ["a"] }] });
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("deep ref", () => {
    const parser = new Parser("A");
    parser.add("A", G.opt(G.ref("B"), G.ref("C")));
    parser.add("B", G.lit("a"));
    parser.add("C", G.seq(G.ref("B"), G.lit("b")));
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual({ A: [{ B: ["a"] }] });
    });
    it("should parse ab", () => {
        expect(parser.parse("ab")).toEqual({ A: [{ C: [[{ B: ["a"] }, "b"]] }] });
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new G.ParseError("No production match at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("leading optional", () => {
    const parser = new Parser("A");
    parser.add("A", G.seq(G.optional(G.lit("a")), G.lit("b")));
    it("should parse not a", () => {
        expect(() => parser.parse("a")).toThrow(new G.ParseError("No more input at line 1: 1 (1)"));
    });
    it("should parse ab", () => {
        expect(parser.parse("ab")).toEqual({ A: [[["a"], "b"]] });
    });
    it("should not parse b", () => {
        expect(parser.parse("b")).toEqual({ A: [[[], "b"]] });
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new G.ParseError("No more input at line 1: 0 (0)"));
    });
});
