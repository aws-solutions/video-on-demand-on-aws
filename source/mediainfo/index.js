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
 const error = require('./lib/error.js');
 const { MediaInfo } = require('./lib/mediaInfo');

 exports.handler = async (event) => {
   console.log('REQUEST:: ', JSON.stringify(event, null, 2));

   try {

     const mediainfo = new MediaInfo();

     let params = {
       Bucket: event.srcBucket,
       Key: event.srcVideo
     };

     let metadata = await mediainfo.analyze(params);
     // filename in respose is the s3 signed url, replacing this with the actual filename
     metadata.filename = event.srcVideo;
     //update event to return
     event.srcMediainfo = JSON.stringify(metadata,null,2);
     console.log('RESPOSE:: ', event.srcMediainfo);

   }
   catch (err) {
     console.log(err);
     await error.handler(event, err);
     throw err
   }
   return event
 };
