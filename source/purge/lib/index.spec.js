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

const chai = require('chai');
const spies = require('chai-spies');
const assertArrays = require('chai-arrays');
chai.use(assertArrays).use(spies);

const expect = chai.expect;
const spy = chai.spy;

const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('../index.js');

describe('#PURGE::', () => {

  process.env.AWS_REGION = 'us-west-1';
  process.env.DynamoDBTable = 'ddb-table';
  process.env.DestinationRestricted = 'restricted-video-bucket';
  process.env.Destination = 'video-bucket';

  const MediaId = 'med1A-id';
  const _json = {srcVideo: `2021/06/${MediaId}/file.ext`};

  afterEach(() => AWS.restore('DynamoDB.DocumentClient'));
  afterEach(() => AWS.restore('S3'));

  it("should delete items from s3", async () => {

    const doList = (params, callback) => {
      callback(null, {Contents: [{Key: 'foo/bar/baz.ext'}]});
    }
    const s3ListSpy = spy(doList);

    const doDelete = (params, callback) => {
      callback(null, {});
    }
    const s3DeleteSpy = spy(doDelete);

    AWS.mock('S3', 'listObjectsV2', s3ListSpy);
    AWS.mock('S3', 'deleteObject', s3DeleteSpy);
    AWS.mock('DynamoDB.DocumentClient', 'delete', Promise.resolve({}));

    await lambda.handler(_json);
    expect(s3ListSpy).to.have.been.first.called.with({
        Bucket: process.env.DestinationRestricted,
        Prefix: `2021/06/${MediaId}/`
      }
    );
    expect(s3ListSpy).on.nth(2).be.called.with({
      Bucket: process.env.Destination,
      Prefix: `2021/06/${MediaId}/`
    });


    expect(s3DeleteSpy).to.have.been.called.with({
      Bucket: process.env.Destination,
      Key: 'foo/bar/baz.ext'
    });

    expect(s3DeleteSpy).to.have.been.called.with({
      Bucket: process.env.DestinationRestricted,
      Key: 'foo/bar/baz.ext'
    });
  });

  it("should delete items from ddb", async () => {

    const doDelete = (params, callback) => {
      callback(null, {});
    }
    const ddbDeelte = spy(doDelete);

    AWS.mock('S3', 'listObjectsV2', Promise.resolve({Contents: []}));
    AWS.mock('DynamoDB.DocumentClient', 'delete', ddbDeelte);

    await lambda.handler(_json);

    expect(ddbDeelte).to.have.been.called.with({
      TableName: process.env.DynamoDBTable,
      Key: {
        guid: MediaId
      }
    });
  });
});

