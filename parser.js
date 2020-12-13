const parser = (tokens) => {
    // index of current token
    var current = 0;
    let line = 1;
    let funcIndex = -1;
    let forIndex = -1;
    // types
    let typeOfFunc, typeOfReturn;

    //func for checking errors with variables
    const checkErrWithVar = (exp, environment) => {
        const LETTERS = /[a-zA-Z]/;
        for (let i = 0; i < exp.length; i++) {
            if (
                LETTERS.test(exp[i]) &&
                exp[i][0] !== '0' &&
                exp[i][1] !== 'x'
            ) {
                let isDeclared = false;
                let isInitialized = false;

                const check = (body) => {
                    for (let j = 0; j < body.length; j++) {
                        if (
                            body[j].id === 'expressionWithType' ||
                            body[j].id === 'declaration' ||
                            (body[j].id === 'ternaryExpression' && body[j].type)
                        ) {
                            if (body[j].variable === exp[i]) {
                                isDeclared = true;
                                break;
                            }
                        }
                    }

                    for (let j = 0; j < body.length; j++) {
                        if (
                            body[j].id === 'expressionWithoutType' ||
                            body[j].id === 'expressionWithType' ||
                            body[j].id === 'ternaryExpression'
                        ) {
                            if (body[j].variable === exp[i]) {
                                isInitialized = true;
                                break;
                            }
                        }
                    }
                };

                if (
                    environment === 'func' ||
                    environment === 'forNodeInitialization'
                ) {
                    let body = ast.body[funcIndex].body;
                    let params = ast.body[funcIndex].params;
                    check(body);
                    for (let j = 0; j < params.length; j++) {
                        if (params[j].variable === exp[i]) {
                            isDeclared = true;
                            isInitialized = true;
                            break;
                        }
                    }
                } else if (environment === 'forNodeBody') {
                    let body = ast.body[funcIndex].body;
                    let forNodeBody = body.filter((elem) => {
                        return elem.id === 'ForCycle';
                    })[forIndex].body;
                    // check in for body
                    check(forNodeBody);
                    // check in func body
                    check(body);
                } else if (
                    environment === 'forNodeCondition' ||
                    environment === 'forNodeReinitialization'
                ) {
                    let body = ast.body[funcIndex].body;
                    let forNodeInitialization = body.filter((elem) => {
                        return elem.id === 'ForCycle';
                    })[forIndex].initialization;
                    check(forNodeInitialization);
                    check(body);
                }
                if (!isDeclared) {
                    // when do not declared
                    throw new Error(
                        `Error: Variable ${exp[i]} is not declared. Line: ${line}`
                    );
                }

                // when do not initialized
                if (!isInitialized) {
                    throw new Error(
                        `Error: Variable ${exp[i]} is not initialized. Line: ${line}`
                    );
                }
            }
        }
    };

    const parseTernaryExpr = (node, expStr) => {
        let condition = [...node.expression].slice(1, expStr.lastIndexOf('?'));
        let firstOperand = [...node.expression].slice(
            expStr.lastIndexOf('?') + 1,
            expStr.lastIndexOf(':')
        );
        let secondOperand = [...node.expression].slice(
            expStr.lastIndexOf(':') + 1
        );

        if (condition.length === 0) {
            throw new Error(`Error! Condition does not exist. Line: ${line}`);
        } else if (firstOperand.length === 0) {
            throw new Error(
                `Error! First operand does not exist. Line: ${line}`
            );
        } else if (secondOperand.length === 0) {
            throw new Error(
                `Error! Second operand does not exist. Line: ${line}`
            );
        }

        return {
            id: 'ternaryExpression',
            type: node.type,
            variable: node.variable,
            condition,
            firstOperand,
            secondOperand,
        };
    };

    const walk = (environment = 'func') => {
        // current token
        var token = tokens[current];

        // increment line when we see line flag
        if (token.type === 'LINEFLAG') {
            current++;
            line++;

            return;
        }
        // function node
        // need second check because we have types in func also
        if (
            token.type === 'TYPE' &&
            tokens[current + 1].type === 'WORD' &&
            tokens[current + 2].value === '('
        ) {
            // to push the body to the desired function
            funcIndex++;

            var type = token.value;
            typeOfFunc = type;

            // skip type token
            token = tokens[++current];

            var node = {
                id: 'functionDefinition',
                name: token.value,
                type: type,
                params: [],
                body: [],
            };

            // skip main token
            token = tokens[++current];

            // we can not write smth after name of func
            if (token.type !== 'PARENTHESIS') {
                token = tokens[++current];
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            // adding params for func node
            if (token.type === 'PARENTHESIS' && token.value === '(') {
                token = tokens[++current];
                while (
                    token.type !== 'PARENTHESIS' ||
                    (token.type === 'PARENTHESIS' && token.value !== ')')
                ) {
                    if (token.type === 'COMA') {
                        current++;
                        token = tokens[current];
                    } else {
                        node.params.push(walk());
                        token = tokens[current];
                    }
                }

                current++;
                if (tokens[current].value === ';') {
                    current++;
                    return {
                        id: 'functionDeclaration',
                        name: node.name,
                        type: node.type,
                        params: [...node.params],
                    };
                }

                let isAlreadyDefined = ast.body.some((elem) => {
                    if (elem.id === 'functionDefinition') {
                        return elem.name === node.name;
                    }
                });

                if (isAlreadyDefined) {
                    throw new Error(
                        `Error! Function ${node.name} is already defined. Line:${line}`
                    );
                }

                return node;
            }
        }

        // function body node
        if (token.value === '{') {
            token = tokens[++current];

            while (
                token.type !== 'CURLY' ||
                (token.type === 'CURLY' && token.value !== '}')
            ) {
                // for check if node === null
                let funcVal = walk();
                if (funcVal) {
                    ast.body[funcIndex].body.push(funcVal);
                }

                token = tokens[current];
            }

            // we can not write symbols after '}'
            if (
                token.type === 'CURLY' &&
                token.value === '}' &&
                token[++current]
            ) {
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            // check we have return or not
            const returnFlag = ast.body[funcIndex].body.some((node) => {
                return node.id === 'Return';
            });

            // when we do not have return
            if (!returnFlag) {
                throw new Error(
                    `Error: The function should have return statement.`
                );
            }

            current++;
            line++;

            return node;
        }

        // return 'return' node
        if (token.type === 'RETURN') {
            token = tokens[++current];

            var node = {
                id: 'Return',
                body: [],
            };

            while (
                token.type !== 'SEMICOLON' ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                if (
                    token.type !== 'NUMBER' &&
                    token.type !== 'HEX_NUMBER' &&
                    token.type !== 'XOR_OPERATION' &&
                    token.type !== 'DIV_OPERATION' &&
                    token.type !== 'LOGICAL_NEGATION' &&
                    token.type !== 'PARENTHESIS' &&
                    token.type !== 'WORD' &&
                    token.type !== 'MUL_OPERATION' &&
                    token.type !== 'PLUS_OPERATION'
                ) {
                    throw new Error(`Error: Wrong return value. Line: ${line}`);
                }
                // can not assign in return
                else if (token.type === 'ASSIGN') {
                    throw new Error(
                        `Error: Cannot assign variable in the return statement. Line: ${line}`
                    );
                }

                node.body.push(walk());
                token = tokens[current];
            }

            //number of ( === number of )
            if (
                node.body.filter((node) => node.value === '(').length !==
                node.body.filter((node) => node.value === ')').length
            ) {
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            // can not be **
            for (let i = 0; i < node.body.length; i++) {
                if (
                    node.body[i].value === '*' &&
                    node.body[i + 1].value === '*'
                ) {
                    throw new Error(`Error: Unexpected token. Line: ${line}`);
                }
            }
            if (node.body[0].id !== 'functionCall') {
                // when using not declared or not initialized variable
                const exp = node.body.map((elem) => {
                    return elem.value;
                });
                checkErrWithVar(exp, environment);
            }

            current++;
            return node;
        }

        // numberLiteral node
        if (token.type === 'NUMBER') {
            current++;
            if (token.value.indexOf('.') === -1) {
                typeOfReturn = 'int';
            } else {
                typeOfReturn = 'float';
            }

            return {
                id: 'NumberLiteral',
                value: token.value,
            };
        }

        // HexNumberLiteral node
        if (token.type === 'HEX_NUMBER') {
            //check for normal hex num
            if (isNaN(parseInt(token.value, 16))) {
                throw new Error(
                    `Error: Hex number is not valid. Line: ${line}`
                );
            }

            current++;
            return {
                id: 'HexNumberLiteral',
                value: token.value,
            };
        }

        // Logical negation node
        if (token.type === 'LOGICAL_NEGATION') {
            current++;
            return {
                id: 'LogicalNegation',
                value: token.value,
            };
        }

        // Logical negation node
        if (token.type === 'PARENTHESIS') {
            current++;
            return {
                id: 'Brace',
                value: token.value,
            };
        }

        // Logical negation node
        if (token.type === 'MUL_OPERATION') {
            current++;
            return {
                id: 'MultiplicationOperation',
                value: token.value,
            };
        }

        // div node
        if (token.type === 'DIV_OPERATION') {
            current++;
            return {
                id: 'DivideOperation',
                value: token.value,
            };
        }

        // XOR node
        if (token.type === 'XOR_OPERATION') {
            current++;
            return {
                id: 'XOROperation',
                value: token.value,
            };
        }

        // assign node
        if (token.type === 'ASSIGN') {
            current++;
            return {
                id: 'Assign',
                value: token.value,
            };
        }

        // word node when expression
        if (
            token.type === 'WORD' &&
            tokens[current - 1].type !== 'TYPE' &&
            tokens[current - 1].type !== 'RETURN' &&
            (tokens[current + 1].value === '=' ||
                tokens[current + 1].value === '^')
        ) {
            var node = {
                id: 'expressionWithoutType',
                variable: token.value,
                expression: [],
            };

            // when we have ^=
            if (tokens[current + 1].value === '^') {
                node.expression.push(tokens[current]);
                // here token ^
                current++;
                node.expression.push(tokens[current]);
            }

            // here token =
            current++;

            while (
                token.type !== 'SEMICOLON' ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                // need this in for cycle
                if (token.value === ')' && tokens[current + 1].value === '{') {
                    break;
                }

                node.expression.push(walk());
                token = tokens[current];
            }
            // need this in for cycle
            if (token.value !== ')') current++;

            // when using not declared or not initialized variable
            const exp = node.expression.map((elem) => {
                return elem.value;
            });
            checkErrWithVar(exp, environment);

            // when variable before = not declared
            let flag = ast.body[funcIndex].body.some((elem) => {
                if (
                    elem.id === 'declaration' ||
                    elem.id === 'expressionWithType'
                ) {
                    return elem.variable === node.variable;
                }
            });

            if (environment === 'forNodeReinitialization') {
                let body = ast.body[funcIndex].body;
                let forNodeInit = body.filter((elem) => {
                    return elem.id === 'ForCycle';
                })[forIndex].initialization;

                flag = forNodeInit.some((elem) => {
                    if (
                        elem.id === 'declaration' ||
                        elem.id === 'expressionWithType'
                    ) {
                        return elem.variable === node.variable;
                    }
                });
            }

            if (!flag) {
                throw new Error(
                    `Error: Variable ${node.variable} is not declared. Line: ${line}`
                );
            }

            // if we have ternary expr
            if (exp.join('').lastIndexOf('?') !== -1) {
                return parseTernaryExpr(node, exp);
            }

            return {
                ...node,
                expression: node.expression.filter(
                    (elem) => elem.id !== 'Assign'
                ),
            };
        }

        // call function
        if (
            token.type === 'WORD' &&
            tokens[current + 1].value === '(' &&
            tokens[current - 1].type !== 'TYPE'
        ) {
            current++;
            var node = {
                id: 'functionCall',
                funcName: token.value,
                params: [],
            };
            token = tokens[current];
            if (token.type === 'PARENTHESIS' && token.value === '(') {
                token = tokens[++current];
                while (
                    token.type !== 'PARENTHESIS' ||
                    (token.type === 'PARENTHESIS' && token.value !== ')')
                ) {
                    if (token.type === 'COMA') {
                        current++;
                        token = tokens[current];
                    } else {
                        node.params.push(walk());
                        token = tokens[current];
                    }
                }
            }

            let flag = ast.body.some((elem) => {
                if (
                    elem.id === 'functionDefinition' ||
                    elem.id === 'functionDeclaration'
                ) {
                    return elem.name === node.funcName;
                }
            });
            if (flag) {
                let paramsFlag = true;
                let functionInAst = ast.body.filter((elem) => {
                    if (
                        (elem.id === 'functionDefinition' ||
                            elem.id === 'functionDeclaration') &&
                        elem.name === node.funcName
                    ) {
                        return elem;
                    }
                });

                if (functionInAst[0].params.length !== node.params.length) {
                    paramsFlag = false;
                }

                if (!paramsFlag) {
                    throw new Error(
                        `Error! Inappropriate number of parameters. Line:${line}`
                    );
                }
            } else {
                throw new Error(
                    `Error! Function ${node.funcName} is not declared. Line:${line}`
                );
            }

            current++;

            return node;
        }

        // simple node node
        if (token.type === 'WORD') {
            current++;
            return {
                id: 'word',
                value: token.value,
            };
        }

        // type node
        if (
            token.type === 'TYPE' &&
            tokens[current + 1].type === 'WORD' &&
            tokens[current + 2].value !== '(' &&
            tokens[current + 2].value !== ')' &&
            tokens[current + 2].value !== ','
        ) {
            current++;
            var node = {
                id: 'expressionWithType',
                type: token.value,
                variable: tokens[current].value,
                expression: [],
            };

            // when var already declared
            let isAlreadyDeclared = false;
            if (environment === 'func') {
                isAlreadyDeclared = ast.body[funcIndex].body.some((elem) => {
                    if (
                        (elem.id === 'expressionWithType' ||
                            elem.id === 'declaration') &&
                        elem.variable === node.variable
                    ) {
                        return true;
                    }
                });
            } else if (environment === 'forNodeBody') {
                let body = ast.body[funcIndex].body;
                let forNodeBody = body.filter((elem) => {
                    return elem.id === 'ForCycle';
                })[forIndex].body;

                isAlreadyDeclared = forNodeBody.some((elem) => {
                    if (
                        (elem.id === 'expressionWithType' ||
                            elem.id === 'declaration') &&
                        elem.variable === node.variable
                    ) {
                        return true;
                    }
                });
            }
            if (isAlreadyDeclared) {
                throw new Error(
                    `Error: Variable ${node.variable} is already declared. Line: ${line}`
                );
            }

            if (tokens[current + 1].value === '^') {
                throw new Error(
                    `Error! Variable ${node.variable} is not initialized! Line: ${line}.`
                );
            }

            token = tokens[++current];

            while (
                token.type !== 'SEMICOLON' ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                node.expression.push(walk());
                token = tokens[current];
            }
            current++;

            // when using not declared or not initialized variable
            const exp = node.expression.map((elem) => {
                return elem.value;
            });

            if (
                node.expression.length > 0 &&
                node.expression[1].id !== 'functionCall'
            ) {
                checkErrWithVar(exp, environment);
            }

            if (node.expression.length === 0) {
                return {
                    id: 'declaration',
                    type: node.type,
                    variable: node.variable,
                };
            }

            // if we have ternary expr
            if (exp.join('').lastIndexOf('?') !== -1) {
                return parseTernaryExpr(node, exp);
            }

            return {
                ...node,
                expression: node.expression.filter(
                    (elem) => elem.id !== 'Assign'
                ),
            };
        }

        // function parameter node
        if (
            token.type === 'TYPE' &&
            tokens[current + 1].type === 'WORD' &&
            (tokens[current + 2].value === ',' ||
                tokens[current + 2].value === ')')
        ) {
            current++;
            var node = {
                id: 'functionParameter',
                type: token.value,
                variable: tokens[current].value,
            };

            current++;
            return node;
        }

        // semicolon node
        if (token.type === 'SEMICOLON') {
            current++;
            return {
                id: 'semicolon',
                value: token.value,
            };
        }

        // ternary node
        if (token.type === 'TERNARY_OPERATOR') {
            current++;
            return {
                id: 'ternary',
                value: token.value,
            };
        }

        // colon node
        if (token.type === 'COLON') {
            current++;
            return {
                id: 'colon',
                value: token.value,
            };
        }

        // plus node
        if (token.type === 'PLUS_OPERATION') {
            current++;
            return {
                id: 'PlusOperation',
                value: token.value,
            };
        }

        if (token.type === 'FOR_CYCLE') {
            forIndex++;
            // skip for
            token = tokens[++current];

            if (token.type === 'PARENTHESIS' && token.value === '(') {
                token = tokens[++current];

                var node = {
                    id: 'ForCycle',
                    initialization: [],
                    condition: [],
                    reinitialization: [],
                    body: [],
                };
                ast.body[funcIndex].body.push(node);

                let index = 0;
                while (
                    token.type !== 'PARENTHESIS' ||
                    (token.type === 'PARENTHESIS' && token.value !== ')')
                ) {
                    if (token.type === 'SEMICOLON') {
                        current++;
                        index++;
                        token = tokens[current];
                    } else {
                        switch (index) {
                            case 0:
                                node.initialization.push(
                                    walk('forNodeInitialization')
                                );
                                if (
                                    node.initialization[0].id ===
                                        'expressionWithType' ||
                                    node.initialization[0].id ===
                                        'expressionWithoutType'
                                ) {
                                    // because skip ; in exprWith/WithoutType
                                    index++;
                                } else {
                                    throw new Error(
                                        `Error! Wrong part of initialization in the loop. Line:${line}`
                                    );
                                }
                                break;
                            case 1:
                                let funcVal1 = walk();

                                if (funcVal1) {
                                    let body = ast.body[funcIndex].body;
                                    let forNodeCond = body.filter((elem) => {
                                        return elem.id === 'ForCycle';
                                    })[forIndex].condition;
                                    forNodeCond.push(funcVal1);
                                }

                                const exp = node.condition.map((elem) => {
                                    return elem.value;
                                });
                                checkErrWithVar(exp, 'forNodeCondition');

                                break;
                            case 2:
                                // for check if node === null
                                let funcVal2 = walk('forNodeReinitialization');
                                if (funcVal2) {
                                    let body = ast.body[funcIndex].body;
                                    let forNodeReinit = body.filter((elem) => {
                                        return elem.id === 'ForCycle';
                                    })[forIndex].reinitialization;
                                    forNodeReinit.push(funcVal2);
                                }

                                if (
                                    node.reinitialization[0].id !==
                                    'expressionWithoutType'
                                ) {
                                    throw new Error(
                                        `Error! Wrong part of reinitialization in the loop. Line:${line}`
                                    );
                                }

                                const exp2 = node.reinitialization[0].expression.map(
                                    (elem) => {
                                        return elem.value;
                                    }
                                );
                                checkErrWithVar(
                                    exp2,
                                    'forNodeReinitialization'
                                );

                                break;
                        }
                        token = tokens[current];
                    }
                }

                current++;
                token = tokens[current];
                if (token.value === '{') {
                    token = tokens[++current];

                    while (
                        token.type !== 'CURLY' ||
                        (token.type === 'CURLY' && token.value !== '}')
                    ) {
                        // for check if node === null
                        let funcVal = walk('forNodeBody');
                        if (funcVal) {
                            let body = ast.body[funcIndex].body;
                            let forNodeBody = body.filter((elem) => {
                                return elem.id === 'ForCycle';
                            })[forIndex].body;
                            forNodeBody.push(funcVal);
                        }

                        token = tokens[current];
                    }

                    current++;
                }
            }

            return;
        }

        // break node
        if (token.type === 'BREAK') {
            current += 2;
            if (environment !== 'forNodeBody') {
                throw new Error(
                    `Error! The break operator is outside the loop. Line:${line}`
                );
            }
            return {
                id: 'BreakOperator',
                value: token.value,
            };
        }

        // continue node
        if (token.type === 'CONTINUE') {
            current += 2;
            if (environment !== 'forNodeBody') {
                throw new Error(
                    `Error! The continue operator is outside the loop. Line:${line}`
                );
            }
            return {
                id: 'ContinueOperator',
                value: token.value,
            };
        }

        throw new Error(`Unknown type:${token.type}; value: ${token.value}`);
    };

    // root node
    let ast = {
        id: 'Program',
        body: [],
    };

    // while we have nodes execute recursive func
    while (current < tokens.length) {
        var node = walk();
        // check that walk() do not return null
        if (node) {
            ast.body.push(node);
        }
    }

    return ast;
};

module.exports = { parser };
