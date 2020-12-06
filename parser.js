const parser = (tokens) => {
    // index of current token
    var current = 0;
    let line = 1;
    let funcIndex = -1;
    // types
    let typeOfFunc, typeOfReturn;

    //func for checking errors with variables
    const checkErrWithVar = (exp) => {
        const LETTERS = /[a-zA-Z]/;
        for (let i = 0; i < exp.length; i++) {
            if (
                LETTERS.test(exp[i]) &&
                exp[i][0] !== '0' &&
                exp[i][1] !== 'x'
            ) {
                let flag1 = false;
                let body = ast.body[funcIndex].body;
                let params = ast.body[funcIndex].params;
                for (let j = 0; j < body.length; j++) {
                    if (
                        body[j].id === 'expressionWithType' ||
                        body[j].id === 'declaration' ||
                        (body[j].id === 'ternaryExpression' && body[j].type)
                    ) {
                        if (body[j].variable === exp[i]) {
                            flag1 = true;
                            break;
                        }
                    }
                }

                let flag2 = false;
                for (let j = 0; j < body.length; j++) {
                    if (
                        body[j].id === 'expressionWithoutType' ||
                        body[j].id === 'expressionWithType' ||
                        body[j].id === 'ternaryExpression'
                    ) {
                        if (body[j].variable === exp[i]) {
                            flag2 = true;
                            break;
                        }
                    }
                }

                for (let j = 0; j < params.length; j++) {
                    if (params[j].variable === exp[i]) {
                        flag1 = true;
                        flag2 = true;
                        break;
                    }
                }

                // when do not declared
                if (!flag1) {
                    throw new Error(
                        `Error: Variable ${exp[i]} is not declared. Line: ${line}`
                    );
                }

                // when do not initialized
                if (!flag2) {
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

    const walk = () => {
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
                id: 'Function',
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

                // we can not write smth after ()
                if (tokens[current].type !== 'CURLY') {
                    token = tokens[++current];
                    throw new Error(`Error: Unexpected token. Line: ${line}`);
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
                //when in return returned value not number and not hex number, and not operation
                if (
                    token.type !== 'NUMBER' &&
                    token.type !== 'HEX_NUMBER' &&
                    token.type !== 'XOR_OPERATION' &&
                    token.type !== 'DIV_OPERATION' &&
                    token.type !== 'LOGICAL_NEGATION' &&
                    token.type !== 'PARENTHESIS' &&
                    token.type !== 'WORD' &&
                    token.type !== 'MUL_OPERATION'
                ) {
                    throw new Error(
                        `Error: Return value should be number. Line: ${line}`
                    );
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
                checkErrWithVar(exp);
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

            // check types
            // if (typeOfFunc === 'int' && typeOfReturn === 'float') {
            //     throw new Error(`Error: Return type has not correct type. Line: ${line}`);
            // }

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
            console.log(tokens[current]);

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
            checkErrWithVar(exp);

            // when variable before = not declared
            let flag = ast.body[funcIndex].body.some((elem) => {
                if (
                    elem.id === 'declaration' ||
                    elem.id === 'expressionWithType'
                ) {
                    return elem.variable === node.variable;
                }
            });

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
            let flag = ast.body[funcIndex].body.some((elem) => {
                if (
                    (elem.id === 'expressionWithType' ||
                        elem.id === 'declaration') &&
                    elem.variable === node.variable
                ) {
                    return true;
                }
            });

            if (flag) {
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

            if (node.expression[1].id !== 'functionCall') {
                checkErrWithVar(exp);
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
