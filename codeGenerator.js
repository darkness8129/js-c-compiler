const fs = require('fs');

// func for generating asm from expr
const generateExprAsmCode = (expressions) => {
    // commands
    let asmCode = [];

    // if one value in return
    if (
        expressions.length === 1 &&
        expressions[0] !== 'eax' &&
        expressions[0] !== 'ebx'
    ) {
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
            asmCode.push(...generateExprAsmCode(sliceExpr));

            // because previous code rewrite this and we do this again
            sliceExpr = expressions.slice(
                expressions.indexOf('(') + 1,
                expressions.indexOf(')')
            );

            // replace (...) on eax
            expressions.splice(
                expressions.indexOf('('),
                sliceExpr.length + 2,
                'eax'
            );

            // when ()some operation()
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        }
    }

    // NEGATION
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '!') {
            //first number after !+number

            var number = expressions
                .slice(i)
                .join('')
                .match(/\d+|eax/)[0];
            var numberIndex = expressions.indexOf(number);

            // !..!
            let negations = expressions.slice(i, numberIndex);

            if (
                expressions[i + negations.length] === 'eax' ||
                expressions[i + negations.length] === 'ebx'
            ) {
                asmCode.push(`pop ${expressions[i + negations.length]}`);
            }
            // if even - two commands, else - one
            if (negations.length % 2 === 0 && negations.length !== 0) {
                asmCode.push(
                    `invoke negation, ${expressions[i + negations.length]}`
                );
                asmCode.push(`invoke negation, eax`);
            } else {
                asmCode.push(
                    `invoke negation, ${expressions[i + negations.length]}`
                );
            }

            asmCode.push(`push eax`);

            // replace !!...number on eax
            expressions.splice(i, negations.length + 1, 'eax');

            // recursion if !(...)
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        }
    }

    // MULTIPLY AND DIVISION
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '*') {
            if (expressions[i - 1] === 'eax' && expressions[i + 1] === 'eax') {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke multiply, eax, ebx`);
            } else if (
                expressions[i - 1] === 'eax' ||
                expressions[i + 1] === 'eax'
            ) {
                asmCode.push(`pop eax`);
                asmCode.push(
                    `invoke multiply, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            } else {
                asmCode.push(
                    `invoke multiply, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            }

            asmCode.push(`push eax`);

            // num operation num replace on eax
            expressions.splice(i - 1, 3, 'eax');

            // recursion
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        } else if (expressions[i] === '/') {
            if (expressions[i - 1] === 'eax' && expressions[i + 1] === 'eax') {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke divide, eax, ebx`);
            } else if (
                expressions[i - 1] === 'eax' ||
                expressions[i + 1] === 'eax'
            ) {
                asmCode.push(`pop eax`);
                asmCode.push(
                    `invoke divide, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            } else {
                asmCode.push(
                    `invoke divide, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            }

            asmCode.push(`push eax`);

            // num operation num replace on eax
            expressions.splice(i - 1, 3, 'eax');

            // recursion
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        }
    }

    // SUM
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '+') {
            if (expressions[i - 1] === 'eax' && expressions[i + 1] === 'eax') {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke sum, eax, ebx`);
            } else if (
                expressions[i - 1] === 'eax' ||
                expressions[i + 1] === 'eax'
            ) {
                asmCode.push(`pop eax`);
                asmCode.push(
                    `invoke sum, ${expressions[i - 1]}, ${expressions[i + 1]}`
                );
            } else {
                asmCode.push(
                    `invoke sum, ${expressions[i - 1]}, ${expressions[i + 1]}`
                );
            }

            asmCode.push(`push eax`);

            // num operation num replace on eax
            expressions.splice(i - 1, 3, 'eax');

            // recursion
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        }
    }

    // XOR
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i] === '^') {
            if (expressions[i - 1] === 'eax' && expressions[i + 1] === 'eax') {
                asmCode.push(`pop ebx`);
                asmCode.push(`pop eax`);
                asmCode.push(`invoke xorOperation, eax, ebx`);
            } else if (
                expressions[i - 1] === 'eax' ||
                expressions[i + 1] === 'eax'
            ) {
                asmCode.push(`pop eax`);
                asmCode.push(
                    `invoke xorOperation, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            } else {
                asmCode.push(
                    `invoke xorOperation, ${expressions[i - 1]}, ${
                        expressions[i + 1]
                    }`
                );
            }

            asmCode.push(`push eax`);

            // num operation num replace on eax
            expressions.splice(i - 1, 3, 'eax');

            // recursion
            asmCode.push(...generateExprAsmCode(expressions));
            break;
        }
    }

    //return arr of commands
    return asmCode;
};

