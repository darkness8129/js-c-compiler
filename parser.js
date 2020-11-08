const parser = (tokens) => {
    // index of current token
    var current = 0;
    let line = 1;

    // types
    let typeOfFunc,
        typeOfReturn;

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
        if (token.type === 'TYPE' && tokens[current + 1].value === 'main') {
            var type = token.value;
            typeOfFunc = type;

            // skip type token
            token = tokens[++current];

            var node = {
                id: 'Function',
                name: token.value,
                type: type,
                params: [],
                body: []
            };

            //check having main func
            if (node.name !== 'main') {
                throw Error(`Error! You should have main function! Line:${line}`)
            }

            // skip main token
            token = tokens[++current];

            // we can not write smth after name of func
            if (token.type !== 'PARENTHESIS') {
                token = tokens[++current];
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            // adding params for func node
            if (
                token.type === 'PARENTHESIS' &&
                token.value === '('
            ) {

                token = tokens[++current];

                while (
                    (token.type !== 'PARENTHESIS') ||
                    (token.type === 'PARENTHESIS' && token.value !== ')')
                ) {
                    node.params.push(walk());
                    token = tokens[current];
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
                (token.type !== 'CURLY') ||
                (token.type === 'CURLY' && token.value !== '}')
            ) {
                //TODO FOR 2 LAB!!!!
                // for check if node === null
                let funcVal = walk();
                if (funcVal) {
                    ast.body[0].body.push(funcVal);
                }

                token = tokens[current];
            }

            // we can not write symbols after '}'
            if (token.type === 'CURLY' && token.value === '}' && token[++current]) {
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            current++;

            return node;
        }

        // return 'return' node
        if (token.type === 'RETURN') {
            token = tokens[++current];

            var node = {
                id: 'Return',
                body: []
            };

            while (
                (token.type !== 'SEMICOLON') ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                //when in return returned value not number and not hex number
                // if (token.type !== 'NUMBER' &&
                //     token.type !== 'HEX_NUMBER' &&
                //     token.type !== 'LOGICAL_NEGATION' &&
                //     token.type !== 'PARENTHESIS' &&
                //     token.type !== 'MUL_OPERATION') {
                //     throw new Error(`Error: Return value should be number. Line: ${line}`);
                // }

                node.body.push(walk());
                token = tokens[current];
            }

            //number of ( === number of )
            if (node.body.filter(node => node.value === '(').length !==
                node.body.filter(node => node.value === ')').length
            ) {
                throw new Error(`Error: Unexpected token. Line: ${line}`);
            }

            // can not be **
            for (let i = 0; i < node.body.length; i++) {
                if (node.body[i].value === '*' && node.body[i + 1].value === '*') {
                    throw new Error(`Error: Unexpected token. Line: ${line}`);
                }
            }

            current++;
            return node;

        }

        // numberLiteral node
        if (token.type === 'NUMBER') {
            current++;
            if (token.value.indexOf('.') === -1) {
                typeOfReturn = 'int'
            }
            else {
                typeOfReturn = 'float'
            }

            // check types
            if (typeOfFunc === 'int' && typeOfReturn === 'float') {
                throw new Error(`Error: Return type has not correct type. Line: ${line}`);
            }

            return {
                id: 'NumberLiteral',
                value: token.value
            };
        }

        // HexNumberLiteral node
        if (token.type === 'HEX_NUMBER') {
            //check for normal hex num
            if (isNaN(parseInt(token.value, 16))) {
                throw new Error(`Error: Hex number is not valid. Line: ${line}`);
            }

            current++;
            return {
                id: 'HexNumberLiteral',
                value: token.value
            };
        }

        // Logical negation node
        if (token.type === 'LOGICAL_NEGATION') {

            current++;
            return {
                id: 'LogicalNegation',
                value: token.value
            };
        }

        // Logical negation node
        if (token.type === 'PARENTHESIS') {

            current++;
            return {
                id: 'Brace',
                value: token.value
            };
        }

        // Logical negation node
        if (token.type === 'MUL_OPERATION') {

            current++;
            return {
                id: 'MultiplicationOperation',
                value: token.value
            };
        }

        // div node
        if (token.type === 'DIV_OPERATION') {

            current++;
            return {
                id: 'DivisionOperation',
                value: token.value
            };
        }

        // XOR node
        if (token.type === 'XOR_OPERATION') {

            current++;
            return {
                id: 'XOROperation',
                value: token.value
            };
        }

        // assign node
        if (token.type === 'ASSIGN') {

            current++;
            return {
                id: 'Assign',
                value: token.value
            };
        }

        // word node when expression
        if (token.type === 'WORD' && tokens[current - 1].type !== 'TYPE' && tokens[current + 1].value === '=') {
            var node = {
                id: 'expressionWithoutType',
                variable: token.value,
                expression: [],
            };

            current++;

            while (
                (token.type !== 'SEMICOLON') ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                node.expression.push(walk());
                token = tokens[current];
            }
            current++;
            return { ...node, expression: node.expression.filter((elem) => elem.id !== 'Assign') };

        }

        // simple node node
        if (token.type === 'WORD') {
            current++;
            return {
                id: 'word',
                value: token.value
            };
        }

        // type node
        if (token.type === 'TYPE' && tokens[current + 1].value !== 'main') {
            current++;
            var node = {
                id: 'expressionWithType',
                type: token.value,
                variable: tokens[current].value,
                expression: [],
            };

            token = tokens[++current];

            while (
                (token.type !== 'SEMICOLON') ||
                (token.type === 'SEMICOLON' && token.value !== ';')
            ) {
                node.expression.push(walk());
                token = tokens[current];

            }
            current++;

            if (node.expression.length === 0) {
                return {
                    id: 'declaration',
                    type: node.type,
                    variable: node.variable
                }
            }

            return { ...node, expression: node.expression.filter((elem) => elem.id !== 'Assign') };
        }

        // semicolon node
        if (token.type === 'SEMICOLON') {
            current++;
            return {
                id: 'semicolon',
                value: token.value
            };
        }

        throw new Error(`Unknown type:${token.type}; value: ${token.value}`);
    }

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

}

module.exports = { parser };

