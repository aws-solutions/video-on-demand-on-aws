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
    name: '_Ott_1080p_Avc_16x9_qvbr_no_preset',
    file: './templates/1080p_avc_16x9_qvbr_no_preset.json'
  },
  {
    name: '_Ott_720p_Avc_Aac_16x9_qvbr_no_preset',
    file: './templates/720p_avc_aac_16x9_qvbr_no_preset.json'
  },
  {
    name: '_Ott_720p_Avc_16x9_qvbr_no_preset',
    file: './templates/720p_avc_16x9_qvbr_no_preset.json'
  }
];

const createTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    // Load template and set unique template name
    let params = JSON.parse(fs.readFileSync(path.join(__dirname, tmpl.file), 'utf8'));
    params.Name = stackName + params.Name;

    await instance.createJobTemplate(params).promise();
    console.log(`template created:: ${params.Name}`);
  }
};

const Create = async (config) => {
  // extract region from the endpoint
  const region = config.EndPoint.match(/\.mediaconvert\.(.*)\.amazonaws\.com/)[1]
  const mediaconvert = new AWS.MediaConvert({
    endpoint: config.EndPoint,
    region: region
  });

  await createTemplates(mediaconvert, qvbrTemplatesNoPreset, config.StackName);

  return 'success';
};

const _deleteTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    let name = stackName + tmpl.name;

    await instance.deleteJobTemplate({Name: name}).promise();
    console.log(`template deleted:: ${name}`);
  }
};

const Delete = async (config) => {
  // extract region from the endpoint
  const region = config.EndPoint.match(/\.mediaconvert\.(.*)\.amazonaws\.com/)[1]
  const mediaconvert = new AWS.MediaConvert({
    endpoint: config.EndPoint,
    region: region
  });

  try {
    await _deleteTemplates(mediaconvert, qvbrTemplatesNoPreset, config.StackName);
  } catch (err) {
    console.log(err);
    throw err;
  }

  return 'success';
};

module.exports = {
  createTemplates : Create,
  deleteTemplates: Delete
}

/**
 * will be called by a local-exec/null_resource provider
 * instead of being deployed as a custom resource lambda when using CloudFormation
 */
if (process.argv.length === 5) {

  const EndPoint = process.argv[2]
  const Mode = process.argv[3]
  const StackName = process.argv[4]

  switch (Mode) {
    case 'Create':
      Create({EndPoint: EndPoint, StackName: StackName}).then(
        data => console.log("Create success", data)
      ).catch(
        error => console.error("Create error", error)
      );
      return;
    case 'Delete':
      Delete({EndPoint: EndPoint, StackName: StackName}).then(
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
}
