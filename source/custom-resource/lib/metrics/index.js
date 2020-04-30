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
const moment = require('moment');

const sanitizeData = (config) => {
    // Remove lambda arn from config to avoid sending AccountId
    delete config['ServiceToken'];
    delete config['Resource'];

    return config;
};

const send = async (config) => {
    let data;

    const metrics = {
        Solution: config.SolutionId,
        UUID: config.UUID,
        TimeStamp: moment().utc().toISOString(),
        Data: sanitizeData(config)
    };

    const params = {
        method: 'post',
        port: 443,
        url: 'https://metrics.awssolutionsbuilder.com/generic',
        headers: {
            'Content-Type': 'application/json'
        },
        data: metrics
    };

    data = await axios(params);

    return data.status;
};

module.exports = {
    send,
    sanitizeData
};