// func for generate asm from func body
const generateAsmCodeFromFuncBody = (funcBody) => {
    const generatedAsm = [];
    // to get unique name of true, false, continue
    let uniqueNumber = 1;
    let uniqForId = 1;

    // generate invoke construction
    const generateInvoke = (funcInvoke) => {
        let generatedInvoke = [];
        if (funcInvoke.params.length === 0) {
            generatedInvoke.push(`invoke ${funcInvoke.funcName}`);
        } else {
            let params = [...funcInvoke.params].map((elem) => elem.value);
            for (let i = 0; i < params.length; i++) {
                if (i !== params.length - 1) {
                    params[i] += ', ';
                }
            }
            params = params.join('');
            generatedInvoke.push(`invoke ${funcInvoke.funcName}, ${params}`);
        }
        return generatedInvoke;
    };

    for (let i = 0; i < funcBody.length; i++) {
        if (funcBody[i].id === 'declaration') {
            continue;
        } else if (
            funcBody[i].id === 'expressionWithType' ||
            funcBody[i].id === 'expressionWithoutType'
        ) {
            if (funcBody[i].expression[0].id === 'functionCall') {
                generatedAsm.push(...generateInvoke(funcBody[i].expression[0]));
                generatedAsm.push(`mov ${funcBody[i].variable}, eax`);
            } else {
                let expression = funcBody[i].expression.map((elem) => {
                    if (elem.id === 'HexNumberLiteral') {
                        return parseInt(elem.value, 16);
                    } else if (elem.id === 'NumberLiteral') {
                        return parseInt(elem.value, 10);
                    } else {
                        return elem.value;
                    }
                });
                generatedAsm.push(...generateExprAsmCode(expression));
                generatedAsm.push(`pop ${funcBody[i].variable}`);
            }
        } else if (funcBody[i].id === 'ternaryExpression') {
            const genInt = (part) => {
                return funcBody[i][part].map((elem) => {
                    if (elem.id === 'HexNumberLiteral') {
                        return parseInt(elem.value, 16);
                    } else if (elem.id === 'NumberLiteral') {
                        return parseInt(elem.value, 10);
                    } else {
                        return elem.value;
                    }
                });
            };

            let condition = genInt('condition');
            let firstOperand = genInt('firstOperand');
            let secondOperand = genInt('secondOperand');
            generatedAsm.push(...generateExprAsmCode(condition));
            generatedAsm.push(`cmp eax, 0`);
            generatedAsm.push(`je falseOperand${uniqueNumber}`);
            generatedAsm.push(`jne trueOperand${uniqueNumber}`);
            generatedAsm.push(`trueOperand${uniqueNumber}:`);
            generatedAsm.push(
                ...generateExprAsmCode(firstOperand).map((el) => `\t${el}`)
            );
            generatedAsm.push(`\tjmp continue${uniqueNumber}`);
            generatedAsm.push(`falseOperand${uniqueNumber}:`);
            generatedAsm.push(
                ...generateExprAsmCode(secondOperand).map((el) => `\t${el}`)
            );
            generatedAsm.push(`\tjmp continue${uniqueNumber}`);
            generatedAsm.push(`continue${uniqueNumber}:`);
            generatedAsm.push(`pop ${funcBody[i].variable}`);
            uniqueNumber++;
        } else if (funcBody[i].id === 'Return') {
            if (funcBody[i].body[0].id === 'functionCall') {
                generatedAsm.push(...generateInvoke(funcBody[i].body[0]));
                generatedAsm.push(`push eax`);
            } else {
                let expression = funcBody[i].body.map((elem) => {
                    return elem.value;
                });
                const generatedReturn = [];
                generatedReturn.push(...generateExprAsmCode(expression));
                generatedAsm.push(...generatedReturn);
            }
        } else if (funcBody[i].id === 'ForCycle') {
            // calculate init
            generatedAsm.push(
                ...generateAsmCodeFromFuncBody(funcBody[i].initialization)
            );

            generatedAsm.push(`loopStart${uniqForId}:`);
            // calculate cond
            generatedAsm.push(
                ...generateAsmCodeFromFuncBody([funcBody[i].condition])
            );
            generatedAsm.push(`cmp conditionFor${uniqForId}, 0`);
            generatedAsm.push(`je loopEnd${uniqForId}`);

            // do loop body
            generatedAsm.push(...generateAsmCodeFromFuncBody(funcBody[i].body));

            generatedAsm.push(`loopPostExprLabel${uniqForId}:`);
            // calculate post-expr
            generatedAsm.push(
                ...generateAsmCodeFromFuncBody(funcBody[i].reinitialization)
            );
            generatedAsm.push(`jmp loopStart${uniqForId}`);
            generatedAsm.push(`loopEnd${uniqForId}:`);
            uniqForId++;
        } else if (funcBody[i].id === 'BreakOperator') {
            generatedAsm.push(`jmp loopEnd${uniqForId}`);
        } else if (funcBody[i].id === 'ContinueOperator') {
            generatedAsm.push(`jmp loopPostExprLabel${uniqForId}`);
        }
    }

    return generatedAsm;
};

