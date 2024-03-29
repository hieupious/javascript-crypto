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
 * @fileoverview Defines tests for the OTR related helper functions.
 *
 * @author rcc@google.com (Ryan Chan)
 */

goog.require('e2e.otr');
goog.require('e2e.otr.Serializable');
goog.require('e2e.otr.error.InvalidArgumentsError');
goog.require('e2e.otr.testing');
goog.require('goog.array');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');

goog.setTestOnly();


var SerializableArrayImpl = null;
var testInterfaceParent = null;
var testInterface = null;
var testInterfaceImpl = null;
var testInterfaceSubClass = null;
var testInterfaceSubSubClass = null;

function setUp() {
  /**
   * Serializable class.
   * @constructor
   * @extends {Array}
   * @implements {e2e.otr.Serializable}
   * @param {Array.<number>} data
   */
  SerializableArrayImpl = function(data) {
    goog.base(this);
    goog.array.extend(this, data);
  };
  goog.inherits(SerializableArrayImpl, Array);
  e2e.otr.implements(SerializableArrayImpl, e2e.otr.Serializable);

  SerializableArrayImpl.prototype.serialize = function() {
    return this.map(function(e) { return e + 1; });
  };

  testInterfaceParent = function() {};
  testInterface = function() {};
  e2e.otr.implements(testInterface, testInterfaceParent);

  testInterfaceImpl = function() {};
  e2e.otr.implements(testInterfaceImpl, testInterface);

  testInterfaceSubClass = function() {};
  goog.inherits(testInterfaceSubClass, testInterfaceImpl);

  testInterfaceSubSubClass = function() {};
  goog.inherits(testInterfaceSubSubClass, testInterfaceSubClass);
}

function tearDown() {
  SerializableArrayImpl = null;
  testInterfaceParent = null;
  testInterface = null;
}

function testSerializeBytes() {
  assertUint8ArrayEquals([1, 2, 3, 4],
      e2e.otr.serializeBytes([[1], new SerializableArrayImpl([1, 2]), [4]]));
}

function testImplements() {
  assertSameElements(SerializableArrayImpl.implementedInterfaces_,
      [e2e.otr.Serializable]);
  assertSameElements(testInterface.implementedInterfaces_,
      [testInterfaceParent]);

  e2e.otr.implements(SerializableArrayImpl, testInterface);
  assertSameElements(SerializableArrayImpl.implementedInterfaces_,
      [e2e.otr.Serializable, testInterface]);
}

function testImplementationof() {
  assertFalse(e2e.otr.implementationof(SerializableArrayImpl, testInterface));
  assertFalse(e2e.otr.implementationof(SerializableArrayImpl,
      testInterfaceParent));
  assertFalse(e2e.otr.implementationof(testInterface, testInterface));
  assertFalse(e2e.otr.implementationof(testInterfaceParent, testInterface));
  assertTrue(e2e.otr.implementationof(testInterface, testInterfaceParent));
  assertTrue(e2e.otr.implementationof(SerializableArrayImpl,
      e2e.otr.Serializable));
  e2e.otr.implements(SerializableArrayImpl, testInterface);
  assertTrue(e2e.otr.implementationof(SerializableArrayImpl, testInterface));
  assertTrue(e2e.otr.implementationof(SerializableArrayImpl,
      testInterfaceParent));
  assertFalse(e2e.otr.implementationof(testInterface, testInterface));
  assertFalse(e2e.otr.implementationof(testInterfaceParent, testInterface));
  assertTrue(e2e.otr.implementationof(testInterface, testInterfaceParent));
  assertTrue(e2e.otr.implementationof(SerializableArrayImpl,
      e2e.otr.Serializable));

  assertTrue(e2e.otr.implementationof(testInterfaceImpl, testInterface));
  assertTrue(e2e.otr.implementationof(testInterfaceImpl, testInterfaceParent));

  assertFalse(e2e.otr.implementationof(testInterfaceSubClass,
      testInterfaceImpl));
  assertTrue(e2e.otr.implementationof(testInterfaceSubClass,
      testInterface));
  assertTrue(e2e.otr.implementationof(testInterfaceSubClass,
      testInterfaceParent));

  assertTrue(e2e.otr.implementationof(testInterfaceSubSubClass,
      testInterface));
  assertTrue(e2e.otr.implementationof(testInterfaceSubSubClass,
      testInterfaceParent));
}

