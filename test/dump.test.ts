import { expect } from 'chai';
import { consoleCircular, consoleRef, ConsoleValue, dump, DumpContext } from '../src/dumpable';
import { c, cid, circularArray, circularObj, circularSymbol, d, map, stringy } from './objects';

function toConsole(value: any): ConsoleValue {
  return new DumpContext().anyToConsole(value, true);
}

describe('dump', () => {
  it('covered', () => {
    dump('map =', map);
  });
  it('undefined', () => {
    expect(toConsole(undefined)).to.equal(undefined);
  });
  it('null', () => {
    expect(toConsole(null)).to.equal(null);
  });
  it('false', () => {
    expect(toConsole(false)).to.equal(false);
  });
  it('true', () => {
    expect(toConsole(true)).to.equal(true);
  });
  it('integer', () => {
    expect(toConsole(42)).to.equal(42);
  });
  it('exponent', () => {
    expect(toConsole(1e42)).to.equal(1e42);
  });
  it('decimal', () => {
    expect(toConsole(Math.PI)).to.equal(Math.PI);
  });
  it('empty object', () => {
    expect(toConsole({})).to.eql({});
  });
  it('object literal', () => {
    expect(toConsole({ a: 1, b: true, c: null, d: { x: 2, y: 3 } })).to.eql({
      a: 1,
      b: true,
      c: null,
      d: { x: 2, y: 3 }
    });
  });
  it('named function', () => {
    function foo(): void {}
    expect(toConsole(foo)).to.equal(foo);
  });
  it('arrow function', () => {
    const arrow = (x: any): any => x;
    expect(toConsole(arrow)).to.equal(arrow);
  });
  it('empty string', () => {
    expect(toConsole('')).to.equal('""');
  });
  it('string', () => {
    expect(toConsole('hello')).to.equal('"hello"');
  });
  it('BigInt', () => {
    const bi = BigInt('12345678901234567890');
    expect(toConsole(bi)).to.equal(bi);
  });
  it('Symbol', () => {
    const sym = Symbol('sym');
    expect(toConsole(sym)).to.equal(sym);
  });
  it('Date', () => {
    const date = new Date(0);
    expect(toConsole(date)).to.equal(date);
  });
  it('array', () => {
    expect(toConsole([1, true, null, { x: 2, y: 3 }])).to.eql([1, true, null, { x: 2, y: 3 }]);
  });
  it('Map', () => {
    expect(toConsole(map)).to.eql({
      a: 1,
      [`{ @: [C#${cid}], foo: "bar", self: [C#${cid}] }`]: { '@': consoleRef(d), c: consoleRef(c), x: null },
      [circularSymbol]: consoleCircular
    });
  });
  it('empty Map', () => {
    expect(toConsole(new Map())).to.eql({});
  });
  it('Iterable', () => {
    expect(toConsole(new Set(['abc', 'def']).entries())).to.eql([
      ['abc', 'abc'],
      ['def', 'def']
    ]);
  });
  it('circular object', () => {
    expect(toConsole(circularObj)).to.eql({ obj: { circular: consoleCircular } });
  });
  it('circular array', () => {
    expect(toConsole(circularArray)).to.eql([42, consoleCircular]);
  });
  it('circular Dumpable', () => {
    expect(toConsole(c)).to.eql({ '@': consoleRef(c), foo: 'bar', self: consoleRef(c) });
  });
  it('Dumpable with ref', () => {
    expect(toConsole(d)).to.eql({ '@': consoleRef(d), c: consoleRef(c), x: null });
  });
  it('custom toString', () => {
    expect(toConsole(stringy)).to.equal('Stringy');
  });
});
