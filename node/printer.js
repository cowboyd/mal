function printObject(object) {
  if (object.isList) {
    return `(${object.members.map(printObject).join(' ')})`;
  } else if (object.isVector) {
    return `[${object.members.map(printObject).join(' ')}]`;
  } else if (object.isHashMap) {
    return `{${object.keys.map(key => `${printObject(key)} ${printObject(object.get(key))}`).join(' ')}}`;
  } else if (object.isString) {
    return encodeString(object.value);
  } else {
    return object.string;
  }
}

function encodeString(string) {
  let search = /("|\n|\\)/g;
  let value = "";
  let lastIndex = 0;
  for (let hit = search.exec(string); hit !== null; hit = search.exec(string)) {
    let [match] = hit;
    let encoded = "";
    if (match === '"') {
      encoded = '\\"';
    } else if (match === "\n") {
      encoded = '\\n';
    } else if (match === "\\") {
      encoded = "\\\\";
    }
    value = value.concat(string.slice(lastIndex, hit.index), encoded);
    lastIndex = search.lastIndex;
  }
  value = value.concat(string.slice(lastIndex, string.length));
  return `"${value}"`;
}

module.exports = { printObject };
