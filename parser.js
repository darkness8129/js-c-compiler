const parser = (tokens) => {

    var current = 0;

    const walk = () => {
        var token = tokens[current];

        if (token.type === 'TYPE') {
            var type = token.value;

            token = tokens[++current];

            var node = {
                id: 'Function',
                name: token.value,
                type: type,
                body: []
            };

            token = tokens[++current];

            if (
                token.type === 'PAREN' &&
                token.value === '('
            ) {
                token = tokens[++current];
                while (
                    (token.type !== 'PAREN') ||
                    (token.type === 'PAREN' && token.value !== ')')
                ) {
                    node.params.push(walk());
                    token = tokens[current];
                }

                current++;
                return node;
            }
        }

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


        if (token.type === 'NUMBER') {
            current++;
            return {
                id: 'NumberLiteral',
                value: token.value
            };
        }

        throw new Error(`Unknown type:${token.type}; value: ${token.value}`);
    }

    let ast = {
        id: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        var node = walk();
        if (node) {
            ast.body.push(node);
        }
    }

    return ast;
}

module.exports = { parser };