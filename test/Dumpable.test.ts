import { expect } from 'chai';
import { c, cid, d, did } from './objects';

describe('Dumpable', () => {
  it('toRefString', () => {
    expect(c.toRefString()).to.equal(`[C#${cid}]`);
    expect(d.toRefString()).to.equal(`[D#${did}]`);
  });
  it('toString', () => {
    expect(c.toString()).to.equal(`{ @: [C#${cid}], foo: "bar", self: [C#${cid}] }`);
    expect(d.toString()).to.equal(`{ @: [D#${did}], c: [C#${cid}], x: null }`);
  });
});
