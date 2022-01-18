let param = `list2`;

let cmd = (param.match(/^([^\s]+?)(\s|$)/)||[])[1];

console.log(cmd);