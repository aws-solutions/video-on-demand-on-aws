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

const expect = require('chai').expect;
const path = require('path');
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = require('../index.js');

describe('#OUTPUT VALIDATE::', () => {
    const _events = require('./test-events.js');
    const _error = {
        detail: {
            jobId: '43d7kt',
            status: 'COMPLETE',
            userMetadata: {
                workflow: 'voodoo',
                guid: '9ccbbd94-e39c-4d9b-8f89-85fa1fc81fb4'
            },
            outputGroupDetails: []
        }
    };

    const data = {
        Item: {
            guid: '1234',
            cloudFront: 'cloudfront',
            destBucket: 'vod-destination',
            frameCapture: false
        }
    };

    const img_data = {
        Item: {
            guid: '1234',
            cloudFront: 'cloudfront',
            destBucket: 'vod-destination',
            frameCapture: true
        }
    };

    const imgList = {
        Contents: [
            {
                Key: "12345/thumbnails/dude3.000.jpg",
         
                }
        ]   
    }

    process.env.ErrorHandler = 'error_handler';

    const dynamoDBDocumentClientMock = mockClient(DynamoDBDocumentClient);
    const lambdaClientMock = mockClient(LambdaClient);
    afterEach(() => dynamoDBDocumentClientMock.reset());

    it('should return "SUCCESS" on parsing CMAF MSS output', async () => {
        dynamoDBDocumentClientMock.on(GetCommand).resolves(data);

        const response = await lambda.handler(_events.cmafMss);
        expect(response.mssPlaylist).to.equal('s3://vod-destination/12345/mss/big_bunny.ism');
        expect(response.mssUrl).to.equal('https://cloudfront/12345/mss/big_bunny.ism');
        expect(response.cmafDashPlaylist).to.equal('s3://vod-destination/12345/cmaf/big_bunny.mpd');
        expect(response.cmafDashUrl).to.equal('https://cloudfront/12345/cmaf/big_bunny.mpd');
    });

    it('should return "SUCCESS" on parsing HLS DASH output', async () => {
        dynamoDBDocumentClientMock.on(GetCommand).resolves(data);

        const response = await lambda.handler(_events.hlsDash);
        expect(response.hlsPlaylist).to.equal('s3://vod-destination/12345/hls/dude.m3u8');
        expect(response.hlsUrl).to.equal('https://cloudfront/12345/hls/dude.m3u8');
        expect(response.dashPlaylist).to.equal('s3://vod-destination/12345/dash/dude.mpd');
        expect(response.dashUrl).to.equal('https://cloudfront/12345/dash/dude.mpd');
    });

    it('should return "SUCCESS" on parsing MP4 output', async () => {
        dynamoDBDocumentClientMock.on(GetCommand).resolves(data);

        const response = await lambda.handler(_events.mp4);
        expect(response.mp4Outputs[0]).to.equal('s3://vod-destination/12345/mp4/dude_3.0Mbps.mp4');
        expect(response.mp4Urls[0]).to.equal('https://cloudfront/12345/mp4/dude_3.0Mbps.mp4');
    });

    it('should return "DB ERROR" when db get fails', async () => {
        dynamoDBDocumentClientMock.on(GetCommand).resolves(data);
        lambdaClientMock.on(InvokeCommand).resolves();

        await lambda.handler(_events.cmafMss).catch(err => {
            expect(err).to.equal('DB ERROR');
        });
    });

    it('should return "ERROR" when output parse fails', async () => {
        dynamoDBDocumentClientMock.on(GetCommand).resolves(data);

        await lambda.handler(_error).catch(err => {
            expect(err.toString()).to.equal('Could not parse MediaConvert Output');
        });
    });
});

