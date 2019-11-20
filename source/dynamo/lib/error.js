/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

const AWS = require('aws-sdk');

let errHandler = async (event, _err) => {
    const lambda = new AWS.Lambda({
        region: process.env.AWS_REGION
    });

    try {
        let payload = {
            "guid": event.guid,
            "event": event,
            "function": process.env.AWS_LAMBDA_FUNCTION_NAME,
            "error": _err.toString()
        };

        let params = {
            FunctionName: process.env.ErrorHandler,
            Payload: JSON.stringify(payload, null, 2)
        };

        await lambda.invoke(params).promise();
    } catch (err) {
        console.log(err);
        throw err;
    }

    return 'success';
};

module.exports = {
    handler: errHandler
};
