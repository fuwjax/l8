import "jasmine";
import parser from "../src/csvParser";

describe("dot", () => {
    it("should parse csv", () => {
        expect(parser.parse(String.raw`
A,B,C
a,b,c
`)).toEqual([["A", "B", "C"], ["a", "b", "c"]]);
    })
});

