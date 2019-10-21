import * as readline from 'readline';
import { fork, Sequence, Operation } from 'effection';


function* READ(str: string) {
  return str;
}

function* EVAL(source: string) {
  return source;
}

function* PRINT(object: string) {
  return object;
}

function* rep(str: string): Sequence {
  let r = yield READ(str);
  let e = yield EVAL(r);
  let p = yield PRINT(e);
  return p;
}

function* main(prompt): Sequence {
  while (true) {
    let line = yield getLine(prompt)
    let result = yield rep(line);
    console.log(result)
  }
}

fork(function*() {
  let prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'user>'
  });

  try {
    yield main(prompt);
  } finally {
    prompt.close();
  }
});

function getLine(prompt: readline.Interface): Operation {
  return execution => {
    prompt.question('user> ', (answer: string) => {
      execution.resume(answer);
    });
  }
}
