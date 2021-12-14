const lambda = require('../index');

describe('purges', () => {

  process.env.AWS_REGION = 'eu-west-1';
  process.env.DynamoDBTable = 'buzzhub';
  process.env.DestinationRestricted = 'buzzhub-transcoded-videos-053041861227-eu-west-1';
  process.env.Destination = 'buzzhub-transcoded-restricted-videos-053041861227-eu-west-1';

  it('invokes', async () => {
    const response = await lambda.handler({
      "guid": "SY2ZWAF8J9en",
      "startTime": "2021-12-10T17:37:34.720Z",
      "workflowTrigger": "Video",
      "workflowStatus": "Ingest",
      "workflowName": "buzzhub",
      "frameCapture": true,
      "archiveSource": "DEEP_ARCHIVE",
      "jobTemplate_1080p": "buzzhub_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset",
      "jobTemplate_1080p_no_audio": "buzzhub_Ott_1080p_Avc_16x9_qvbr_no_preset",
      "jobTemplate_720p": "buzzhub_Ott_720p_Avc_Aac_16x9_qvbr_no_preset",
      "jobTemplate_720p_no_audio": "buzzhub_Ott_720p_Avc_16x9_qvbr_no_preset",
      "inputRotate": "DEGREE_0",
      "acceleratedTranscoding": "PREFERRED",
      "enableSns": true,
      "enableSqs": true,
      "doPurge": true,
      "cmsId": "SY2ZWAF8J9en",
      "cmsCommandId": "SY2ZWAF8J9en",
      "srcBucket": "buzzhub-master-videos-053041861227-eu-west-1",
      "srcVideo": "2021/12/SY2ZWAF8J9en/clinton-kaempft-mit-den-traenen.mp4"
    });

    console.log('response', response);
  })
})