// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

import { getAgentPlatformString } from 'azure-iot-common';
import { NoErrorCallback, noErrorCallbackToPromise } from 'azure-iot-common/lib/promise_utils';

// tslint:disable-next-line:no-var-requires
const packageJson = require('../package.json');

function _getUserAgentString(done: (agent: string) => void): void {
  /*Codes_SRS_NODE_DEVICE_UTILS_18_001: [`getUserAgentString` shall call `getAgentPlatformString` to get the platform string.]*/
  getAgentPlatformString((platformString) => {
  /*Codes_SRS_NODE_DEVICE_UTILS_18_002: [`getUserAgentString` shall call its `callback` with a string in the form 'azure-iot-device/<packageJson.version>(<platformString>)'.]*/
  done(packageJson.name + '/' + packageJson.version + ' (' + platformString + ')');
  });
}

export function getUserAgentString(done?: NoErrorCallback<string>): Promise<string> | void {
  if (done) {
    return _getUserAgentString(done);
  }

  return noErrorCallbackToPromise((_callback) => _getUserAgentString(_callback));
}
