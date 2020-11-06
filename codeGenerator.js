const fs = require('fs');

const generateExprAsmCode = (expressions) => {
    // commands 
    let asmCode = [];

    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '(') {

            // slice expr in ()
            let sliceExpr = expressions.slice(
                expressions.indexOf('(') + 1,
                expressions.indexOf(')')
            );

            // recursion in ()
            asmCode.push(
                ...generateExprAsmCode(
                    sliceExpr
                )
            );

            // because previous code rewrite this and we do this again
            sliceExpr = expressions.slice(
                expressions.indexOf('(') + 1,
                expressions.indexOf(')')
            );

            // replace (...) on eax
            expressions.splice(expressions.indexOf('('), sliceExpr.length + 2, 'eax')

            break;

        }
    }

    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '!') {
            //first number after !+number
            var number = expressions.join('').match(/\d+|eax/)[0];
            var numberIndex = expressions.indexOf(number);

            // !..!
            let negations = expressions.slice(i, numberIndex);

            // if even - two commands, else - one
            if (negations.length % 2 === 0) {
                asmCode.push(`invoke negation, ${expressions[i + negations.length]}`);
                asmCode.push(`invoke negation, eax`);
            }
            else {
                asmCode.push(`invoke negation, ${expressions[i + negations.length]}`);
            }

            // replace !!...number on eax
            expressions.splice(i, negations.length + 1, 'eax');

            // recursion if !(...)
            asmCode.push(
                ...generateExprAsmCode(
                    expressions
                )
            );
            break;
        }
    }

    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '*') {
            //command with previous num operation and next num
            asmCode.push(`invoke multiply, ${expressions[i - 1]}, ${expressions[i + 1]}`)

            // num operation num replace on eax
            expressions.splice(i - 1, 3, 'eax');

            // recursion
            asmCode.push(
                ...generateExprAsmCode(
                    expressions
                )
            );
            break;
        }
    }

    //return arr of commands 
    return asmCode;
}

// to fix problems with eax
const fixAsmCode = (asmCode) => {
    for (let i = 0; i < asmCode.length; i++) {
        //if we have this command
        if (asmCode[i] === 'invoke multiply, eax, eax') {
            //replace this 
            asmCode[i] = 'invoke multiply, ebx, eax';

            // paste one pos before this 
            asmCode.splice(i - 1, 0, 'mov ebx, eax')
            //recursion
            asmCode = fixAsmCode(asmCode);
            break;
        }
    }

    // return fixed asm code
    return asmCode
}

const codeGenerator = (ast) => {
    //all asm code
    const asmCode = [];

    // return expression
    const returnExpression = walk(ast).map(node => {
        if (node.id === 'NumberLiteral') {
            return `${parseInt(node.value, 10)}`;
        }
        if (node.id === 'Brace') {
            return node.value;
        }
        else if (node.id === 'HexNumberLiteral') {
            return `${parseInt(node.value, 16)}`;
        }
        else if (node.id === 'LogicalNegation') {
            return node.value;
        }
        else if (node.id === 'MultiplicationOperation') {
            return node.value;
        }
    });

    // asm code of return 
    const calcExpression = fixAsmCode(generateExprAsmCode(returnExpression));

    const includes = `
include \\masm32\\include\\windows.inc
include \\masm32\\macros\\macros.asm
include \\masm32\\include\\masm32.inc
include \\masm32\\include\\gdi32.inc
include \\masm32\\include\\user32.inc
include \\masm32\\include\\kernel32.inc
include \\masm32\\include\\msvcrt.inc
includelib \\masm32\\lib\\masm32.lib
includelib \\masm32\\lib\\gdi32.lib
includelib \\masm32\\lib\\user32.lib
includelib \\masm32\\lib\\kernel32.lib
includelib \\masm32\\lib\\msvcrt.lib`
    const header = `
.486
.model flat, stdcall
option casemap : none
${includes}
`
    // data of asm code
    const data = '.data';

    const multiply = `
multiply proc num1: DWORD, num2: DWORD
    mov eax, num1
    cdq
    imul num2
    ret
multiply endp`

    const negation = `
negation proc num1: DWORD
    cmp num1, 0
    je equal
    jne notequal

    equal:
        mov eax, 1
        ret

    notequal:
        xor eax, eax
        ret
    ret
negation endp`

    const mainProc = `
main proc
    push eax
    push ebx
    push ecx
    push edx

    ${calcExpression.join('\n\t')}

    print str$(eax)
    print chr$(13, 10)

    pop edx
    pop ecx
    pop ebx
    pop eax

    ret
    main endp`

    // code of asm code
    const code = `
.code
start:
    call main
    mov eax, input("ENTER to continue. . . ")
    exit
${multiply} 
${negation}
${mainProc}
end start`

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
            return [...node.body];
        }
    }

    // write all asm code in file with separating by \n
    fs.writeFile('./2-27-JavaScript-ІВ-81-Юхимчук.asm', asmCode.join('\n'), (err) => {
        if (err) throw err;
    });

}

module.exports = { codeGenerator };