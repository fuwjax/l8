import "jasmine";
import { ParseError } from "../src/core";
import Grammar, { rule, hook, range, ref, required, lit, repeated, opt, re, seq, optional, dot } from "../src/parser";

describe("dot", () => {
    const parser = new Grammar("A", {},
        rule("A", dot())
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    })
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    })
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new ParseError("No production match for 'a' at line 1: 2 (2)"));
    })
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    })
});

describe("literal character", () => {
    const parser = new Grammar("A", {},
        rule("A", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new ParseError("No production match for 'a' at line 1: 2 (2)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("literal string", () => {
    const parser = new Grammar("A", {},
        rule("A", lit("aa"))
    );
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual("aa");
    });
    it("should not parse a", () => {
        expect(() => parser.parse("a")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    });
    it("should not parse aaa", () => {
        expect(() => parser.parse("aaa")).toThrow(new ParseError("No production match for 'a' at line 1: 3 (3)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new ParseError("No production match for 'b' at line 1: 2 (2)"));
    });
});

describe("character class", () => {
    const parser = new Grammar("A", {},
        rule("A", re("[ab]"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new ParseError("No production match for 'c' at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new ParseError("No production match for 'a' at line 1: 2 (2)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new ParseError("No production match for 'b' at line 1: 2 (2)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("sentence", () => {
    const parser = new Grammar("A", {},
        rule("A", seq(lit("a"), lit("a")))
    );
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual("aa");
    });
    it("should not parse a", () => {
        expect(() => parser.parse("a")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    });
    it("should not parse aaa", () => {
        expect(() => parser.parse("aaa")).toThrow(new ParseError("No production match for 'a' at line 1: 3 (3)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new ParseError("No production match for 'b' at line 1: 2 (2)"));
    });
    it("should not parse bb", () => {
        expect(() => parser.parse("bb")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
});

describe("options", () => {
    const parser = new Grammar("A", {},
        rule("A", opt(lit("a"), lit("b")))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new ParseError("No production match for 'c' at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new ParseError("No production match for 'a' at line 1: 2 (2)"));
    });
    it("should not parse ab", () => {
        expect(() => parser.parse("ab")).toThrow(new ParseError("No production match for 'b' at line 1: 2 (2)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("optional", () => {
    const parser = new Grammar("A", {},
        rule("A", optional(lit("a")))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse nothing", () => {
        expect(parser.parse("")).toEqual(undefined);
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
    it("should not parse aa", () => {
        expect(() => parser.parse("aa")).toThrow(new ParseError("No production match for 'a' at line 1: 2 (2)"));
    });
});

describe("repeated", () => {
    const parser = new Grammar("A", {},
        rule("A", repeated(lit("a")))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual("aa");
    });
    it("should parse nothing", () => {
        expect(parser.parse("")).toEqual(undefined);
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
});

describe("required", () => {
    const parser = new Grammar("A", {},
        rule("A", required(lit("a")))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual("aa");
    });
    it("should parse not nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
});

describe("range", () => {
    const parser = new Grammar("A", {},
        rule("A", range(lit("a"), 2, 3))
    );
    it("should parse a", () => {
        expect(() => parser.parse("a")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual("aa");
    });
    it("should parse aaa", () => {
        expect(parser.parse("aaa")).toEqual("aaa");
    });
    it("should not parse aaaa", () => {
        expect(() => parser.parse("aaaa")).toThrow(new ParseError("No production match for 'a' at line 1: 4 (4)"));
    });
    it("should parse not nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
});

describe("add rule option", () => {
    const parser = new Grammar("A", {},
        rule("A", lit("a")),
        rule("A", lit("b"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    });
    it("should not parse c", () => {
        expect(() => parser.parse("c")).toThrow(new ParseError("No production match for 'c' at line 1: 1 (1)"));
    });
});

describe("add more rule options", () => {
    const parser = new Grammar("A", {},
        rule("A", lit("a")),
        rule("A", lit("b")),
        rule("A", lit("c"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    });
    it("should parse c", () => {
        expect(parser.parse("c")).toEqual("c");
    });
});

describe("ref", () => {
    const parser = new Grammar("A", {},
        rule("A", ref("B")),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("deep ref", () => {
    const parser = new Grammar("A", {},
        rule("A", opt(ref("B"), ref("C"))),
        rule("B", lit("a")),
        rule("C", seq(ref("B"), lit("b")))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a");
    });
    it("should parse ab", () => {
        expect(parser.parse("ab")).toEqual("ab");
    });
    it("should not parse b", () => {
        expect(() => parser.parse("b")).toThrow(new ParseError("No production match for 'b' at line 1: 1 (1)"));
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("leading optional", () => {
    const parser = new Grammar("A", {},
        rule("A", seq(optional(lit("a")), lit("b")))
    );
    it("should parse not a", () => {
        expect(() => parser.parse("a")).toThrow(new ParseError("No more input at line 1: 1 (1)"));
    });
    it("should parse ab", () => {
        expect(parser.parse("ab")).toEqual("ab");
    });
    it("should not parse b", () => {
        expect(parser.parse("b")).toEqual("b");
    });
    it("should not parse nothing", () => {
        expect(() => parser.parse("")).toThrow(new ParseError("No more input at line 1: 0 (0)"));
    });
});

describe("labels", () => {
    const parser = new Grammar("A", {},
        hook("A", "label", ref("B", "label")),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a")
    });
});

describe("array labels", () => {
    const parser = new Grammar("A", {},
        hook("A", "labels", repeated(ref("B", "labels[]"))),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual(["a"])
    });
    it("should parse aa", () => {
        expect(parser.parse("aa")).toEqual(["a", "a"])
    });
});

describe("label hook", () => {
    const parser = new Grammar("A", {},
        hook("A", "label", ref("B", "label")),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("a")
    });
});

describe("label callback", () => {
    const parser = new Grammar("A", {
        hook: () => "b"
    },
        hook("A", "hook", ref("B", "label")),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual("b")
    });
});

describe("label uses callback", () => {
    const parser = new Grammar("A", {
        hook: (o: { label: string }) => ` ${o.label} `
    },
        hook("A", "hook", ref("B", "label")),
        rule("B", lit("a"))
    );
    it("should parse a", () => {
        expect(parser.parse("a")).toEqual(" a ")
    });
});

describe("label callback configure", () => {
    const parser = new Grammar("A", {
        cb: () => "b"
    });
    it("should parse a", () => {
        parser.configure(`
A => cb = label:B
B = "a"`);
        expect(parser.parse("a")).toEqual("b")
    });
});
