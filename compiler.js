//imports
const fs = require('fs');
const readline = require('readline');
const codeGeneratorModule = require('./codeGenerator');
const lexerModule = require('./lexer');
const parserModule = require('./parser');

fs.readFile('./6-27-JavaScript-ІВ-81-Юхимчук.c', 'utf-8', (err, input) => {
    //check for errors in reading file
    if (err === null) {
        //check for errors in compiling
        try {
            const tokens = lexerModule.lexer(input);
            let ast = parserModule.parser(tokens);
            console.log(JSON.stringify(ast, null, 2));
            let asmCode = codeGeneratorModule.codeGenerator(ast);
            console.log(asmCode.join('\n'));
        } catch (err) {
            console.log(err.message);
        }

        // enter to close console
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Press ENTER to continue... ', () => {
            rl.close();
        });
        //------------------------
    } else {
        console.log(new Error(err.message));
    }
});
