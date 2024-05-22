import Grammar from "../src/parser";

const grammar = new Grammar("file", {});
grammar.configure(String.raw`
file => records = EOL? records[]:record (EOL records[]:record)* EOL?
record => fields = fields[]:field ("," fields[]:field)*
field => text = /[ \t]/* '"' text:inner '"' /[ \t]/* | text:naked
inner = (/[^"]/ | double)*
double => first = first:quote quote
quote = '"' 
naked = (/[ \t]/* /[^",\r\n \t]/ /[^,\r\n]/*)?
EOL = "\r"? "\n"
`);

const parser = grammar.parser();
export default parser;

export const stepParser = grammar.stepParser;
