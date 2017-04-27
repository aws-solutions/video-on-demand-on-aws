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

let moment = require('moment');
let https = require('https');

/**
 * Helper function to interact with dynamodb for data lake cfn custom resource.
 *
 * @class metricsHelper
 */
let metricsHelper = (function() {

    /**
     * @class metricsHelper
     * @constructor
     */
    let metricsHelper = function() {};

    /**
     * Sends opt-in, anonymous metric.
     * @param {json} metric - metric to send to opt-in, anonymous collection.
     * @param {sendAnonymousMetric~requestCallback} cb - The callback that handles the response.
     */
    metricsHelper.prototype.sendAnonymousMetric = function(metric, cb) {

        let _options = {
            hostname: 'metrics.awssolutionsbuilder.com',
            port: 443,
            path: '/generic',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let request = https.request(_options, function(response) {
            // data is streamed in chunks from the server
            // so we have to handle the "data" event
            let buffer;
            let data;
            let route;

            response.on('data', function(chunk) {
                buffer += chunk;
            });

            response.on('end', function(err) {
                data = buffer;
                cb(null, data);
            });
        });

        if (metric) {
            request.write(JSON.stringify(metric));
        }

        request.end();

        request.on('error', (e) => {
            console.error(e);
            cb(['Error occurred when sending metric request.', JSON.stringify(_payload)].join(' '), null);
        });
    };

    return metricsHelper;

})();

module.exports = metricsHelper;
