const parser = (tokens) => {
    // index of current token
    var current = 0;

    const walk = () => {
        // current token
        var token = tokens[current];

        // function node
        if (token.type === 'TYPE') {
            var type = token.value;

            // skip type token
            token = tokens[++current];

            var node = {
                id: 'Function',
                name: token.value,
                type: type,
                params: [],
                body: []
            };

            // skip main token
            token = tokens[++current];

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
                ast.body[0].body.push(walk());
                token = tokens[current];
            }

            current++;

            return node;

        }

        // return node
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
                node.body.push(walk());
                token = tokens[current];
            }

            current++;
            return node;

        }

        // numberLiteral node
        if (token.type === 'NUMBER') {
            current++;
            return {
                id: 'NumberLiteral',
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