// func for generate declaration of variables in asm
const generateDeclarationOfVariables = (variables) => {
    const generatedAsm = [];

    for (let i = 0; i < variables.length; i++) {
        generatedAsm.push(`local ${variables[i].variable}:DWORD`);
    }

    return generatedAsm;
};

// func for getting variables from func body
const getVariables = (funcBody) => {
    const variables = [];

    funcBody.map((elem) => {
        if (elem.id === 'declaration') {
            variables.push({
                variable: elem.variable,
                type: elem.type,
                isDeclared: true,
            });
        } else if (elem.id === 'expressionWithType') {
            variables.push({
                variable: elem.variable,
                type: elem.type,
                isDeclared: true,
                isInitialized: true,
            });
        } else if (elem.id === 'ternaryExpression') {
            variables.push({
                variable: elem.variable,
                type: elem.type,
            });
        } else if (elem.id === 'expressionWithoutType') {
            variables.map((variable) => {
                if (variable.variable === elem.variable) {
                    variable.isInitialized = true;
                }
            });
        } else if (elem.id === 'ForCycle') {
            variables.push(...getVariables(elem.body));
            variables.push(...getVariables(elem.initialization));
            variables.push(...getVariables([elem.condition]));
        }
    });

    return variables;
};

// vars for all funcs
const getVarsForEachFunc = (funcs) => {
    let variables = [];
    for (let i = 0; i < funcs.length; i++) {
        let v = getVariables(funcs[i].body);
        variables.push({
            func: funcs[i].name,
            vars: v,
        });
    }

    return variables;
};

// asm for all func bodies
const getAsmCodeForEachFuncBody = (funcs) => {
    let asm = [];
    for (let i = 0; i < funcs.length; i++) {
        let a = generateAsmCodeFromFuncBody(funcs[i].body);
        asm.push({
            func: funcs[i].name,
            asmCode: a,
        });
    }

    return asm;
};

// asm for all func variables
const getAsmVariablesForEachFunc = (variables) => {
    let varsAsm = [];
    for (let i = 0; i < variables.length; i++) {
        let v = generateDeclarationOfVariables(variables[i].vars);
        varsAsm.push({
            func: variables[i].func,
            vars: v,
        });
    }

    return varsAsm;
};

