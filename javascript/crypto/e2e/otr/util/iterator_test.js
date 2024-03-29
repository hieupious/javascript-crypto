// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Tests for the Iterator utility methods.
 *
 * @author rcc@google.com (Ryan Chan)
 */

goog.require('e2e.otr.testing');
goog.require('e2e.otr.util.Iterator');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');

goog.setTestOnly();

var si = null, ai = null, ta = null;

function setUp() {
  si = new e2e.otr.util.Iterator('test');
  ai = new e2e.otr.util.Iterator(['a', 'r', 'r', 'a', 'y']);
  ta = new e2e.otr.util.Iterator(new Uint8Array([1, 2, 3, 4, 5]));
}

function tearDown() {
  si = null;
  ai = null;
  ta = null;
}

function testConstructor() {
  assertEquals(si.iterable_, 'test');
  assertEquals(si.index_, 0);
  assertArrayEquals(ai.iterable_, ['a', 'r', 'r', 'a', 'y']);
  assertEquals(ai.index_, 0);
  assertUint8ArrayEquals(ta.iterable_, [1, 2, 3, 4, 5]);
  assertEquals(ta.index_, 0);

  [5, 0, null, undefined, {}, true].forEach(function(arg) {
    assertTrue(assertThrows(function() {
      new e2e.otr.util.Iterator(arg);
    }) instanceof e2e.otr.error.InvalidArgumentsError);
  });
}

function testHasNext() {
  assertTrue(si.hasNext());
  si.next(4);
  assertFalse(si.hasNext());

  assertTrue(ai.hasNext());
  ai.next(5);
  assertFalse(ai.hasNext());

  assertTrue(ta.hasNext());
  ta.next(5);
  assertFalse(ta.hasNext());
}

function testNext() {
  assertEquals(si.next(), 't');
  assertEquals(si.next(2), 'es');
  assertEquals(si.next(999), 't');

  assertArrayEquals(ai.next(), ['a']);
  assertArrayEquals(ai.next(2), ['r', 'r']);
  assertArrayEquals(ai.next(999), ['a', 'y']);

  assertUint8ArrayEquals(ta.next(), [1]);
  assertUint8ArrayEquals(ta.next(2), [2, 3]);
  assertUint8ArrayEquals(ta.next(999), [4, 5]);
}

function testPeek() {
  assertEquals(si.peek(), 't');
  assertEquals(si.peek(), 't');
  assertEquals(si.peek(3), 'tes');
  assertEquals(si.peek(5), 'test');
  assertEquals(si.next(), 't');
  assertEquals(si.peek(), 'e');

  assertArrayEquals(ai.peek(), ['a']);
  assertArrayEquals(ai.peek(), ['a']);
  assertArrayEquals(ai.peek(3), ['a', 'r', 'r']);
  assertArrayEquals(ai.peek(6), ['a', 'r', 'r', 'a', 'y']);
  assertArrayEquals(ai.next(), ['a']);
  assertArrayEquals(ai.peek(), ['r']);

  assertUint8ArrayEquals(ta.peek(), [1]);
  assertUint8ArrayEquals(ta.peek(), [1]);
  assertUint8ArrayEquals(ta.peek(3), [1, 2, 3]);
  assertUint8ArrayEquals(ta.peek(6), [1, 2, 3, 4, 5]);
  assertUint8ArrayEquals(ta.next(), [1]);
  assertUint8ArrayEquals(ta.peek(), [2]);
}

function testRest() {
  assertEquals(si.rest(), 'test');
  assertFalse(si.hasNext());

  si = new e2e.otr.util.Iterator('test');
  assertEquals(si.next(), 't');
  assertEquals(si.rest(), 'est');
  assertFalse(si.hasNext());

  assertArrayEquals(ai.rest(), ['a', 'r', 'r', 'a', 'y']);
  assertFalse(ai.hasNext());

  ai = new e2e.otr.util.Iterator(['a', 'r', 'r', 'a', 'y']);
  assertArrayEquals(ai.next(), ['a']);
  assertArrayEquals(ai.rest(), ['r', 'r', 'a', 'y']);
  assertFalse(ai.hasNext());

  assertUint8ArrayEquals(ta.rest(), [1, 2, 3, 4, 5]);
  assertFalse(ta.hasNext());

  ta = new e2e.otr.util.Iterator(new Uint8Array([1, 2, 3, 4, 5]));
  assertUint8ArrayEquals(ta.next(), [1]);
  assertUint8ArrayEquals(ta.rest(), [2, 3, 4, 5]);
  assertFalse(ta.hasNext());
}
