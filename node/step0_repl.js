const readline = require('readline');

function READ(string) {
  return string;
}

function EVAL(expression) {
  return expression;
}

function PRINT(value) {
  return value;
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
  io.output.write(`${rep(line)}\n`);
  io.prompt();
});
io.on('close', ()=> {
  io.output.write("\n");
});
