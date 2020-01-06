// exported for testing
export let nextObjectId = 1;

// scalars are handled naturally by template literals
type Scalar = string | number | boolean | null | undefined;

// console methods have special handling for a wider set of built-in types
type ConsoleScalar = Scalar | BigInt | Date | Function | symbol | ConsoleCircular | Ref;

// exported for testing
export type ConsoleValue = ConsoleScalar | ConsoleArray | ConsoleObject;

interface ConsoleArray extends Array<ConsoleValue> {}

interface ConsoleObject {
  [property: string]: ConsoleValue;
}

/**
 * Interface receiving properties that an object wishes to dump.
 */
export interface PropertyDumper {
  /**
   * Adds the given property to the object dump.
   *
   * @param key the property name
   * @param value the property value
   */
  add(key: string, value: any): this;

  /**
   * Adds the given property to the object dump as a reference to another dumpable object.
   * This is useful when only the identity, rather than the full description, of the object
   * is desired.
   *
   * @param key the property name
   * @param value the property value
   */
  addRef(key: string, value: Dumpable | null | undefined): this;

  /**
   * Adds the given property to the object dump if the value is truthy.
   *
   * @param key the property name
   * @param value the property value
   */
  addIfTruthy(key: string, value: any): this;

  /**
   * Adds the given property to the object dump as a reference to another dumpable object
   * if the object reference is not null or undefined.
   * This is useful when only the identity, rather than the full description, of the object
   * is desired.
   *
   * @param key the property name
   * @param value the property value
   */
  addRefIfTruthy(key: string, value: Dumpable | null | undefined): this;
}

const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

const inspect = Symbol.for('nodejs.util.inspect.custom');

const circularString = '[Circular]';

class ConsoleCircular {
  [inspect](_: number, options: any): string {
    return options.stylize(circularString, 'special');
  }
}

// exported for testing
export const consoleCircular = isNode ? new ConsoleCircular() : /* istanbul ignore next */ circularString;

// exported for testing
export class Ref {
  constructor(private readonly target: Dumpable) {}

  [inspect](_: number, options: any): string {
    return options.stylize(this.toString(), 'special');
  }

  public toString(): string {
    return this.target.toRefString();
  }
}

// exported for testing
export function consoleRef(target: Dumpable): Ref | string {
  return isNode ? new Ref(target) : /* istanbul ignore next */ target.toRefString();
}

class AnyPropertyDumper implements PropertyDumper {
  private readonly properties: Record<string, any> = {};

  public add(key: string, value: any): this {
    this.properties[key] = value;
    return this;
  }

  public addRef(key: string, value: Dumpable | null | undefined): this {
    return this.add(key, value ? new Ref(value) : value);
  }

  public addIfTruthy(key: string, value: any): this {
    if (value) {
      return this.add(key, value);
    }
    return this;
  }

  public addRefIfTruthy(key: string, value: Dumpable | null | undefined): this {
    if (value) {
      return this.addRef(key, value);
    }
    return this;
  }

  public getProperties(): Readonly<Record<string, any>> {
    return this.properties;
  }
}

class ConsolePropertyDumper extends AnyPropertyDumper {
  constructor(private readonly context: DumpContext) {
    super();
  }

  public add(key: string, value: any): this {
    return super.add(key, this.context.anyToConsole(value, false));
  }
}

// exported for testing
export class DumpContext {
  private readonly dumpingObjects = new Set<object>();

  public anyToString(value: any): string {
    return `${this.anyToScalar(value)}`;
  }

  private anyToScalar(value: any): Scalar {
    switch (typeof value) {
      case 'boolean':
      case 'number':
      case 'undefined':
        return value;
      case 'object':
        return value ? this.objectToString(value) : null;
      case 'function':
        return value.name ? `${value.name}()` : value.toString();
      case 'string':
        return JSON.stringify(value);
      default:
        // bigint, symbol
        return value.toString();
    }
  }

  private anyToProperty(value: any): string | number | symbol {
    switch (typeof value) {
      case 'string':
      case 'number':
      case 'symbol':
        return value;
      default:
        return this.anyToString(value);
    }
  }

  // like anyToScalar, but passes bigint, function, and symbol through
  public anyToConsole(value: any, quoteString: boolean): ConsoleValue {
    switch (typeof value) {
      case 'object':
        return value ? this.objectToConsole(value) : null;
      case 'string':
        return quoteString ? JSON.stringify(value) : value;
      default:
        // bigint, boolean, function, number, symbol, undefined
        return value;
    }
  }

