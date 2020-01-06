import { expect } from 'chai';
import { Dumpable, nextObjectId, PropertyDumper } from '../src/dumpable';

describe('examples', () => {
  it('basic', () => {
    const id = nextObjectId;

    class MyClass extends Dumpable {
      constructor(private readonly parent: MyClass | null, private readonly config?: Map<string, any>) {
        super();
      }

      public dumpProperties(d: PropertyDumper): void {
        d.addRef('parent', this.parent);
        d.addIfTruthy('config', this.config);
      }
    }

    const o1 = new MyClass(null, new Map(Object.entries({ a: 1, b: 'hi' })));
    expect(o1.toString()).to.equal(`{ @: [MyClass#${id}], parent: null, config: { "a": 1, "b": "hi" } }`);

    const o2 = new MyClass(o1);
    expect(`${o2}`).to.equal(`{ @: [MyClass#${id + 1}], parent: [MyClass#${id}] }`);

    class MySubclass extends MyClass {
      constructor(parent: MyClass | null, private readonly name: string, private readonly magic: number) {
        super(parent);
      }

      public dumpProperties(d: PropertyDumper): void {
        super.dumpProperties(d);
        d.add('magic', this.magic);
      }

      public toRefString(): string {
        return `[${this.constructor.name}:${this.name}]`;
      }
    }

    const o3 = new MySubclass(o2, 'morty', 42);
    expect(o3.toString()).to.equal(`{ @: [MySubclass:morty], parent: [MyClass#${id + 1}], magic: 42 }`);
  });
});
