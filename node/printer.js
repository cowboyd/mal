function printObject(object) {
  if (object.isList) {
    return `(${object.members.map(printObject).join(' ')})`;
  } else {
    return object.string;
  }
}

module.exports = { printObject };
