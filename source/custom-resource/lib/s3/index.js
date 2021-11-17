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

const AWS = require('aws-sdk');

let PutNotification = async (config) => {
    const s3 = new AWS.S3({customUserAgent: process.env.SOLUTION_IDENTIFIER});

    let params;

    switch (config.WorkflowTrigger) {
        case 'VideoFile':
            params = {
                Bucket: config.Source,
                NotificationConfiguration: {
                    LambdaFunctionConfigurations: [
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mpg'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mp4'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.m4v'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mov'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.m2ts'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.wmv'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mxf'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mkv'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.m3u8'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.mpeg'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.webm'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.h264'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MPG'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MP4'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.M4V'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MOV'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.M2TS'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.WMV'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MXF'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MKV'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.M3U8'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.MPEG'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.WEBM'
                                    }]
                                }
                            }
                        },
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: config.IngestArn,
                            Filter: {
                                Key: {
                                    FilterRules: [{
                                        Name: 'suffix',
                                        Value: '.H264'
                                    }]
                                }
                            }
                        }
                    ]
                }
            };

            console.log(`Configuring S3 event for ${config.WorkflowTrigger}`);
            await s3.putBucketNotificationConfiguration(params).promise();
            break;

        case 'MetadataFile':
            params = {
                Bucket: config.Source,
                NotificationConfiguration: {
                    LambdaFunctionConfigurations: [{
                        Events: ['s3:ObjectCreated:*'],
                        LambdaFunctionArn: config.IngestArn,
                        Filter: {
                            Key: {
                                FilterRules: [{
                                    Name: 'suffix',
                                    Value: 'json'
                                }]
                            }
                        }
                    }]
                }
            };

            console.log(`Configuring S3 event for ${config.WorkflowTrigger}`);
            await s3.putBucketNotificationConfiguration(params).promise();
            break;

        default:
            throw new Error(`Unknown WorkflowTrigger: ${config.WorkflowTrigger}`);
    }

    return 'success';
};

module.exports = {
    putNotification: PutNotification
};
