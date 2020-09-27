const lexer = (input) => {
    var current = 0;
    var tokens = [];

    const LETTERS = /[a-zA-Z]/;
    const NEWLINE = /\n/;
    const WHITESPACE = /\s/;
    const NUMBERS = /[0-9]/;

    while (current < input.length) {
        var char = input[current];

        if (char === '(' || char === ')') {
            tokens.push({
                type: 'PAREN',
                value: char
            });
            current++;
            continue;
        }

        if (char === ';') {
            tokens.push({
                type: 'SEMICOLON',
                value: ';'
            });
            current++;
            continue;
        }

        if (char === '{' || char === '}') {
            tokens.push({
                type: 'CURLY',
                value: char
            });
            current++;
            continue;
        }

        if (WHITESPACE.test(char) || NEWLINE.test(char)) {
            current++;
            continue;
        }

        if (NUMBERS.test(char)) {
            var value = '';

            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }
            tokens.push({
                type: 'NUMBER',
                value: value
            });
            continue;
        }

        if (LETTERS.test(char) || char === '_') {
            var value = char;

            if (++current < input.length) {
                char = input[current];

                while ((LETTERS.test(char) || NUMBERS.test(char) || char === '_') && (current + 1 <= input.length)) {
                    value += char;
                    char = input[++current];
                }
            }

            switch (value) {
                case 'return':
                    tokens.push({
                        type: 'RETURN',
                        value: value
                    });
                    break
                case 'int':
                    tokens.push({
                        type: 'TYPE',
                        value: value
                    });
                    break;
                default:
                    tokens.push({
                        type: 'WORD',
                        value: value
                    });
            }

            continue;
        }

        throw new TypeError('Type Error! Unrecognized Character: ' + char);
    }

    return tokens;
}

module.exports = { lexer };