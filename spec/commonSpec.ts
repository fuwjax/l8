import * as fs from 'fs';
import "jasmine";
import earley from "../src/common";

function file(path: string): string {
    return fs.readFileSync(path, { encoding: "utf8" });
}


describe("earley", () => {
    let basic = file("./grammar/basic.sbnf");
    it("should parse basic.sbnf", () => {
        expect(earley.parse(basic)).toEqual({ A: ["a"] });
    })
});