  private objectToConsole(obj: object): ConsoleValue {
    if (obj instanceof Date || (obj instanceof Ref && isNode)) {
      return obj;
    }

    if (this.dumpingObjects.has(obj)) {
      return obj instanceof Dumpable ? consoleRef(obj) : consoleCircular;
    }

    let val;
    this.dumpingObjects.add(obj);
    if (obj instanceof Dumpable) {
      const dumper = new ConsolePropertyDumper(this);
      obj.dumpProperties(dumper);
      val = { '@': consoleRef(obj), ...dumper.getProperties() };
    } else if (isIterable(obj)) {
      if (obj instanceof Map) {
        val = Object.fromEntries(
          Array.from(obj.entries(), ([k, v]) => [this.anyToProperty(k), this.anyToConsole(v, false)])
        );
      } else {
        val = Array.from(obj, v => this.anyToConsole(v, false));
      }
    } else {
      val = obj.toString();
      if (val === '[object Object]') {
        val = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.anyToConsole(v, false)]));
      }
    }
    this.dumpingObjects.delete(obj);
    return val;
  }

  public objectToString(obj: object): string {
    if (obj instanceof Date) {
      return '"' + obj.toISOString() + '"';
    }

    if (this.dumpingObjects.has(obj)) {
      return obj instanceof Dumpable ? obj.toRefString() : circularString;
    }

    let str;
    this.dumpingObjects.add(obj);
    if (obj instanceof Dumpable) {
      const dumper = new AnyPropertyDumper();
      obj.dumpProperties(dumper);
      str = this.objectEntriesToString({ '@': new Ref(obj), ...dumper.getProperties() });
    } else if (isIterable(obj)) {
      if (obj instanceof Map) {
        str = this.mapToString(obj);
      } else {
        str = '[' + Array.from(obj, v => this.anyToString(v)).join(', ') + ']';
      }
    } else {
      str = obj.toString();
      if (str === '[object Object]') {
        str = this.objectEntriesToString(obj);
      }
    }
    this.dumpingObjects.delete(obj);
    return str;
  }

  private objectEntriesToString(obj: object): string {
    const entries = Object.entries(obj);
    return entries.length > 0 ? `{ ${entries.map(([k, v]) => `${k}: ${this.anyToScalar(v)}`).join(', ')} }` : '{}';
  }

  private mapToString(map: Map<any, any>): string {
    const entries = Array.from(map.entries(), ([k, v]) => `${this.anyToScalar(k)}: ${this.anyToScalar(v)}`);
    return entries.length > 0 ? `{ ${entries.join(', ')} }` : '{}';
  }
}

/**
 * Dumps the given values to the console using `console.log`.
 *
 * @param values values of any type to dump
 */
export function dump(...values: any[]): void {
  const context = new DumpContext();
  console.log(...values.map(value => context.anyToConsole(value, true)));
}

/**
 * Returns a string representation of the given value.
 *
 * @param value a value of any type to stringify
 */
export function toDebugString(value: any): string {
  return new DumpContext().anyToString(value);
}

function isIterable(obj: any): obj is Iterable<any> {
  return obj && typeof obj[Symbol.iterator] === 'function';
}

/**
 * Base class for dumpable objects. Provides an extensible implementation of `toString`.
 * Override `dumpProperties` to include significant properties in the object dump.
 */
export class Dumpable {
  private readonly objectId = nextObjectId++;

  /**
   * Overridden by subclasses to dump their displayed properties.
   * Indirect subclasses should call `super.dumpProperties` to ensure
   * that any base class properties are included.
   *
   * @param _ a property dumper that receives the object's displayed property names and values
   */
  public dumpProperties(_: PropertyDumper): void {}

  /**
   * Returns a string representation of this object,
   * which will be of the form `{ @: [<class>#<id>], prop1: value1, ... }`.
   */
  public toString(): string {
    return new DumpContext().objectToString(this);
  }

  /**
   * Returns a string representing the unique identity of this object,
   * which will be of the form `[<class>#<id>]`.
   */
  public toRefString(): string {
    return `[${this.constructor.name}#${this.objectId}]`;
  }
}
