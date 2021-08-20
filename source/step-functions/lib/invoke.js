const lambda = require("../index")


describe('#INVOKE::', () => {
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
          "eventTime": "2021-08-20T08:06:45.083Z",
          "eventName": "ObjectCreated:Copy",
          "userIdentity": {
            "principalId": "AWS:AROAQYWMKSJVWY7QFQAZ2:peruggia-sub"
          },
          "requestParameters": {
            "sourceIPAddress": "34.244.149.253"
          },
          "responseElements": {
            "x-amz-request-id": "CQYG45TSWCZ2E1ZW",
            "x-amz-id-2": "0a3jXCLYmfnQ3ZJz/EbXaBUcy6WNsCObT7N3ZFWB0ZJZ2ThN3JWWCCntHInvUdJ3q6PrCa7O4FfnojJUnF/EEQZtwjxzYA7i"
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
              "key": "2021/08/5DErjF6Lm1se/bunny-tastic.mp4",
              "size": 9983542,
              "eTag": "188ef8474c4ec85dfe38d5abf304183e",
              "sequencer": "00611F6295D946FD73"
            }
          }
        }
      ]
    });

    console.log(data);
  });
});