// get funcs from ast
const getFuncs = (ast) => {
    let funcs = [];

    for (let i = 0; i < ast.body.length; i++) {
        if (ast.body[i].id === 'functionDefinition') {
            funcs.push(ast.body[i]);
        }
    }

    return funcs;
};

// generate full asm code for all funcs
const generateAsmFuncs = (asmFuncBodies, variablesAsm, funcs) => {
    let asmCodeFuncs = [];
    let mainFunc;

    for (let i = 0; i < asmFuncBodies.length; i++) {
        let variables = [...variablesAsm].filter((elem) => {
            return elem.func === asmFuncBodies[i].func;
        });

        let func = [...funcs].filter((elem) => {
            return elem.name === asmFuncBodies[i].func;
        });

        let params = func[0].params.map((el) => {
            return `${el.variable}:DWORD`;
        });

        for (let j = 0; j < params.length; j++) {
            if (j !== params.length - 1) {
                params[j] += ', ';
            }
        }
        params = params.join('');

        let mainPart;
        if (asmFuncBodies[i].func === 'main') {
            mainPart = `
  print str$(eax)
  print chr$(13, 10)
  mov eax, input("ENTER to continue. . . ")`;
        } else {
            mainPart = '';
        }

        let asm = `
${asmFuncBodies[i].func} proc ${params}
    ${variables[0].vars.join('\n\t')}
    ${asmFuncBodies[i].asmCode.join('\n\t')}
  pop eax
  ${mainPart}
  ret
${asmFuncBodies[i].func} endp`;

        if (asmFuncBodies[i].func === 'main') {
            mainFunc = asm;
        } else {
            asmCodeFuncs.push(asm);
        }
    }
    asmCodeFuncs.push(mainFunc);

    return asmCodeFuncs;
};

const renameVarsInLoop = (funcs) => {
    let forId = 1;
    for (let i = 0; i < funcs.length; i++) {
        funcs[i].body.map((elem) => {
            if (elem.id === 'ForCycle') {
                let init = elem.initialization;
                let reinit = elem.reinitialization;
                init.map((el) => {
                    if (el.id === 'expressionWithType') {
                        el.variable += `For${forId}`;
                    }

                    return el;
                });

                // here only if in init with/without
                elem.condition.map((e) => {
                    if (
                        e.id === 'word' &&
                        e.value + `For${forId}` ===
                            elem.initialization[0].variable
                    ) {
                        e.value += `For${forId}`;
                    }
                    return e;
                });

                // if we do not have expr in cond
                let expInCond = [...elem.condition];
                if (expInCond.length === 0) {
                    expInCond.push({
                        id: 'NumberLiteral',
                        value: '1',
                    });
                }

                elem.condition = {
                    id: 'expressionWithType',
                    variable: `conditionFor${forId}`,
                    expression: expInCond,
                };

                // here if we only do without with declared var in init
                reinit.map((e) => {
                    if (
                        e.variable + `For${forId}` ===
                        elem.initialization[0].variable
                    ) {
                        e.variable += `For${forId}`;
                    }

                    e.expression.map((element) => {
                        if (
                            element.id === 'word' &&
                            element.value + `For${forId}` ===
                                elem.initialization[0].variable
                        ) {
                            element.value += `For${forId}`;
                        }
                        return e;
                    });
                    return e;
                });

                elem.body.map((el) => {
                    if (el.id === 'expressionWithType') {
                        el.variable += `ForBody${forId}`;
                        el.expression.map((e) => {
                            if (e.id === 'word') {
                                let flag1 = elem.body.some((node) => {
                                    if (node.id === 'expressionWithType') {
                                        return (
                                            node.variable ===
                                            e.value + `ForBody${forId}`
                                        );
                                    }
                                });

                                let flag2 = elem.initialization.some((node) => {
                                    if (node.id === 'expressionWithType') {
                                        return (
                                            node.variable ===
                                            e.value + `For${forId}`
                                        );
                                    }
                                });

                                if (flag1) {
                                    e.value += `ForBody${forId}`;
                                }

                                if (flag2) {
                                    e.value += `For${forId}`;
                                }
                            }
                            return e;
                        });
                    } else if (el.id === 'expressionWithoutType') {
                        let flag1 = elem.body.some((node) => {
                            if (node.id === 'expressionWithType') {
                                return (
                                    node.variable ===
                                    el.variable + `ForBody${forId}`
                                );
                            }
                        });

                        let flag2 = elem.initialization.some((node) => {
                            if (node.id === 'expressionWithType') {
                                return (
                                    node.variable ===
                                    el.variable + `For${forId}`
                                );
                            }
                        });

                        if (flag1) {
                            el.variable += `ForBody${forId}`;
                        }

                        if (flag2) {
                            el.variable += `For${forId}`;
                        }

                        el.expression.map((e) => {
                            if (e.id === 'word') {
                                let flag1 = elem.body.some((node) => {
                                    if (node.id === 'expressionWithType') {
                                        return (
                                            node.variable ===
                                            e.value + `ForBody${forId}`
                                        );
                                    }
                                });

                                let flag2 = elem.initialization.some((node) => {
                                    if (node.id === 'expressionWithType') {
                                        return (
                                            node.variable ===
                                            e.value + `For${forId}`
                                        );
                                    }
                                });

                                if (flag1) {
                                    e.value += `ForBody${forId}`;
                                }

                                if (flag2) {
                                    e.value += `For${forId}`;
                                }
                            }
                            return e;
                        });
                    }
                    return el;
                });

                forId++;
            }
        });
        forId = 1;
    }
    return funcs;
};

