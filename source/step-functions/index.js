/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

const { SFN: StepFunctions } = require('@aws-sdk/client-sfn');
const { v4: uuidv4 } = require('uuid');
const error = require('./lib/error.js');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const stepfunctions = new StepFunctions({
        region: process.env.AWS_REGION,
        customUserAgent: process.env.SOLUTION_IDENTIFIER,
    });

    let response;
    let params;

    try {
        switch (true) {
            case event.hasOwnProperty('Records'):
                // Ingest workflow triggered by s3 event::
                // event.guid = uuidv4();

                // Identify file extention of s3 object::
                let key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
                event.guid = key.replace(/\.[\w\.]+$/, '');
                if (key.slice(((key.lastIndexOf('.') - 1) >>> 0) + 2) === 'json') {
                    event.workflowTrigger = 'Metadata';
                } else {
                    event.workflowTrigger = 'Video';
                }
                params = {
                    stateMachineArn: process.env.IngestWorkflow,
                    input: JSON.stringify(event),
                    name: event.guid,
                };
                response = 'success';
                break;

            case event.hasOwnProperty('guid'):
                // Process Workflow trigger
                params = {
                    stateMachineArn: process.env.ProcessWorkflow,
                    input: JSON.stringify({
                        guid: event.guid,
                    }),
                    name: event.guid,
                };
                response = 'success';
                break;

            case event.hasOwnProperty('detail'):
                // Publish workflow triggered by MediaConver CloudWatch event::
                params = {
                    stateMachineArn: process.env.PublishWorkflow,
                    input: JSON.stringify(event),
                    name: event.detail.userMetadata.guid,
                };
                response = 'success';
                break;

            default:
                throw new Error('invalid event object');
        }

        let data = await stepfunctions.startExecution(params);
        console.log(`STATEMACHINE EXECUTE:: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    return response;
};
