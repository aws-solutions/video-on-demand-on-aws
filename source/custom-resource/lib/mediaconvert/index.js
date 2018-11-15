const fs = require('fs');
const AWS = require('aws-sdk');

// Get the Account regional MediaConvert endpoint for making API calls
let endpoint = async (config) => {
  const mediaconvert = new AWS.MediaConvert();
  let responseData;
  try {
    let data = await mediaconvert.describeEndpoints().promise();
    responseData = {
      EndpointUrl: data.Endpoints[0].Url
    };
  } catch (err) {
    throw err;
  }
  return responseData;
};



let templates = async (config) => {
  const mediaconvert = new AWS.MediaConvert({
    endpoint: config.EndPoint,
    region: process.env.AWS_REGION
  });
  const templates = [
    './lib/mediaconvert/templates/2160p_avc_aac_16x9.json',
    './lib/mediaconvert/templates/1080p_avc_aac_16x9.json',
    './lib/mediaconvert/templates/720p_avc_aac_16x9.json'
  ];

  try {
    //Feature/so-vod-139 switching to promise.all from asyncForEach to
    //insure each createJobTemplate returns before completing the loop.
    await Promise.all(templates.map(async tmpl => {
      let params = JSON.parse(fs.readFileSync(tmpl, 'utf8'));
      params.Name = config.StackName + params.Name;
      let data = await mediaconvert.createJobTemplate(params).promise();
      console.log('template created:: ', data.JobTemplate.Name);
    }));


  } catch (err) {
    throw err;
  }
  return 'success';
};

module.exports = {
  getEndpoint: endpoint,
  createTemplates: templates
};