function testConcat() {
  assertUint8ArrayEquals([], e2e.otr.concat([]));
  assertUint8ArrayEquals([1, 2, 3, 4, 5, 6], e2e.otr.concat([
    new Uint8Array([1, 2]),
    [3, 4],
    new Uint8Array([5]),
    [],
    [6]
  ]));
}

function testNumToByte() {
  assertUint8ArrayEquals([0], e2e.otr.numToByte(0));
  assertUint8ArrayEquals([0x56], e2e.otr.numToByte(0x56));
  assertUint8ArrayEquals([0xFF], e2e.otr.numToByte(0xFF));
  [-1, 0x100, 0x5678, 0x12345678, Infinity, -Infinity].forEach(function(n) {
    assertTrue(assertThrows(function() {
      e2e.otr.numToByte(n);
    }) instanceof e2e.otr.error.InvalidArgumentsError);
  });
}

function testNumToShort() {
  assertUint8ArrayEquals([0, 0], e2e.otr.numToShort(0));
  assertUint8ArrayEquals([0x56, 0x78], e2e.otr.numToShort(0x5678));
  assertUint8ArrayEquals([0xFF, 0xFF], e2e.otr.numToShort(0xFFFF));
  [-1, 0x10000, 0x12345678, Infinity, -Infinity].forEach(function(n) {
    assertTrue(assertThrows(function() {
      e2e.otr.numToShort(n);
    }) instanceof e2e.otr.error.InvalidArgumentsError);
  });
}

function testNumToInt() {
  assertUint8ArrayEquals([0, 0, 0, 0], e2e.otr.numToInt(0));
  assertUint8ArrayEquals([0x12, 0x34, 0x56, 0x78],
      e2e.otr.numToInt(0x12345678));
  assertUint8ArrayEquals([0xFF, 0xFF, 0xFF, 0xFF],
      e2e.otr.numToInt(0xFFFFFFFF));
  [-1, 0x100000000, Infinity, -Infinity].forEach(function(n) {
    assertTrue(assertThrows(function() {
      e2e.otr.numToInt(n);
    }) instanceof e2e.otr.error.InvalidArgumentsError);
  });
}

function testByteToNum() {
  assertEquals(0, e2e.otr.byteToNum(new Uint8Array([0])));
  assertEquals(0x56, e2e.otr.byteToNum(new Uint8Array([0x56])));
  assertEquals(0xFF, e2e.otr.byteToNum(new Uint8Array([0xFF])));

  var err = assertThrows(goog.partial(e2e.otr.byteToNum, new Uint8Array([])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
  err = assertThrows(goog.partial(e2e.otr.byteToNum, new Uint8Array([1, 2])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
}

function testShortToNum() {
  assertEquals(0, e2e.otr.shortToNum(new Uint8Array([0, 0])));
  assertEquals(0x5678, e2e.otr.shortToNum(new Uint8Array([0x56, 0x78])));
  assertEquals(0xFFFF, e2e.otr.shortToNum(new Uint8Array([0xFF, 0xFF])));

  var err = assertThrows(goog.partial(e2e.otr.shortToNum, new Uint8Array([])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
  err = assertThrows(goog.partial(e2e.otr.shortToNum, new Uint8Array([1])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
  err = assertThrows(
      goog.partial(e2e.otr.shortToNum, new Uint8Array([1, 2, 3])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
}

function testIntToNum() {
  assertEquals(0, e2e.otr.intToNum(new Uint8Array([0, 0, 0, 0])));
  assertEquals(0x12345678,
      e2e.otr.intToNum(new Uint8Array([0x12, 0x34, 0x56, 0x78])));
  assertEquals(0xFFFFFFFF,
      e2e.otr.intToNum(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF])));

  var err = assertThrows(goog.partial(e2e.otr.intToNum, new Uint8Array([])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
  err = assertThrows(goog.partial(e2e.otr.intToNum, new Uint8Array([1, 2, 3])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
  err = assertThrows(
      goog.partial(e2e.otr.intToNum, new Uint8Array([1, 2, 3, 4, 5])));
  assertTrue(err instanceof e2e.otr.error.InvalidArgumentsError);
}

function testCompareByteArray() {
  var cba = e2e.otr.compareByteArray;
  assertEquals(0, cba([0], [0]));
  assertEquals(0, cba([0, 0], [0, 0, 0]));
  assertEquals(0, cba([1, 19], [0, 1, 19]));
  assertEquals(-1, cba([1, 19], [1, 1, 19]));
  assertEquals(-1, cba([0, 0, 1, 19], [1, 1, 19]));
  assertEquals(1, cba([3, 0, 1, 19], [1, 1, 19]));
}
