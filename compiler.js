//imports 
const fs = require('fs');
const codeGeneratorModule = require('./codeGenerator');
const lexerModule = require('./lexer');
const parserModule = require('./parser');

//read file
fs.readFile('./source_codes/source.c', 'utf-8', (err, input) => {
    //check for errors in reading file
    if (err === null) {
        //check for errors in compiling
        try {
            const tokens = lexerModule.lexer(input);
            let ast = parserModule.parser(tokens);
            console.log(JSON.stringify(ast, null, 2));
            codeGeneratorModule.codeGenerator(ast);
        }
        catch (err) {
            console.log(err.message);
        }
    }
    else {
        console.log(new Error(err.message));
    }
});