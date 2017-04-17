/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

'use strict';

const AWS = require('aws-sdk');
const PATH = require('path');
const FS = require('fs');

class TestCredential {
  constructor(credentialFile) {
    var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

    if (credentialFile === undefined) {
      var stream = FS.readFileSync(PATH.join(home, '.aws', 'test.credential'), 'utf8');
      this.$credential = JSON.parse(stream);
    }
    else
      this.$credential = require(credentialFile);

    this.$awsConfig = null;
  }

  get region() { return this.$credential.region; }

  get accessKeyId() { return this.$credential.aws.accessKeyId; }
  get secretAccessKey() { return this.$credential.aws.secretAccessKey; }

  get authUser() { return this.$credential.elemental.sAuthUser; }
  get authKey() { return this.$credential.elemental.sAuthKey; }

  loadAws(region) {
    if (region !== undefined)
      this.$credential.region = region;

    this.$awsConfig = new AWS.Config(this.$credential.aws);
    AWS.config.update({ region: this.$credential.region });
  }
}

module.exports.TestCredential = TestCredential;
