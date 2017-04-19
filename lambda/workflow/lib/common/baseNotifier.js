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

const EMR = require('events');
const DUMP = require('util').inspect;

//
// base notify class mixins with node's event emitter
//
var BaseNotifier = Base => class extends Base {

  notify(name, data, timeout) {
    var seconds = timeout || 0;
    var bindNotify = this.emit.bind(this, name, data);
    return setTimeout(() => { bindNotify(); }, seconds * 1000);
  }

  error(err) {
    //console.error(`error: ${err.message}`);
    return this.notify('error', err);
  }

};

module.exports.BaseNotifier = BaseNotifier(EMR);
