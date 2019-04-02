/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
const uuid = require('uuid');
const cfn = require('./lib/cfn');
const Metrics = require('./lib/metrics');
const S3 = require('./lib/s3');
const MediaConvert = require('./lib/mediaconvert');

exports.handler = async (event, context) => {

    console.log('REQUEST:: ', JSON.stringify(event, null, 2));
    let config = event.ResourceProperties;
    let responseData = {},
        Id;

    //Each resource returns a promise with a json object to return cloudformation.
    try {

        console.log('RESOURCE:: ', config.Resource);

        if (event.RequestType === 'Create') {
            switch (config.Resource) {

                case 'S3Notification':
                    await S3.putNotification(config);
                    break;

                case 'EndPoint':
                    responseData = await MediaConvert.getEndpoint(config);
                    break;

                case 'MediaConvertTemplates':
                    await MediaConvert.createTemplates(config);
                    break;

                case ('UUID'):
                    responseData = {
                        UUID: uuid.v4()
                    };
                    break;

                case ('AnonymousMetric'):
                    await Metrics.send(config);
                    break;

                default:
                    console.log(config.Resource, ': not defined as a custom resource, sending success response');
            }
        }
        if (event.RequestType === 'Update') {
            switch (config.Resource) {

                case 'EndPoint':
                    responseData = await MediaConvert.getEndpoint(config);
                    break;

                case 'MediaConvertTemplates':
                    await MediaConvert.updateTemplates(config);
                    break;

                default:
                    console.log(config.Resource, ': update not supported, sending success response');
            }
        }
        if (event.RequestType === 'Delete') {

            //Feature/so-vod-173 limit on the numberof custom presets per region,
            //deleting on a stack delte
            if (config.Resource === 'MediaConvertTemplates') {
                await MediaConvert.deleteTemplates(config);
            } else {
                console.log(event.LogicalResourceId, ': delte not required, sending success response');
            }
        }

        let response = await cfn.send(event, context, 'SUCCESS', responseData, Id);
        console.log('RESPONSE:: ', responseData);
        console.log('CFN STATUS:: ', response);
    } catch (err) {
        console.log('ERROR:: ', err, err.stack);
        cfn.send(event, context, 'FAILED');
    }
};
