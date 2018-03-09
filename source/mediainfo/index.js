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
 **/
'use strict';
const AWS = require('aws-sdk');
const MediaInfo = require('./lib/mediaInfoCommand').MediaInfoCommand;
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const s3 = new AWS.S3();

    let params = {
            Bucket: event.srcBucket,
            Key: event.srcVideo,
            Expires: 300
        };

    let url = s3.getSignedUrl('getObject', params);
    let mediaInfo = new MediaInfo(url);

    mediaInfo.once('$runCompleted', (output) => {
        console.log(JSON.stringify(output, null, 2));
        let srcMediainfo = {
          container:output.$container,
          video: output.$videoES,
          audio:output.$audioES,
          text:output.$textES
        };
        event.srcMediainfo = JSON.stringify(srcMediainfo, null, 2)
        callback(null, event);
    });

    mediaInfo.on('error', (err) => {
        error.handler(event.guid, err);
        callback(err);
    });

    mediaInfo.run();
};