// main func for generating
const codeGenerator = (ast) => {
    //all asm code
    const asmCode = [];
    // func body
    let funcs = getFuncs(ast);
    //console.log(JSON.stringify(funcs, null, 2));
    funcs = renameVarsInLoop(funcs);
    //console.log(JSON.stringify(funcs, null, 2));
    // variables
    const variables = getVarsForEachFunc(funcs);
    //console.log(JSON.stringify(variables, null, 2));
    // asm code of func body
    const asmFuncBodies = getAsmCodeForEachFuncBody(funcs);
    //console.log(JSON.stringify(asmFuncBodies, null, 2));
    // generated variables in asm
    const variablesAsm = getAsmVariablesForEachFunc(variables);
    //console.log(JSON.stringify(variablesAsm, null, 2));
    const asmFuncs = generateAsmFuncs(asmFuncBodies, variablesAsm, funcs);
    // push main to the end of arr

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
includelib \\masm32\\lib\\msvcrt.lib`;
    const header = `
.486
.model flat, stdcall
option casemap : none
${includes}`;
    // data of asm code
    const data = `
.data?`;

    const multiply = `
multiply proc num1:DWORD, num2:DWORD
    mov eax, num1
    cdq
    imul num2
    ret
multiply endp`;

    const divide = `
divide proc num1:DWORD, num2:DWORD
  mov eax, num1
  cdq
  idiv num2
  ret
divide endp`;

    const sum = `
sum proc num1:DWORD, num2:DWORD
  mov eax, num1
  add eax, num2
  ret
sum endp`;

    const xorOperation = `
xorOperation proc num1:DWORD, num2:DWORD
  mov eax, num1
  xor eax, num2
  ret
xorOperation endp`;

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
negation endp`;

    // code of asm code
    const code = `
.code
start:
    call main
    exit
${multiply} 
${divide}
${sum}
${xorOperation}
${negation}
${asmFuncs.join('\n')}
end start`;

    // push all parts of asm code in arr
    asmCode.push(header);
    asmCode.push(data);
    asmCode.push(code);

    // write all asm code in file with separating by \n
    fs.writeFile(
        './6-27-JavaScript-ІВ-81-Юхимчук.asm',
        asmCode.join('\n'),
        (err) => {
            if (err) throw err;
        }
    );
    return asmCode;
};

module.exports = { codeGenerator };
