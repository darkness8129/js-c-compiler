let fs = require('fs');

fs.readFile('./source_codes/source.c', 'utf-8', (err, content) => {
    checkRegex(content);
})

const checkRegex = (content) => {
    let lexems = [];

    lexems.push(...checkIntToken(content));
    lexems.push(...checkMainToken(content));
    lexems.push(...checkReturnToken(content));

    console.log(lexems);

}

const checkIntToken = (content) => {
    const res = content.match(/\bint\b/g);
    return res ? res : '';
}

const checkMainToken = (content) => {
    const res = content.match(/\bmain\b/g);
    return res ? res : '';
}

const checkReturnToken = (content) => {
    const res = content.match(/\breturn\b/g);
    return res ? res : '';
}
