import Grammar, * as G from "./parser";

const earleyG = new Grammar("grammar");
earleyG.add("grammar", G.ref("rules"));
earleyG.add("rules", G.required(G.ref("rule")));
earleyG.add("rule", G.seq(G.ref("ident"), G.lit("="), G.ref("expr"), G.lit("\n")));
earleyG.add("expr", G.seq(G.ref("term"), G.repeated(G.seq(G.lit(" "), G.ref("term")))));
earleyG.add("term", G.opt(G.ref("ident"), G.ref("literal")));
earleyG.add("ident", G.required(G.ref("ch")));
earleyG.add("literal", G.seq(G.lit("\""), G.ref("ext"), G.lit("\"")));
earleyG.add("ext", G.opt(G.seq(G.lit("\\"), G.cc("[n\"]")), G.cc("[ =]"), G.ref("ch")));
earleyG.add("ch", G.cc("[a-z]"));

const earley: G.Parser = earleyG.parser();
export default earley;
