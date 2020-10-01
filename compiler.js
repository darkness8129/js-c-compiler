const fs = require('fs');
const codeGeneratorModule = require('./codeGenerator');
const lexerModule = require('./lexer');
const parserModule = require('./parser');

fs.readFile('./source_codes/source.c', 'utf-8', (err, input) => {
    if (err === null) {
        // split input code on tokens 
        const tokens = lexerModule.lexer(input);
        console.log(tokens);

        try {
            let ast = parserModule.parser(tokens);
            console.log(JSON.stringify(ast, null, 2));
            // generate asm code
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