const fs = require('fs');

const codeGenerator = (ast) => {
    //all asm code
    const asmCode = [];

    //value of return
    const returnNum = walk(ast);

    //header of asm code
    const header =
        '.386\n' +
        '.model flat, stdcall\n' +
        '.data\n' +
        '.code\n'

    // main proc of asm code
    const mainProc =
        'main PROC\n' +
        `\tmov eax, ${returnNum}\n` +
        '\tret\n' +
        'main ENDP\n'

    // start func of asm code
    const startFunc =
        '_start:\n' +
        '\tinvoke main\n' +
        '\tinvoke ExitProcess, 0\n'

    // push all parts of asm code in arr
    asmCode.push(header);
    asmCode.push(mainProc);
    asmCode.push(startFunc);

    // recursion func to get value of return
    function walk(node) {
        if (node.id === 'Program') {
            return walk(...node.body);
        }
        else if (node.id === 'Function' && node.name === 'main') {
            return walk(...node.body);
        }
        else if (node.id === 'Return') {
            return walk(...node.body);
        }
        else if (node.id === 'NumberLiteral') {
            return node.value;
        }
    }

    // write all asm code in file with separating by \n
    fs.writeFile('generatedCode.asm', asmCode.join('\n'), (err) => {
        if (err) throw err;
    });

}

module.exports = { codeGenerator };