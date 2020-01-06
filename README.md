# dumpable: Make Object.toString useful

Because attaching a debugger isn't always an option, this library provides tools to easily implement
a useful, consistent, and extensible override of `Object.toString` for your classes. After all,
you're not using a dynamic language to see something as useless as `[object Object]` in your logs.
It also provides methods to convert almost any value to a useful string or console dump.

This library and its tests and examples are written using Typescript,
but it should work just as well with modern Javascript.

## Installation

```sh
npm install dumpable
```

## API

The entire API consists of one class (`Dumpable`) and two functions (`dump` and `toDebugString`).
If you're using Typescript, you'll also need to import the `PropertyDumper` interface.

### Dumpable base class

Just extend `Dumpable` and override `dumpProperties` to have a complete `toString` implementation:

```ts
import { Dumpable, PropertyDumper } from 'dumpable';

class MyClass extends Dumpable {
  constructor(private readonly parent: MyClass | null, private readonly config?: Map<string, any>) {
    super();
  }

  public dumpProperties(d: PropertyDumper): void {
    d.addRef('parent', this.parent);
    d.addIfTruthy('config', this.config);
  }
}
```

`toString` will return a string that looks like an object literal except for a special `@` property
that identifies the class and instance of the object:

```ts
const o1 = new MyClass(null, new Map(Object.entries({ a: 1, b: 'hi' })));
console.log(o1.toString()); // { @: [MyClass#1], parent: null, config: { "a": 1, "b": "hi" } }

const o2 = new MyClass(o1);
console.log(`${o2}`); // { @: [MyClass#2], parent: [MyClass#1] }
```

Subclasses can add properties by overriding `dumpProperties` and calling the `super` implementation:

```ts
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
console.log(o3.toString()); // { @: [MySubclass:morty], parent: [MyClass#2], magic: 42 }
```

The previous example also demonstrates customizing the identity string of the class by overriding `toRefString`.

### PropertyDumper interface

The `PropertyDumper` provided to `dumpProperties` has the following methods:

#### add

```ts
add(key: string, value: any): this
```

Adds a property with the given key and value to the object dump.
The property is included even if `null` or `undefined`.

#### addRef

```ts
addRef(key: string, value: Dumpable | null | undefined): this
```

Adds a property with the given key and value to the object dump as a reference to another dumpable object.
This is useful when only the identity, rather than the full description, of the object is desired.
The property is included even if `null` or `undefined`.

#### addIfTruthy

```ts
addIfTruthy(key: string, value: any): this
```

Adds a property with the given key and value to the object dump if the value is truthy.
Truthy values are any except `null`, `undefined`, `false`, `0`, or `''`.

#### addRefIfTruthy

```ts
addRefIfTruthy(key: string, value: Dumpable | null | undefined): this
```

Adds a property with the given key and value to the object dump as a reference to another dumpable object
if the object reference is not `null` or `undefined`.
This is useful when only the identity, rather than the full description, of the object is desired.

### Utility methods

The library also includes two functions to make it easy to convert any value to a useful string or console dump.

#### toDebugString

```ts
import { toDebugString } from 'dumpable';

function toDebugString(value: any): string
```

Returns a string representation of the given value. In addition to the usual template literal and
`Object.toString` conversions, this function has special handling for the following types:

* `Date`: calls `toISOString` (e.g. `"1970-01-01T00:00:00.000Z"`)
* `Map`: formatted similar to an object literal (though the keys may be arbitrary types)
* `Array`/`Iterable`: formatted as an array literal
* `Object`: formatted as an object literal containing the object's own enumerable string-keyed properties

Structured objects are recursively formatted, and there are no depth constraints.
Circular references are returned as the object identity (as returned by `toRefString`)
for dumpable objects and the string `[Circular]` for others.

#### dump

```ts
import { dump } from 'dumpable';

function dump(...values: any[]): void
```

Dumps the given values to the console using `console.log`.
Rather than converting each value to a string, this method passes through types that tend to receive
special handling by the console, such as arrays, object literals, and certain built-in types.
For instance, [Node.js has special formatting](https://nodejs.org/api/util.html#util_customizing_util_inspect_colors)
for built-in types like `BigInt`, `Date`, `Function`, and `Symbol`.
When using Node.js, there is also special formatting support for circular and dumpable object references.
Note that unlike calling `console.log` directly, any strings passed directly to this function will be quoted.

## License

`dumpable` is available under the [ISC license](LICENSE).
