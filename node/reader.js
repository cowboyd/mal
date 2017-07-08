const { assign } = Object;

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

class MalCollection {
  static fromOpeningDelimeter(delimeter) {
    switch (delimeter) {
    case '(':
      return MalList;
    case '[':
      return MalVector;
    case '{':
      return MalHashMap;
    default:
      throw new Error(`'${delimeter}' does not begin a collection`);
    }
  }

  constructor(previous = {}, props = {}) {
    Object.assign(this, assign({ members: [] }, previous),  props);
  }

  begin(token) {
    return new this.constructor(this, {start: token});
  }

  end(token) {
    return new this.constructor(this, {end: token});
  }

  append(object) {
    return new this.constructor(this, {members: this.members.concat(object)});
  }

  map(fn) {
    return new this.constructor({
      members: this.members.map(fn)
    });
  }
}

class MalList extends MalCollection {
  static get openingDelimiter() { return '('; }
  static get closingDelimiter() { return ')'; }

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
}

class MalVector extends MalCollection {
  static get openingDelimiter() { return '['; }
  static get closingDelimiter() { return ']'; }

  get isVector() {
    return true;
  }
}

class MalHashMap extends MalCollection {
  static get openingDelimiter() { return '{'; }
  static get closingDelimiter() { return '}'; }

  constructor(previous = {}, props = {}) {
    super(assign({ hash: {} }, previous),  props);
  }

  append(object) {
    let next = super.append(object);
    if (next.isEven) {
      let key = next.members[next.members.length - 2];
      if (key.isKeyword || key.isString) {
        let hashed = new MalHashMap(next, {hash: assign({}, next.hash, { [key.hashValue]: object })});
        return hashed;
      } else {
        throw new Error(`hash map keys must either be strings or symbols, but ${key.stringValue} is a ${key.constructor.name}`);
      }
    } else {
      return next;
    }
  }

  get(key) {
    return this.hash[key.hashValue];
  }

  get isEven() {
    return (this.members.length % 2) === 0;
  }

  get isOdd() {
    return !this.isEven;
  }

  get keys() {
    return this.members.reduce((keys, member, index)=> {
      if ((index % 2) === 0) {
        return keys.concat(member);
      } else {
        return keys;
      }
    }, []);
    return Object.keys(this.hash);
  }

  get isHashMap() {
    return true;
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

class MalBoolean extends MalAtom {

  get isBoolean() { return true; }

  get isTrue() { return !!this.value; }

  get isFalse() { return !this.isTrue; }

  get stringValue() {
    return (!!this.value).toString();
  }
}

const TRUE = new MalBoolean({value: true});
const FALSE = new MalBoolean({value: false});

class MalInt extends MalAtom {

  get isInt() { return true; }

  get stringValue() {
    return `${this.value}`;
  }
}

class MalString extends MalAtom {
  get isString() { return true; }

  get stringValue() { return this.value; }

  get hashValue() { return this.string; }

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

  get hashValue() { return `\u029E${this.value}`; }
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
  if (/^[(\[{]$/.test(reader.currentToken.string)) {
    return readCollection(reader);
  } else {
    return readAtom(reader);
  }
}

function readCollection(reader) {
  let Collection = MalCollection.fromOpeningDelimeter(reader.currentToken.string);
  let collection = new Collection().begin(reader.currentToken);
  reader = reader.next;
  while (reader.currentToken.string !== Collection.closingDelimiter) {
    let read = readForm(reader);
    collection = collection.append(read.form);
    reader = read.reader;
    if (!reader.currentToken) {
      throw new Error(`expected '${Collection.closingDelimiter}', but it never happened`);
    }
  }
  return {reader: reader.next, form: collection.end(reader.currentToken)};
}

function readAtom(reader) {
  let form = readAtomForm(reader.currentToken);
  return {
    reader: reader.next,
    form
  };
}

function readAtomForm(token) {
  if (token.string === "true") {
    return TRUE;
  } else if (token.string === "false") {
    return FALSE;
  } else if (/^-?\d+$/.test(token.string)) {
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
