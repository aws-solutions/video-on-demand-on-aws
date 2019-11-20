/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
const crypto = require('crypto');

const DEFAULT_SEGMENT_LENGTH = 6;
const DEFAULT_PROGRAM_DATETIME_INTERVAL = 60;
const DEFAULT_MANIFEST_NAME = 'index';

const getHlsParameters = (groupId, randomId) => ({
    Id: `packaging-config-${randomId}-hls`,
    PackagingGroupId: groupId,
    HlsPackage: {
        HlsManifests: [{
            AdMarkers: 'SCTE35_ENHANCED',
            IncludeIframeOnlyStream: false,
            ManifestName: DEFAULT_MANIFEST_NAME,
            ProgramDateTimeIntervalSeconds: DEFAULT_PROGRAM_DATETIME_INTERVAL,
            RepeatExtXKey: false
        }],
        SegmentDurationSeconds: DEFAULT_SEGMENT_LENGTH,
        UseAudioRenditionGroup: true
    }
});

const getDashParameters = (groupId, randomId) => ({
    Id: `packaging-config-${randomId}-dash`,
    PackagingGroupId: groupId,
    DashPackage: {
        DashManifests: [{
            ManifestName: DEFAULT_MANIFEST_NAME,
            MinBufferTimeSeconds: DEFAULT_SEGMENT_LENGTH * 3,
            Profile: 'NONE'
        }],
        SegmentDurationSeconds: DEFAULT_SEGMENT_LENGTH
    }
});

const getMssParameters = (groupId, randomId) => ({
    Id: `packaging-config-${randomId}-mss`,
    PackagingGroupId: groupId,
    MssPackage: {
        MssManifests: [{
            ManifestName: DEFAULT_MANIFEST_NAME
        }],
        SegmentDurationSeconds: DEFAULT_SEGMENT_LENGTH
    }
});

const getCmafParameters = (groupId, randomId) => ({
    Id: `packaging-config-${randomId}-cmaf`,
    PackagingGroupId: groupId,
    CmafPackage: {
        HlsManifests: [{
            AdMarkers: 'SCTE35_ENHANCED',
            IncludeIframeOnlyStream: false,
            ManifestName: DEFAULT_MANIFEST_NAME,
            ProgramDateTimeIntervalSeconds: DEFAULT_PROGRAM_DATETIME_INTERVAL,
            RepeatExtXKey: false
        }],
        SegmentDurationSeconds: DEFAULT_SEGMENT_LENGTH,
    }
});

const create = async (properties) => {
    const mediaPackageVod = new AWS.MediaPackageVod();
    const randomId = crypto.randomBytes(8).toString('hex');

    const groupId = properties.GroupId;
    await mediaPackageVod.createPackagingGroup({ Id: groupId }).promise();

    let created = false;

    let configurations = Array.from(new Set(properties.PackagingConfigurations.split(',')));
    for (let config of configurations) {
        let params = {};

        switch (config.toLowerCase()) {
            case 'hls':
                params = getHlsParameters(groupId, randomId);
                break;

            case 'dash':
                params = getDashParameters(groupId, randomId);
                break;

            case 'mss':
                params = getMssParameters(groupId, randomId);
                break;

            case 'cmaf':
                params = getCmafParameters(groupId, randomId);
                break;

            default:
                console.log(`Unknown packaging configuration: ${config}`);
                params = null;
                break;
        }

        if (params) {
            console.log(`Creating configuration:: ${JSON.stringify(params, null, 2)}`);
            await mediaPackageVod.createPackagingConfiguration(params).promise();
            created = true;
        }
    }

    if (!created) {
        throw new Error('At least one valid packaging configuration must be informed.');
    }

    return {
        GroupId: groupId
    };
};

const purge = async (properties) => {
    const mediaPackageVod = new AWS.MediaPackageVod();
    const groupId = properties.GroupId;

    let token;

    do {
        const response = await mediaPackageVod.listAssets({
            PackagingGroupId: groupId,
            NextToken: token
        }).promise();

        for (let asset of response.Assets) {
            await mediaPackageVod.deleteAsset({ Id: asset.Id }).promise();
            console.log(`Deleted asset:: ${asset.Id}`);
        }

        token = response.NextToken;
    } while (token);

    do {
        const response = await mediaPackageVod.listPackagingConfigurations({
            PackagingGroupId: groupId,
            NextToken: token
        }).promise();

        for (let config of response.PackagingConfigurations) {
            await mediaPackageVod.deletePackagingConfiguration({ Id: config.Id }).promise();
            console.log(`Deleted configuration:: ${config.Id}`);
        }

        token = response.NextToken;
    } while (token);

    try {
        await mediaPackageVod.deletePackagingGroup({ Id: groupId }).promise();
        console.log(`Deleted group:: ${groupId}`);
    } catch (error) {
        if (error.code !== 'NotFoundException') {
            throw error;
        }
    }

    return {
        GroupId: groupId
    };
};

module.exports = {
    create,
    purge
};