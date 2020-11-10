const fs = require('fs');

// func for generating asm from expr
const generateExprAsmCode = (expressions) => {
    // commands 
    let asmCode = [];

    // if one value in return 
    if (expressions.length === 1 && expressions[0] !== 'eax' && expressions[0] !== 'ebx') {
        asmCode.push(`mov eax, ${expressions[0]}`);
        asmCode.push(`push eax`);
    }

    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '(') {

            // slice expr in ()
            let sliceExpr = expressions.slice(
                expressions.indexOf('(') + 1,
                expressions.lastIndexOf(')')
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
            expressions.splice(expressions.indexOf('('), sliceExpr.length + 2, 'eax');

            // when ()some operation()
            asmCode.push(
                ...generateExprAsmCode(
                    expressions
                )
            );
            break;

        }
    }

    // NEGATION
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '!') {
            //first number after !+number

            var number = expressions.slice(i).join('').match(/\d+|eax/)[0];
            var numberIndex = expressions.indexOf(number);

            // !..!
            let negations = expressions.slice(i, numberIndex);

            if ((expressions[i + negations.length] === 'eax') || (expressions[i + negations.length] === 'ebx')) {
                asmCode.push(`pop ${expressions[i + negations.length]}`);
            }
            // if even - two commands, else - one
            if (negations.length % 2 === 0 && negations.length !== 0) {
                asmCode.push(`invoke negation, ${expressions[i + negations.length]}`);
                asmCode.push(`invoke negation, eax`);
            }
            else {
                asmCode.push(`invoke negation, ${expressions[i + negations.length]}`);
            }

            asmCode.push(`push eax`);

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

    // MULTIPLY AND DIVISION
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '*') {
            if ((expressions[i - 1] === 'eax') && (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke multiply, eax, ebx`)
            }
            else if ((expressions[i - 1] === 'eax') || (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop eax`);
                asmCode.push(`invoke multiply, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }
            else {
                asmCode.push(`invoke multiply, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }

            asmCode.push(`push eax`);

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
        else if (expressions[i] === '/') {
            if ((expressions[i - 1] === 'eax') && (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke divide, eax, ebx`)
            }
            else if ((expressions[i - 1] === 'eax') || (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop eax`);
                asmCode.push(`invoke divide, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }
            else {
                asmCode.push(`invoke divide, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }

            asmCode.push(`push eax`);

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

    // XOR
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '^') {
            if ((expressions[i - 1] === 'eax') && (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke xorOperation, eax, ebx`)
            }
            else if ((expressions[i - 1] === 'eax') || (expressions[i + 1] === 'eax')) {
                asmCode.push(`pop eax`);
                asmCode.push(`invoke xorOperation, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }
            else {
                asmCode.push(`invoke xorOperation, ${expressions[i - 1]}, ${expressions[i + 1]}`);
            }

            asmCode.push(`push eax`);

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

// func for generate asm from func body
const generateAsmCodeFromFuncBody = (funcBody) => {
    // {parseInt(node.value, 16)
    // {parseInt(node.value, 10)
    const generatedAsm = [];

    for (let i = 0; i < funcBody.length; i++) {
        if (funcBody[i].id === 'declaration') {
            continue;
        }
        else if (funcBody[i].id === 'expressionWithType' || funcBody[i].id === 'expressionWithoutType') {
            let expression = funcBody[i].expression.map(elem => {
                if (elem.id === 'HexNumberLiteral') {
                    return parseInt(elem.value, 16);
                }
                else if (elem.id === 'NumberLiteral') {
                    return parseInt(elem.value, 10);
                }
                else {
                    return elem.value;
                }

            });
            generatedAsm.push(...generateExprAsmCode(expression));
            generatedAsm.push(`pop ${funcBody[i].variable}`);
        }
        else if (funcBody[i].id === 'Return') {
            let expression = funcBody[i].body.map(elem => {
                return elem.value;
            });
            const generatedReturn = []
            generatedReturn.push(...generateExprAsmCode(expression));
            generatedAsm.push(...generatedReturn);
        }
    }

    return generatedAsm;
}

// func for generate declaration of variables in asm
const generateDeclarationOfVariables = (variables) => {
    const generatedAsm = [];

    for (let i = 0; i < variables.length; i++) {
        generatedAsm.push(`${variables[i].variable} dd ?`);
    }

    return generatedAsm;
}

// func for getting variables from func body
const getVariables = (funcBody) => {
    const variables = [];

    funcBody.map(elem => {
        if (elem.id === 'declaration') {
            variables.push({ variable: elem.variable, type: elem.type, isDeclared: true });
        }
        else if (elem.id === 'expressionWithType') {
            variables.push({ variable: elem.variable, type: elem.type, isDeclared: true, isInitialized: true });
        }
        else if (elem.id === 'expressionWithoutType') {
            const isVariable = variables.some((variable) => {
                return variable.variable === elem.variable;
            })
            if (isVariable) {
                variables.map((variable) => {
                    if (variable.variable === elem.variable) {
                        variable.isInitialized = true;
                    }
                })
            } else {
                throw new Error(`Variable ${elem.variable} is not declared!`);
            }
        }
    })

    return variables;
}

// func for getting return expr
const getReturnExpr = (funcBody) => {
    return funcBody[funcBody.length - 1].body
        .map(node => {
            if (node.id === 'NumberLiteral') {
                return `${parseInt(node.value, 10)}`;
            }
            else if (node.id === 'Brace') {
                return node.value;
            }
            else if (node.id === 'word') {
                return node.value;
            }
            else if (node.id === 'XOROperation') {
                return node.value;
            }
            else if (node.id === 'DivideOperation') {
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
}

// main func for generating
const codeGenerator = (ast) => {
    //all asm code
    const asmCode = [];
    // func body
    const FuncBody = walk(ast);
    // return expression
    const returnExpression = getReturnExpr(FuncBody);
    // variables
    const variables = getVariables(FuncBody);
    // asm code of func body
    const asmFuncBody = generateAsmCodeFromFuncBody(FuncBody);
    // generated variables in asm
    const variabledAsm = generateDeclarationOfVariables(variables);
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
    const data = `
.data?
    ${variabledAsm.join('\n\t')}
`;


    const multiply = `
multiply proc num1:DWORD, num2:DWORD
    mov eax, num1
    cdq
    imul num2
    ret
multiply endp`

    const divide = `
divide proc num1:DWORD, num2:DWORD
  mov eax, num1
  cdq
  idiv num2
  ret
divide endp`
    const xorOperation = `
xorOperation proc num1:DWORD, num2:DWORD
  mov eax, num1
  xor eax, num2
  ret
xorOperation endp`

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

    ${asmFuncBody.join('\n\t')}

    pop eax
    print str$(eax)
    print chr$(13, 10)

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
${divide}
${xorOperation}
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
            return [...node.body];
        }
    }

    // write all asm code in file with separating by \n
    fs.writeFile('./3-27-JavaScript-ІВ-81-Юхимчук.asm', asmCode.join('\n'), (err) => {
        if (err) throw err;
    });

}

module.exports = { codeGenerator };