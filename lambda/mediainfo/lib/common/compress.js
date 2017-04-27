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

const ZLIB = require('zlib');
const BaseNotifier = require('./baseNotifier').BaseNotifier;

const MAX_LEN = 255;

class Compress extends BaseNotifier {
  constructor(allowableLength) {
    super();
    this.$maxLen = allowableLength || MAX_LEN;
  }

  encode(data) {
    if (!data)
      return this.error(new Error(`Compress.encode: no data is specified`));


    ZLIB.deflate(JSON.stringify(data), (err, encoded) => {
      if (err) {
        err.message = `Compress.encode: ${err.message}`;
        return this.error(err);
      }

      if (encoded.toString('base64').length > this.$maxLen)
        return this.error(new Error(`ServerJobHayU.encodeUserData: user_data (${encoded.toString('base64').length}) exceeds the allowable ${this.$maxLen} chars`));

      this.notify('$encodeCompleted', encoded.toString('base64'));
    });
  }

  decode(base64Str) {
    if (!base64Str)
      return this.error(new Error(`Compress.decode: no data is specified`));

    var buf = new Buffer(base64Str, 'base64');
    ZLIB.inflate(buf, (err, decoded) => {
      if (err) {
        err.message = `Compress.decode: ${err.message}`;
        return this.error(err);
      }

      this.notify('$decodeCompleted', JSON.parse(decoded.toString()));
    });
  }
}

module.exports.Compress = Compress;
