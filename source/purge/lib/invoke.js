const lambda = require('../index');

describe('purges', () => {

  process.env.AWS_REGION = 'eu-west-1';
  process.env.DynamoDBTable = 'buzzhub';
  process.env.DestinationRestricted = 'buzzhub-transcoded-videos-053041861227-eu-west-1';
  process.env.Destination = 'buzzhub-transcoded-restricted-videos-053041861227-eu-west-1';

  it('invokes', async () => {
    const response = await lambda.handler({
      workflowTrigger: 'Video',
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: {
            bucket: {
              name: 'buzzhub-master-videos-053041861227-eu-west-1'
            },
            object: {
              key: '2021/09/media-id/key.mp4'
            }
          }
        }
      ]
    });

    console.log('response', response);
  })
})