const readline = require('readline');

function READ(string) {
  return string;
}

function EVAL(string) {
  return string;
}

function PRINT(string) {
  return string;
}

function rep(string) {
  return PRINT(EVAL(READ(string)));
}

let io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "user> "
});

io.prompt();
io.on('line', (line)=> {
  io.output.write(rep(line) + "\n");
  io.prompt();
});
