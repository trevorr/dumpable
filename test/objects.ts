import { Dumpable, nextObjectId, PropertyDumper } from '../src/dumpable';

export const circularObj = {
  obj: {
    circular: null as any
  }
};
circularObj.obj.circular = circularObj;

export const circularArray: any[] = [42];
circularArray.push(circularArray);

class C extends Dumpable {
  public self?: C;

  public dumpProperties(d: PropertyDumper): void {
    super.dumpProperties(d);
    d.addIfTruthy('foo', 'bar');
    d.addIfTruthy('baz', '');
    d.add('self', this.self);
  }
}
export const cid = nextObjectId;
export const c = new C();
c.self = c;

class D extends Dumpable {
  constructor(private c: C) {
    super();
  }

  public dumpProperties(d: PropertyDumper): void {
    super.dumpProperties(d);
    d.addRefIfTruthy('c', this.c);
    d.addRef('x', null);
    d.addRefIfTruthy('y', null);
  }
}
export const did = nextObjectId;
export const d = new D(c);

export const map = new Map<any, any>([
  ['a', 1],
  [c, d]
]);
export const circularSymbol = Symbol('circular');
map.set(circularSymbol, map);

class Stringy {
  public toString(): string {
    return this.constructor.name;
  }
}
export const stringy = new Stringy();
