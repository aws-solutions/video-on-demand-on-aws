const CmafMss = {
    detail: {
        queue: 'arn:aws:mediaconvert:us-east-1::queues/Default',
        jobId: '-htprrb',
        userMetadata: {
            workflow: 'voodoo',
            guid: '9ccbbd94-e39c-4d9b-8f89-85fa1fc81fb4'
        },
        outputGroupDetails: [
            {
                playlistFilePaths: [
                    's3://voodoo-destination-1w8dqfz7w8cq3/12345/cmaf/big_bunny.mpd',
                    's3://voodoo-destination-1w8dqfz7w8cq3/12345/cmaf/big_bunny.m3u8'
                ],
                type: 'CMAF_GROUP'
            },
            {
                outputDetails: [{
                    outputFilePaths: [
                        's3://voodoo-destination-1w8dqfz7w8cq3/12345/mss/big_bunny.ismv'
                    ]
                }],
                playlistFilePaths: [
                    's3://voodoo-destination-1w8dqfz7w8cq3/12345/mss/big_bunny.ism'
                ],
                type: 'MS_SMOOTH_GROUP'
            }
        ]
    }
};

const HlsDash = {
    detail: {
        queue: 'arn:aws:mediaconvert:us-east-1::queues/Default',
        jobId: '-htprrb',
        status: 'COMPLETE',
        userMetadata: {
            guid: '12345',
            workflow: 'vod4'
        },
        outputGroupDetails: [
            {
                playlistFilePaths: [
                    's3://vod4-destination-fr0ao9hz7tbo/12345/hls/dude.m3u8'
                ],
                type: 'HLS_GROUP'
            },
            {
                playlistFilePaths: [
                    's3://vod4-destination-fr0ao9hz7tbo/12345/dash/dude.mpd'
                ],
                type: 'DASH_ISO_GROUP'
            }
        ]
    }
};

const Mp4 = {
    version: '0',
    id: '371bc689-58cf-71f2-07f7-012b4fa59b79',
    'detail-type': 'MediaConvert Job State Change',
    source: 'aws.mediaconvert',
    account: '111',
    time: '2018-10-17T14:46:06Z',
    region: 'us-east-1',
    resources: [
        'arn:aws:mediaconvert:us-east-1::jobs-htprrb'
    ],
    detail: {
        queue: 'arn:aws:mediaconvert:us-east-1::queues/Default',
        jobId: '-htprrb',
        status: 'COMPLETE',
        userMetadata: {
            guid: '12345',
            workflow: 'vod4'
        },
        outputGroupDetails: [
            {
                outputDetails: [
                    {
                        outputFilePaths: [
                            's3://vod4-destination-fr0ao9hz7tbo/12345/mp4/dude_3.0Mbps.mp4'
                        ],
                        durationInMs: 13471,
                        videoDetails: {
                            widthInPx: 1280,
                            heightInPx: 720
                        }
                    }
                ],
                type: 'FILE_GROUP'
            }
        ]
    }
};

const NotRoot = {
    version: '0',
    id: '371bc689-58cf-71f2-07f7-012b4fa59b79',
    'detail-type': 'MediaConvert Job State Change',
    source: 'aws.mediaconvert',
    account: '111',
    time: '2018-10-17T14:46:06Z',
    region: 'us-east-1',
    resources: [
        'arn:aws:mediaconvert:us-east-1::jobs-htprrb'
    ],
    detail: {
        queue: 'arn:aws:mediaconvert:us-east-1::queues/Default',
        jobId: '-htprrb',
        status: 'COMPLETE',
        userMetadata: {
            guid: '12345',
            workflow: 'vod4'
        },
        outputGroupDetails: [
            {
                outputDetails: [
                    {
                        outputFilePaths: [
                            's3://vod4-destination-fr0ao9hz7tbo/folder1/folder2/12345/mp4/dude_3.0Mbps.mp4'
                        ],
                        durationInMs: 13471,
                        videoDetails: {
                            widthInPx: 1280,
                            heightInPx: 720
                        }
                    }
                ],
                type: 'FILE_GROUP'
            }
        ]
    }
};

module.exports = {
    cmafMss: CmafMss,
    hlsDash: HlsDash,
    mp4: Mp4,
    notRoot: NotRoot
};
