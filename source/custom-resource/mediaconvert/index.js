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

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// updated templates for v5.2.0 that don't use presets
const qvbrTemplatesNoPreset = [
  {
    name: '_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset',
    file: './templates/1080p_avc_aac_16x9_qvbr_no_preset.json'
  },
  {
    name: '_Ott_720p_Avc_Aac_16x9_qvbr_no_preset',
    file: './templates/720p_avc_aac_16x9_qvbr_no_preset.json'
  }
];

const mediaPackageTemplatesNoPreset = [
  {
    name: '_Ott_1080p_Avc_Aac_16x9_mvod_no_preset',
    file: './templates/1080p_avc_aac_16x9_mvod_no_preset.json'
  },
  {
    name: '_Ott_720p_Avc_Aac_16x9_mvod_no_preset',
    file: './templates/720p_avc_aac_16x9_mvod_no_preset.json'
  }
];

const _createTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    // Load template and set unique template name
    let params = JSON.parse(fs.readFileSync(path.join(__dirname, tmpl.file), 'utf8'));
    params.Name = stackName + params.Name;

    await instance.createJobTemplate(params).promise();
    console.log(`template created:: ${params.Name}`);
  }
};

const Create = async (EndPoint, StackName) => {
  // extract region from the endpoint
  const region = EndPoint.match(/\.mediaconvert\.(.*)\.amazonaws\.com/)[1]
  const mediaconvert = new AWS.MediaConvert({
    endpoint: EndPoint,
    region: region
  });

  await _createTemplates(mediaconvert, mediaPackageTemplatesNoPreset, StackName);
  await _createTemplates(mediaconvert, qvbrTemplatesNoPreset, StackName);

  return 'success';
};

const _deleteTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    let name = stackName + tmpl.name;

    await instance.deleteJobTemplate({Name: name}).promise();
    console.log(`template deleted:: ${name}`);
  }
};

const Delete = async (EndPoint, StackName) => {
  // extract region from the endpoint
  const region = EndPoint.match(/\.mediaconvert\.(.*)\.amazonaws\.com/)[1]
  const mediaconvert = new AWS.MediaConvert({
    endpoint: EndPoint,
    region: process.env.AWS_REGION
  });

  try {
    await _deleteTemplates(mediaconvert, mediaPackageTemplatesNoPreset, StackName);
    await _deleteTemplates(mediaconvert, qvbrTemplatesNoPreset, StackName);
  } catch (err) {
    console.log(err);
    throw err;
  }

  return 'success';
};


if (process.argv.length === 5) {

  const EndPoint = process.argv[2]
  const Mode = process.argv[3]
  const StackName = process.argv[4]

  switch (Mode) {
    case 'Create':
      Create(EndPoint, StackName).then(
        data => console.log("Create success", data)
      ).catch(
        error => console.error("Create error", error)
      );
      return;
    case 'Delete':
      Delete(EndPoint, StackName).then(
        data => console.log("Delete success", data)
      ).catch(
        error => console.error("Delete error", error)
      );
      return;
    default:
      console.error(`Unrecognized Mode '${Mode}'. Valid values are Update|Delete`);
      process.exit(3);
  }
} else {
  console.error("Required parameters are missing. Usage:")
  console.error(`${process.argv[0]} ${process.argv[1]} EndPoint Update|Delete StackName`)
  process.exit(1)
}
