import { expect } from 'chai';
import { toDebugString } from '../src/dumpable';
import { c, cid, circularArray, circularObj, d, did, map, stringy } from './objects';

describe('toDebugString', () => {
  it('undefined', () => {
    expect(toDebugString(undefined)).to.equal('undefined');
  });
  it('null', () => {
    expect(toDebugString(null)).to.equal('null');
  });
  it('false', () => {
    expect(toDebugString(false)).to.equal('false');
  });
  it('true', () => {
    expect(toDebugString(true)).to.equal('true');
  });
  it('integer', () => {
    expect(toDebugString(42)).to.equal('42');
  });
  it('exponent', () => {
    expect(toDebugString(1e42)).to.equal('1e+42');
  });
  it('decimal', () => {
    expect(toDebugString(Math.PI)).to.equal('3.141592653589793');
  });
  it('empty object', () => {
    expect(toDebugString({})).to.equal('{}');
  });
  it('object literal', () => {
    expect(toDebugString({ a: 1, b: true, c: null, d: { x: 2, y: 3 } })).to.equal(
      '{ a: 1, b: true, c: null, d: { x: 2, y: 3 } }'
    );
  });
  it('named function', () => {
    expect(toDebugString(function foo() {})).to.equal('foo()');
  });
  it('arrow function', () => {
    expect(toDebugString((x: any) => x)).to.equal('(x) => x');
  });
  it('empty string', () => {
    expect(toDebugString('')).to.equal('""');
  });
  it('string', () => {
    expect(toDebugString('hello')).to.equal('"hello"');
  });
  it('BigInt', () => {
    expect(toDebugString(BigInt('12345678901234567890'))).to.equal('12345678901234567890');
  });
  it('Symbol', () => {
    expect(toDebugString(Symbol('sym'))).to.equal('Symbol(sym)');
  });
  it('Date', () => {
    expect(toDebugString(new Date(0))).to.equal('"1970-01-01T00:00:00.000Z"');
  });
  it('array', () => {
    expect(toDebugString([1, true, null, { x: 2, y: 3 }])).to.equal('[1, true, null, { x: 2, y: 3 }]');
  });
  it('empty Map', () => {
    expect(toDebugString(new Map())).to.equal('{}');
  });
  it('Map', () => {
    expect(toDebugString(map)).to.equal(
      `{ "a": 1, { @: [C#${cid}], foo: "bar", self: [C#${cid}] }: { @: [D#${did}], c: [C#${cid}], x: null }, Symbol(circular): [Circular] }`
    );
  });
  it('Iterable', () => {
    expect(toDebugString(new Set(['abc', 'def']).entries())).to.equal('[["abc", "abc"], ["def", "def"]]');
  });
  it('circular object', () => {
    expect(toDebugString(circularObj)).to.equal('{ obj: { circular: [Circular] } }');
  });
  it('circular array', () => {
    expect(toDebugString(circularArray)).to.equal('[42, [Circular]]');
  });
  it('circular Dumpable', () => {
    expect(toDebugString(c)).to.equal(`{ @: [C#${cid}], foo: "bar", self: [C#${cid}] }`);
  });
  it('Dumpable with ref', () => {
    expect(toDebugString(d)).to.equal(`{ @: [D#${did}], c: [C#${cid}], x: null }`);
  });
  it('custom toString', () => {
    expect(toDebugString(stringy)).to.equal('Stringy');
  });
});
