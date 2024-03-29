// Copyright 2014 Google Inc. All Rights Reserved.
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
 * @fileoverview OTR session manager.
 *
 * @author rcc@google.com (Ryan Chan)
 */

goog.provide('e2e.otr.Session');

goog.require('e2e.hash.Sha256');
goog.require('e2e.otr');
goog.require('e2e.otr.Mpi');
goog.require('e2e.otr.constants');
goog.require('e2e.otr.error.IllegalStateError');
goog.require('e2e.otr.error.NotImplementedError');
goog.require('goog.asserts');


goog.scope(function() {

var constants = e2e.otr.constants;


/**
 * A session maintaining the state and configuration of an OTR conversation.
 * @constructor
 * @param {!e2e.otr.Int} instanceTag The client's instance tag.
 * @param {!e2e.otr.Policy=} opt_policy Policy params to be set on the session.
 */
e2e.otr.Session = function(instanceTag, opt_policy) {
  this.policy = goog.object.clone(constants.DEFAULT_POLICY);
  goog.object.extend(this.policy, opt_policy || {});

  this.msgState_ = constants.MSGSTATE.PLAINTEXT;
  this.remoteInstanceTag = new Uint8Array([0, 0, 0, 0]);

  this.instanceTag = instanceTag;
  assert(e2e.otr.intToNum(this.instanceTag) >= 0x100);

  this.authState_ = constants.AUTHSTATE.NONE;
  this.authData = {r: null, dh: null, gx: null, gy: null, s: null, hgx: null,
      aesgx: null, dhcommit: null, dhkey: null, revealsignature: null};
};


/**
 * Handles incoming messages.
 * @param {!Uint8Array} serialized A serialized message.
 */
e2e.otr.Session.prototype.processMessage = function(serialized) {
  throw new Error('Not yet implemented.');
};


/**
 * Stores AKE information.
 * @type {{
 *   r: e2e.ByteArray,
 *   dh: e2e.cipher.DiffieHellman,
 *   gx: e2e.ByteArray,
 *   gy: e2e.ByteArray,
 *   s: e2e.ByteArray,
 *   hgx: Uint8Array,
 *   aesgx: Uint8Array,
 *   dhcommit: e2e.otr.message.DhCommit,
 *   dhkey: e2e.otr.message.DhKey,
 *   revealsignature: e2e.otr.message.RevealSignature
 * }}
 */
e2e.otr.Session.prototype.authData;


/**
 * Gets the current auth state.
 * @return {!e2e.otr.constants.AUTHSTATE}
 */
e2e.otr.Session.prototype.getAuthState = function() { return this.authState_; };


/**
 * Sets the auth state.
 * @param {!e2e.otr.constants.AUTHSTATE} nextState The new auth state.
 */
e2e.otr.Session.prototype.setAuthState = function(nextState) {
  if (nextState) {
    assert(this.isValidAuthStateTransition_(nextState));
    this.authState_ = nextState;
  }
};


/**
 * Determines whether or not an authState transition is valid.
 * @private
 * @param {e2e.otr.constants.AUTHSTATE} nextState The next authState.
 * @return {boolean}
 */
e2e.otr.Session.prototype.isValidAuthStateTransition_ = function(nextState) {
  return this.authState_ == nextState ||
      goog.array.contains(this.getValidAuthStateTransitions_(), nextState);
};


/**
 * Gets a list of valid auth state transitions.
 * @private
 * @return {Array.<e2e.otr.constants.AUTHSTATE>}
 */
e2e.otr.Session.prototype.getValidAuthStateTransitions_ = function() {
  switch (this.authState_) {
    case constants.AUTHSTATE.NONE:
      return [
        constants.AUTHSTATE.AWAITING_DHKEY,
        constants.AUTHSTATE.AWAITING_REVEALSIG
      ];
    case constants.AUTHSTATE.AWAITING_DHKEY:
      return [
        constants.AUTHSTATE.AWAITING_REVEALSIG,
        constants.AUTHSTATE.AWAITING_SIG
      ];
    case constants.AUTHSTATE.AWAITING_REVEALSIG:
      return [
        constants.AUTHSTATE.NONE,
        constants.AUTHSTATE.AWAITING_DHKEY
      ];
    case constants.AUTHSTATE.AWAITING_SIG:
      return [
        constants.AUTHSTATE.NONE,
        constants.AUTHSTATE.AWAITING_DHKEY,
        constants.AUTHSTATE.AWAITING_REVEALSIG
      ];
    case constants.AUTHSTATE.V1_SETUP:
      return [constants.AUTHSTATE.AWAITING_REVEALSIG];
    default:
      throw new e2e.otr.error.IllegalStateError('Unknown auth state.');
  }
};


/**
 * Gets the session's message state.
 * @return {!e2e.otr.constants.MSGSTATE} The message state.
 */
e2e.otr.Session.prototype.getMsgState = function() { return this.msgState_; };


/**
 * Sets the session's message state.
 * @param {!e2e.otr.constants.MSGSTATE} nextState The new message state.
 */
e2e.otr.Session.prototype.setMsgState = function(nextState) {
  assert(this.isValidMsgStateTransition_(nextState));
  this.msgState_ = nextState;
};


/**
 * Determines whether or not a messageState transition is valid.
 * @private
 * @param {!e2e.otr.constants.MSGSTATE} nextState The next messageState.
 * @return {boolean}
 */
e2e.otr.Session.prototype.isValidMsgStateTransition_ = function(nextState) {
  return this.msgState_ == nextState ||
      goog.array.contains(this.getValidMsgStateTransitions_(), nextState);
};


/**
 * Gets a list of valid message state transitions.
 * @private
 * @return {Array.<!e2e.otr.constants.MSGSTATE>}
 */
e2e.otr.Session.prototype.getValidMsgStateTransitions_ = function() {
  switch (this.msgState_) {
    case constants.MSGSTATE.PLAINTEXT:
      return [constants.MSGSTATE.ENCRYPTED];
    case constants.MSGSTATE.ENCRYPTED:
      return [constants.MSGSTATE.PLAINTEXT, constants.MSGSTATE.FINISHED];
    case constants.MSGSTATE.FINISHED:
      return [constants.MSGSTATE.ENCRYPTED];
    default:
      throw new e2e.otr.error.IllegalStateError('Unknown message state.');
  }
};


/**
 * Sends a message to the remote party.
 * @param {string|!e2e.otr.message.Message} data The message to send.
 */
e2e.otr.Session.prototype.send = function(data) {
  if (data instanceof e2e.otr.message.Message) {
    data = data.prepareSend();
  }
  throw new e2e.otr.error.NotImplementedError('Not yet implemented.');
};


/**
 * Computes c, c', m1, m2, m1', m2' and session id from shared secret s.
 * @return {!{c: !e2e.ByteArray, cprime: !e2e.ByteArray, m1: !e2e.ByteArray,
 *     m2: !e2e.ByteArray, m1prime: !e2e.ByteArray, m2prime: !e2e.ByteArray,
 *     ssid: !e2e.ByteArray}}
 */
e2e.otr.Session.prototype.deriveKeyValues = function() {
  assert(this.authData.s);
  var secbytes = new e2e.otr.Mpi(new Uint8Array(this.authData.s));

  /**
   * h2 function as defined in OTR spec.
   * @param {number} b The input byte.
   * @return {!e2e.ByteArray} The 256-bit output of the SHA256 hash of the
   *     (5+len) bytes consisting of the byte b followed by secbytes.
   */
  var h2 = function(b) {
    return new e2e.hash.Sha256().hash([b].concat(secbytes.serialize()));
  };

  var h20x01 = h2(0x01);

  return {
    ssid: h2(0x00).slice(0, 64 / 8),
    c: h20x01.slice(0, 128 / 8),
    cprime: h20x01.slice(128 / 8),
    m1: h2(0x02),
    m2: h2(0x03),
    m1prime: h2(0x04),
    m2prime: h2(0x05)
  };
};


/**
 * Gets the long-term authentication public key.
 */
e2e.otr.Session.prototype.getPublicKey = function() {
  throw new e2e.otr.error.NotImplementedError('Not yet implemented.');
};


/**
 * Gets the long-term authentication private key.
 */
e2e.otr.Session.prototype.getPrivateKey = function() {
  throw new e2e.otr.error.NotImplementedError('Not yet implemented.');
};


/**
 * Gets the long-term authentication key id.
 */
e2e.otr.Session.prototype.getKeyId = function() {
  throw new e2e.otr.error.NotImplementedError('Not yet implemented.');
};


/**
 * Stores remote party's keyid/public key.
 * @param {!Uint8Array} keyid The keyid provided by the remote party.
 * @param {!e2e.otr.pubkeyAny} pubkey The public key associated with the key id.
 */
e2e.otr.Session.prototype.storeRemotePubkey = function(keyid, pubkey) {
  throw new e2e.otr.error.NotImplementedError('Not yet implemented.');
};


});
