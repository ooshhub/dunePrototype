const obj = {
  one: {
    name: 'bob',
    id: 123,
    desc: 'blah',
  },
  two: {
    name: 'alice',
    id: 532,
    desc: 'flaps'
  }
}

const data = {
  one: {
    name: 'bob B'
  }
}

for (const id in data) {
  // Object.assign(obj[id], data[id]);
  obj[id] = data[id];
}

console.log(obj)

console.log('brk');