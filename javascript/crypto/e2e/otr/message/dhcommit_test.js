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
 * @fileoverview Defines tests for the DH COMMIT type used in the OTR protocol.
 *
 * @author rcc@google.com (Ryan Chan)
 */

goog.require('e2e.otr.error.ParseError');
goog.require('e2e.otr.message.DhCommit');
goog.require('e2e.otr.testing');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');

goog.setTestOnly();


var sender = new Uint8Array([0x00, 0x00, 0x01, 0x00]);
var receiver = new Uint8Array([0x00, 0x00, 0x02, 0x00]);

function testDhCommit() {
  var stubs = new goog.testing.PropertyReplacer();

  // Test values generated with https://github.com/arlolra/otr
  // in /lib/ake.js at initiateAKE.
  // The commands in comments are how the values were extracted.
  // BigInt.bigInt2str(this.r, 16)
  var r = new Uint8Array(goog.crypt.hexToByteArray(
      'D0997580ECA5A4A36A39A22163B036D3'));
  stubs.setPath('e2e.random.getRandomBytes', function(_) {return r;});


  // BigInt.bigInt2str(this.our_dh.privateKey, 16)
  var x = goog.crypt.hexToByteArray(
      'DA68BD35C67C71EC4EB4580CEC82BADBB502E2BABB86E2ADB9544A247AE5346EF2AEA5F4DE3AEA11');
  stubs.setPath('e2e.cipher.DiffieHellman.prototype.generateExponent_',
      function() {return x;});

  var commit = new e2e.otr.message.DhCommit({
    instanceTag: sender,
    remoteInstanceTag: receiver
  });

  // HLP.toByteArray(this.dhcommit).toString(), removed length 0,0,0,196,
  assertArrayEquals(
      [37, 56, 167, 255, 44, 147, 168, 233, 248, 209, 247, 189, 18, 117, 189,
       55, 49, 9, 90, 222, 222, 34, 108, 176, 33, 35, 181, 250, 28, 216, 40,
       130, 15, 29, 201, 52, 147, 188, 7, 217, 66, 214, 38, 9, 112, 30, 3, 198,
       160, 110, 38, 194, 52, 87, 113, 133, 165, 89, 48, 218, 182, 226, 78, 5,
       33, 174, 255, 61, 124, 181, 177, 233, 92, 124, 72, 62, 173, 69, 149, 9,
       55, 61, 47, 182, 203, 157, 199, 253, 228, 158, 148, 65, 92, 193, 139, 82,
       45, 137, 242, 65, 45, 189, 251, 51, 61, 123, 42, 120, 224, 246, 61, 193,
       59, 79, 65, 144, 207, 145, 48, 249, 231, 235, 36, 223, 42, 202, 14, 161,
       207, 242, 227, 142, 81, 96, 248, 181, 85, 122, 185, 27, 2, 90, 93, 17,
       253, 124, 48, 199, 237, 201, 113, 182, 143, 46, 63, 172, 102, 12, 245, 5,
       50, 170, 78, 35, 165, 134, 252, 182, 97, 3, 113, 115, 80, 58, 248, 128,
       230, 187, 168, 96, 151, 34, 99, 255, 167, 39, 225, 171, 164, 177, 170,
       50, 58, 236, 156, 56],
      commit.encryptedGxmpi_);

  // HLP.toByteArray(this.myhashed).toString(), removed length 0,0,0,32,
  assertArrayEquals(
      [132, 104, 205, 20, 9, 112, 106, 237, 251, 110, 30, 74, 97, 217, 96, 157,
       93, 65, 49, 32, 57, 87, 224, 50, 62, 246, 126, 64, 80, 71, 205, 244],
      commit.gxmpiHash_);

  var out = commit.serializeMessageContent();
  assertEquals(200 + 36, out.length);
  assertUint8ArrayEquals(
      [0, 0, 0, 196, 37, 56, 167, 255, 44, 147, 168, 233, 248, 209, 247, 189,
       18, 117, 189, 55, 49, 9, 90, 222, 222, 34, 108, 176, 33, 35, 181, 250,
       28, 216, 40, 130, 15, 29, 201, 52, 147, 188, 7, 217, 66, 214, 38, 9, 112,
       30, 3, 198, 160, 110, 38, 194, 52, 87, 113, 133, 165, 89, 48, 218, 182,
       226, 78, 5, 33, 174, 255, 61, 124, 181, 177, 233, 92, 124, 72, 62, 173,
       69, 149, 9, 55, 61, 47, 182, 203, 157, 199, 253, 228, 158, 148, 65, 92,
       193, 139, 82, 45, 137, 242, 65, 45, 189, 251, 51, 61, 123, 42, 120, 224,
       246, 61, 193, 59, 79, 65, 144, 207, 145, 48, 249, 231, 235, 36, 223, 42,
       202, 14, 161, 207, 242, 227, 142, 81, 96, 248, 181, 85, 122, 185, 27, 2,
       90, 93, 17, 253, 124, 48, 199, 237, 201, 113, 182, 143, 46, 63, 172, 102,
       12, 245, 5, 50, 170, 78, 35, 165, 134, 252, 182, 97, 3, 113, 115, 80, 58,
       248, 128, 230, 187, 168, 96, 151, 34, 99, 255, 167, 39, 225, 171, 164,
       177, 170, 50, 58, 236, 156, 56, 0, 0, 0, 32, 132, 104, 205, 20, 9, 112,
       106, 237, 251, 110, 30, 74, 97, 217, 96, 157, 93, 65, 49, 32, 57, 87,
       224, 50, 62, 246, 126, 64, 80, 71, 205, 244],
      out);

  stubs.reset();
}
