const fs = require('fs');
const lexerModule = require('./lexer');
const parserModule = require('./parser');

fs.readFile('./source_codes/source.c', 'utf-8', (err, input) => {
    if (err === null) {
        const tokens = lexerModule.lexer(input);
        let ast = parserModule.parser(tokens);
        ast = JSON.stringify(ast, null, 2);

        console.log(ast);
    }
    else {
        throw new Error(err.message);
    }
});