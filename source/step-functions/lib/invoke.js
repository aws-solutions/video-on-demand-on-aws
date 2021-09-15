const lambda = require("../index")


describe('#INVOKE::', () => {
  process.env.AWS_REGION = 'eu-west-1';
  process.env.IngestWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-ingest';
  process.env.ProcessWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-process';
  process.env.PublishWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-publish';

  it("", async () => {
    const data = await lambda.handler({
      "Records": [
        {
          "eventVersion": "2.1",
          "eventSource": "aws:s3",
          "awsRegion": "eu-west-1",
          "eventTime": "2021-09-14T14:16:13.453Z",
          "eventName": "ObjectCreated:Copy",
          "userIdentity": {
            "principalId": "AWS:AROAQYWMKSJVWY7QFQAZ2:peruggia-sub"
          },
          "requestParameters": {
            "sourceIPAddress": "54.154.128.7"
          },
          "responseElements": {
            "x-amz-request-id": "XQXRMDCN9GZ3NWN2",
            "x-amz-id-2": "ID5tZU5BEBMHEOqrGLsfS61TQuCJ4/uQM7yWWR/5nHia/wx3O2lqZ2pgQ/HjMgNXskQhyxkQOJqKvUIFChQJ7ztr3vTPq4Yr"
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "mp4",
            "bucket": {
              "name": "buzzhub-master-videos-053041861227-eu-west-1",
              "ownerIdentity": {
                "principalId": "A2JJZGPFKLPHQR"
              },
              "arn": "arn:aws:s3:::buzzhub-master-videos-053041861227-eu-west-1"
            },
            "object": {
              "key": "2021/09/HkpKWVxdF-k3/sozialdemokraten-gewinnen-norwegische-parlamentswahl.mp4",
              "size": 62967683,
              "eTag": "c5600de05af79ad4172a1c76f0b4542f",
              "sequencer": "006140AEA2365517B3"
            }
          }
        }
      ]
    });

    console.log(data);
  });
});