class Reader {
  constructor(props = {}) {
    Object.assign(this, {index: 0, tokens: []}, props);
  }

  get next() {
    return new Reader({index: this.index + 1, tokens: this.tokens});
  }

  get currentToken() {
    return this.tokens[this.index];
  }
}

class MalList {
  constructor(previous = { members: [] }, props = {}) {
    Object.assign(this, previous,  props);
  }

  get isList() {
    return true;
  }

  get isEmpty() {
    return this.members.length === 0;
  }

  get cons() {
    return this.members[0];
  }

  get cdr() {
    return this.members.slice(1);
  }

  append(object) {
    return new MalList(this, {members: this.members.concat(object)});
  }

  begin(token) {
    return new MalList(this, {start: token});
  }

  end(token) {
    return new MalList(this, {end: token});
  }

  map(fn) {
    return new MalList({
      members: this.members.map(fn)
    });
  }
}

class MalAtom {
  constructor(props = {}) {
    Object.assign(this, props);
  }

  get string() {
    if (this.isLiteral) {
      return this.token.string;
    } else {
      return this.stringValue;
    }
  }
}

class MalInt extends MalAtom {

  get isInt() { return true; }

  get stringValue() {
    return `${this.value}`;
  }
}


class MalSymbol extends MalAtom {

  get isSymbol() { return true; }

  get stringValue() {
    return this.value;
  }
}

class Token {
  constructor(match) {
    this.match = match;
  }

  get string() {
    return this.match[1];
  }

  get index() {
    return this.match.index + (this.match[0].length - this.string.length);
  }

  get length() {
    return this.string.length;
  }
}

function tokenize(string) {
  let regexp = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"|;.*|[^\s\[\]{}('"`,;)]*)/g;
  let matches = [];
  for (let result = regexp.exec(string); result && result[0] != ''; result = regexp.exec(string)) {
    matches.push(new Token(result));
  }
  return matches;
}

function readString(string) {
  let tokens = tokenize(string);
  let reader = new Reader({ tokens });
  return readForm(reader).form;
}

function readForm(reader) {
  if (reader.currentToken.string === '(') {
    return readList(reader);
  } else {
    return readAtom(reader);
  }
}

function readList(reader) {
  let list = new MalList().begin(reader.currentToken);
  reader = reader.next;
  while (reader.currentToken.string !== ')') {
    let read = readForm(reader);
    list = list.append(read.form);
    reader = read.reader;
    if (!reader.currentToken) {
      throw new Error('mismatched parens');
    }
  }
  return {reader: reader.next, form: list.end(reader.currentToken)};
}

function readAtom(reader) {
  let form = readAtomForm(reader.currentToken);
  return {
    reader: reader.next,
    form
  };
}

function readAtomForm(token) {
  if (/^-?\d+$/.test(token.string)) {
    return new MalInt({token, value: parseInt(token.string)});
  } else {
    return new MalSymbol({token, value: token.string});
  }
}


module.exports = { Reader, tokenize, readString, MalInt };
