/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const axios = require('axios');

let sendResponse = async (event, context, responseStatus, responseData) => {
    let data;

    const responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
        PhysicalResourceId: event.LogicalResourceId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    const params = {
        url: event.ResponseURL,
        port: 443,
        method: 'put',
        headers: {
            'content-type': '',
            'content-length': responseBody.length
        },
        data: responseBody
    };

    data = await axios(params);

    return data.status;
};

module.exports = {
    send: sendResponse
};
