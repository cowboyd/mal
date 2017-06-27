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

class MalString extends MalAtom {
  get isString() { return true; }

  get stringValue() { return this.value; }
}


class MalSymbol extends MalAtom {

  get isSymbol() { return true; }

  get stringValue() {
    return this.value;
  }
}

let keywords = {};

class MalKeyword extends MalAtom {

  static for(string, token = undefined) {
    let keyword = keywords[string];
    if (!keyword) {
      keyword = keywords[string] = new MalKeyword({ token, value: string });
    }
    return keyword;
  }

  get isKeyword() { return true; }

  get stringValue() {
    return `:${this.value}`;
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
  } else if (/^:/.test(token.string)) {
    return MalKeyword.for(token.string.slice(1), token);
  } else if (/^"/.test(token.string)) {
    //unwrap from quotes -> ["helloworld"] becomes [hello world]
    let encoded = token.string.slice(1, token.string.length - 1);
    let value = "";
    let search = /(\\\\|\\n|\\")/g;
    let lastIndex = 0;
    for (let hit = search.exec(encoded); hit !== null; hit = search.exec(encoded)) {
      let [match] = hit;
      let part = "";
      if (match === '\\"') {
        part = '"';
      } else if (match === "\\\\") {
        part = "\\";
      } else if (match === "\\n") {
        part = "\n";
      } else {
        throw new Error(`Unrecognized string '${part}' but  matched. If you see this error it is a very serious bug.`);
      }
      value = value.concat(encoded.slice(lastIndex, hit.index), part);
      lastIndex = search.lastIndex;
    }
    value = value.concat(encoded.slice(lastIndex));
    return new MalString({ token, value });
  } else {
    return new MalSymbol({ token, value: token.string });
  }
}


module.exports = { Reader, tokenize, readString, MalInt };
