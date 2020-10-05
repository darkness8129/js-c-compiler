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
        'include \\masm32\\include\\kernel32.inc\n' +
        'include \\masm32\\include\\user32.inc\n' +
        'includelib \\masm32\\lib\\kernel32.lib\n' +
        'includelib \\masm32\\lib\\user32.lib\n'

    // data of asm code
    const data =
        '.data\n' +
        '\tCaption db "IV-81 Yukhymchuk LAB_1", 0\n' +
        `\tText db "Result:", 13, 10, "${returnNum}", 0\n`

    // code of asm code
    const code =
        '.code\n' +
        'start:\n' +
        '\tinvoke MessageBoxA, 0, ADDR Text, ADDR Caption, 0\n' +
        '\tinvoke ExitProcess, 0\n' +
        'end start'

    // push all parts of asm code in arr
    asmCode.push(header);
    asmCode.push(data);
    asmCode.push(code);

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
            return parseInt(node.value, 10);
        }
        else if (node.id === 'HexNumberLiteral') {
            return parseInt(node.value, 16);
        }
    }

    // write all asm code in file with separating by \n
    fs.writeFile('./1-27-JavaScript-ІВ-81-Юхимчук.asm', asmCode.join('\n'), (err) => {
        if (err) throw err;
    });

}

module.exports = { codeGenerator };