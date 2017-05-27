function printObject(object) {
  if (object.isList) {
    return `(${object.members.map(printObject).join(' ')})`;
  } else {
    return object.token.string;
  }
}

module.exports = { printObject };
