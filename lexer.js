const lexer = (input) => {
    // current char of input code
    var current = 0;

    // lines of C code
    let line = 1;

    // arr of all tokens
    var tokens = [];

    // regular expressions for diff cases
    const LETTERS = /[a-zA-Z]/;
    const NEWLINE = /\r/;
    const WHITESPACE = /[\n\t\f\v ]/;
    const NUMBERS = /[0-9]|\./;

    while (current < input.length) {
        var char = input[current];

        // end flag of line
        if (NEWLINE.test(char)) {
            line++;
            current++;

            tokens.push({
                type: 'LINEFLAG',
                value: '\r'
            });

            continue;
        }

        // not interested in spaces token, so skip it
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        // return word and some others tokens    
        if (LETTERS.test(char) || char === '_') {
            var value = char;

            // for checking return int float...
            let reservedWord = true;

            if (++current < input.length) {
                char = input[current];

                while ((LETTERS.test(char) || NUMBERS.test(char) || char === '_') && (current + 1 <= input.length)) {
                    value += char;
                    char = input[++current];
                }

                // whitespace does not ++ value so i do it here
                if (char === ' ') {
                    char = input[++current];
                }

                // when variable or func name
                if ((char === '(' || char === ')' || char === ';'
                    || char === '=' || char === '^'
                    || char === '*' || char === '/'
                    || char === '!') && value !== 'return') {
                    reservedWord = false;
                }
            }

            // check for standard words of c language
            if (reservedWord === true) {
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
                    case 'float':
                        tokens.push({
                            type: 'TYPE',
                            value: value
                        });
                        break;
                    default:
                        throw Error(`Error! Unknown token! Line:${line}`);
                }
            }
            else {
                tokens.push({
                    type: 'WORD',
                    value: value
                });
            }

            continue;
        }

        // return parenthesis token
        if (char === '(' || char === ')') {
            tokens.push({
                type: 'PARENTHESIS',
                value: char
            });

            current++;
            continue;
        }

        // return curly token
        if (char === '{' || char === '}') {
            tokens.push({
                type: 'CURLY',
                value: char
            });

            current++;
            continue;
        }

        // hex number token
        if (char === '0' && input[++current] === 'x') {
            char = input[++current];
            var value = '0x';

            while (NUMBERS.test(char) || LETTERS.test(char)) {
                value += char;
                char = input[++current];
            }

            tokens.push({
                type: 'HEX_NUMBER',
                value: value
            });

            continue;
        }

        // return number token
        if (NUMBERS.test(char)) {
            var value = '';
            //char = input[current];

            // need while if in number more than one digit
            while (NUMBERS.test(char)) {
                value += char;
                if (value[0] === '0') {
                    char = input[--current];
                }
                char = input[++current];
            }

            tokens.push({
                type: 'NUMBER',
                value: value
            });

            continue;
        }

        // return semicolon token
        if (char === ';') {
            tokens.push({
                type: 'SEMICOLON',
                value: ';'
            });

            current++;
            continue;
        }

        // return logical not token
        if (char === '!') {
            tokens.push({
                type: 'LOGICAL_NEGATION',
                value: '!'
            });

            current++;
            continue;
        }

        // mul token
        if (char === '*') {
            tokens.push({
                type: 'MUL_OPERATION',
                value: '*'
            });

            current++;
            continue;
        }

        // XOR token
        if (char === '^') {
            tokens.push({
                type: 'XOR_OPERATION',
                value: '^'
            });

            current++;
            continue;
        }

        // division token
        if (char === '/') {
            tokens.push({
                type: 'DIV_OPERATION',
                value: '/'
            });

            current++;
            continue;
        }

        // assign token
        if (char === '=') {
            tokens.push({
                type: 'ASSIGN',
                value: '='
            });

            current++;
            continue;
        }

        // assign token
        if (char === ':') {
            tokens.push({
                type: 'COLON',
                value: ':'
            });

            current++;
            continue;
        }

        // assign token
        if (char === '?') {
            tokens.push({
                type: 'TERNARY_OPERATOR',
                value: '?'
            });

            current++;
            continue;
        }

        // throw err when we do not know char
        throw new TypeError('Type Error! Unrecognized Character: ' + char);
    }

    return tokens;
}

module.exports = { lexer };