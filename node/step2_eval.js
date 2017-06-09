const readline = require('readline');
const reader = require('./reader');
const printer = require('./printer');

const { MalInt } = reader;

const replEnv = {
  '+': (a, b) => new MalInt({value: a.value + b.value}),
  '-': (a, b) => new MalInt({value: a.value - b.value}),
  '*': (a, b) => new MalInt({value: a.value * b.value}),
  '/': (a, b) => new MalInt({value: a.value / b.value})
};


function READ(string) {
  return reader.readString(string);
}

function EVAL(form, environment) {
  if (!form.isList) {
    return evalAST(form);
  } else {
    let list = form;
    if (list.isEmpty) {
      return list;
    }
    let evaluated  = evalAST(list);
    let fn = evaluated.cons;
    if (!fn.apply) {
      throw new Error(`'${fn.string}' does not appear to be a function`);
    }
    return evaluated.cons.apply(null, evaluated.cdr);
  }
  return form;
}

function PRINT(value) {
  return printer.printObject(value);
}

function rep(string, environment) {
  return PRINT(EVAL(READ(string)), environment);
}

function evalAST(node) {
  if (node.isSymbol) {
    let value = replEnv[node.string];
    if (!value) {
      throw new Error('no such value for symbol ' + node.string);
    }
    return value;
  } else if (node.isList) {
    return node.map(m => EVAL(m, replEnv));
  } else  {
    return node;
  }
}

let io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "user> "
});

// disable terminal mode when running from test harness
// https://github.com/kanaka/mal/issues/258#issuecomment-299007084
if (process.env['RAW']) {
  io.terminal = false;
}

io.prompt();
io.on('line', (line)=> {
  try {
    io.output.write(`${rep(line, replEnv)}\n`);
  } catch (e) {
    io.output.write(e.message + "\n");
    if (process.env['BACKTRACE']) {
      io.output.write(e.stack + "\n");
    }
  }
  io.prompt();
});
io.on('close', ()=> {
  io.output.write("\n");
});
