const readline = require('readline');
const reader = require('./reader');
const printer = require('./printer');

function READ(string) {
  return reader.readString(string);
}

function EVAL(form) {
  return form;
}

function PRINT(value) {
  return printer.printObject(value, { printReadably: true });
}

function rep(string) {
  return PRINT(EVAL(READ(string)));
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
    io.output.write(`${rep(line)}\n`);
  } catch (e) {
    io.output.write(e.message + "\n");
  }
  io.prompt();
});
io.on('close', ()=> {
  io.output.write("\n");
});
