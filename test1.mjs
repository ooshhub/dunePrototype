class Poo {
  constructor() { }

  update() {
    console.log('updating Poo');
    this.stuff = 'bum';
  }
}

class Wee extends Poo {
  constructor() { super() }

  update() {
    super.update();
    console.log('fuck');
  }
}

const piss = new Wee();

piss.update();
console.log(piss.stuff);