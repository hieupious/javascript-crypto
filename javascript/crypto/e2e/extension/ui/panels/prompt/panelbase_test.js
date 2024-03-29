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
 * @fileoverview Unit tests for the panel base for the prompt UI.
 */

goog.provide('e2e.ext.ui.panels.prompt.PanelBaseTest');

goog.require('e2e.ext.constants');
goog.require('e2e.ext.ui.dialogs.Generic');
goog.require('e2e.ext.ui.panels.prompt.PanelBase');
goog.require('e2e.ext.ui.templates.panels.prompt');
goog.require('goog.dom.classlist');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');
goog.require('soy');

goog.setTestOnly();

var constants = e2e.ext.constants;
var mockControl = null;
var panel = null;
var panelTitle = 'panel-title';
var stubs = new goog.testing.PropertyReplacer();
var templates = e2e.ext.ui.templates.panels.prompt;


function setUp() {
  mockControl = new goog.testing.MockControl();

  stubs.setPath('chrome.i18n.getMessage', function(msg) {
    return msg;
  });

  if (!document.getElementById(constants.ElementId.CALLBACK_DIALOG)) {
    var callbackDialog = document.createElement('div');
    callbackDialog.id = constants.ElementId.CALLBACK_DIALOG;
    document.body.appendChild(callbackDialog);
  }

  panel = new e2e.ext.ui.panels.prompt.PanelBase(panelTitle);
  panel.render(document.body);
  soy.renderElement(panel.getElement(), templates.renderGenericForm, {});
}


function tearDown() {
  stubs.reset();
  mockControl.$tearDown();
  goog.dispose(panel);
  panel = null;
}


function testGetTitle() {
  assertEquals(panelTitle, panel.getTitle());
}


function testRenderDismiss() {
  assertFalse(goog.dom.classlist.contains(
      panel.getElementByClass(constants.CssClass.ACTION),
      constants.CssClass.HIDDEN));

  panel.renderDismiss();

  assertTrue(goog.dom.classlist.contains(
      panel.getElementByClass(constants.CssClass.ACTION),
      constants.CssClass.HIDDEN));
  assertContains('promptDismissActionLabel', panel.getElement().textContent);
}


function testRenderPassphraseDialog() {
  var passphrase = 'passphrase';
  var uid = 'uid to display';
  var callback = mockControl.createFunctionMock();
  callback(passphrase);

  stubs.setPath('chrome.i18n.getMessage', mockControl.createFunctionMock());
  chrome.i18n.getMessage('promptPassphraseCallbackMessage', uid).$returns(uid);
  chrome.i18n.getMessage(goog.testing.mockmatchers.ignoreArgument).$times(2);

  mockControl.$replayAll();
  panel.renderPassphraseDialog(uid, callback);
  assertContains(uid, document.body.textContent);

  for (var childIdx = 0; childIdx < panel.getChildCount(); childIdx++) {
    var child = panel.getChildAt(childIdx);
    if (child instanceof e2e.ext.ui.dialogs.Generic) {
      child.dialogCallback_(passphrase);
    }
  }

  assertNotContains(uid, document.body.textContent);
  mockControl.$verifyAll();
}
