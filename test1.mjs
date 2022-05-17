const err = `API TypeError: ammoFull.match is not a function
TypeError: ammoFull.match is not a function
    at handleammo (apiscript.js:15712:27)
    at apiscript.js:15326:17
    at eval (eval at <anonymous> (/home/node/d20-api-server/api.js:168:1), <anonymous>:65:16)
    at Object.publish (eval at <anonymous> (/home/node/d20-api-server/api.js:168:1), <anonymous>:70:8)
    at /home/node/d20-api-server/api.js:1739:12
    at /home/node/d20-api-server/node_modules/firebase/lib/firebase-node.js:93:560
    at hc (/home/node/d20-api-server/node_modules/firebase/lib/firebase-node.js:39:147)
    at Kd (/home/node/d20-api-server/node_modules/firebase/lib/firebase-node.js:93:546)
    at Id.Mb (/home/node/d20-api-server/node_modules/firebase/lib/firebase-node.js:93:489)
    at Zd.Ld.Mb (/home/node/d20-api-server/node_modules/firebase/lib/firebase-node.js:94:425)`;

const apiMeta = {
  script1: {
    start: 100,
    end: 5000
  },
  script2: {
    start: 15112,
    end: 17000
  }
}

const isBound = (number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (typeof(min) !== 'number' || typeof(max) !== 'number' || typeof(number) !== 'number') return null;
  return (number >= min && number <= max);
}

const isWithinScript = (lineNumber) => {
  for (const script in apiMeta) {
    if (lineNumber >= apiMeta[script].start && lineNumber <= apiMeta[script].end) {
      console.log(`Found line number in script: ${script}`);
      return apiMeta[script];
    }
  }
}

const offsetLineNumbers = (errorString, scriptOffsets) => {
  const offset = scriptOffsets.start;
  // console.log(offset);
  return errorString.replace(/:(\d+):(\d+)(\)?)/g, (m, p1, p2, p3) => {
    // console.log(m);
    const originalLine = parseInt(p1);
    if (isBound(originalLine, scriptOffsets.start, scriptOffsets.end)) {
      const newLine = originalLine ? originalLine - offset : null;
      return newLine > 0 ? `:${newLine}:${p2} [offset from ${p1}]${p3}` : m;
    } else return m;
  });
}

const checkLineNumbers = (error) => {
  const firstLineNumber = (err.match(/:(\d+):/)||[])[1],
    firstCaller = (err.match(/at\s+(\w+)/)||[])[1];
  if (!firstLineNumber) return;
  // console.log(firstLineNumber);
  const containingScript = isWithinScript(firstLineNumber);
  if (containingScript) {
    const newError = offsetLineNumbers(error, containingScript);
    return { err: newError, caller: firstCaller, line: firstLineNumber } ;
  }
  return null;
}

const isError = (string) => {
  const rx = {
    topLine: /Error.*\n/,
    at: /\n[\s\t]*at\s+/,
    lineNumber: /:\d+:\d+/,
  }
  if (rx.topLine.test(string) && rx.at.test(string) && rx.lineNumber.test(string)) return true;
  return false;
}

const newError = checkLineNumbers(err);

const obj = {
  moo: { stuff: 'thing' }
}

const thingo = `\"{\\\"name\\\":\\\"apiMetaOffset\\\",\\\"TokenMod\\\":{\\\"start\\\":1452,\\\"end\\\":5453},\\\"ScriptCards\\\":{\\\"start\\\":9176,\\\"end\\\":13193},\\\"companionScript5e\\\":{\\\"start\\\":14923,\\\"end\\\":15525},\\\"libInline\\\":{\\\"start\\\":15584,\\\"end\\\":15916}}\"`
const fuckingHell = thingo.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/g, '');

console.log(thingo);
console.log(fuckingHell);

console.log(JSON.parse(fuckingHell))

console.log(obj)

const str = `Error: API stack\n    at Object.error (apiscript.js:15571:82)\n    at apiscript.js:15578:11\n    at eval (eval at <anonymous> (/home/node/d20-api-server/api.js:168:1), <anonymous>:65:16)\n    at Object.publish (eval at <anonymous> (/home/node/d20-api-server/api.js:168:1), <anonymous>:70:8)\n    at /home/node/d20-api-server/api.js:1542:14\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)`


console.log(str);