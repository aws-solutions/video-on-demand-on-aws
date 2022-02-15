######################################################################################################################
#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the 'License'). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
import datetime
import json
import os
import subprocess
from typing import Dict

import boto3
from botocore.config import Config


def parse_number(num):
    if num is None:
        return None

    try:
        return int(num)
    except ValueError:
        return float(num)


def compact(attributes):
    return {k: v for k, v in attributes.items() if v is not None}


def parse_common_attributes(track):
    attributes = {}

    attributes['codec'] = track.get('Format')

    level = track.get('Format_Level')
    profile_values = [
        track.get('Format_Profile'),
        None if level is None else 'L' + level,
        track.get('Format_Tier')
    ]

    profile = '@'.join([i for i in profile_values if i is not None])
    if profile != '':
        attributes['profile'] = profile

    attributes['bitrate'] = parse_number(track.get('BitRate'))
    attributes['duration'] = parse_number(track.get('Duration'))
    attributes['frameCount'] = parse_number(track.get('FrameCount'))

    return attributes


def parse_general_attributes(track):
    attributes = {}

    attributes['format'] = track.get('Format')
    attributes['fileSize'] = parse_number(track.get('FileSize'))
    attributes['duration'] = parse_number(track.get('Duration'))
    attributes['totalBitrate'] = parse_number(track.get('OverallBitRate'))

    return compact(attributes)


def parse_video_attributes(track):
    attributes = parse_common_attributes(track)

    attributes['width'] = parse_number(track.get('Width'))
    attributes['height'] = parse_number(track.get('Height'))
    attributes['framerate'] = parse_number(track.get('FrameRate'))
    attributes['scanType'] = track.get('ScanType')
    attributes['aspectRatio'] = track.get('DisplayAspectRatio')

    attributes['bitDepth'] = parse_number(track.get('BitDepth'))
    attributes['colorSpace'] = '{0} {1}'.format(track.get('ColorSpace'), track.get('ChromaSubsampling'))

    return compact(attributes)


def parse_audio_attributes(track):
    attributes = parse_common_attributes(track)

    attributes['bitrateMode'] = track.get('BitRate_Mode')
    attributes['language'] = track.get('Language')
    attributes['channels'] = parse_number(track.get('Channels'))
    attributes['samplingRate'] = parse_number(track.get('SamplingRate'))
    attributes['samplePerFrame'] = parse_number(track.get('SamplesPerFrame'))

    return compact(attributes)


def parse_text_attributes(track):
    attributes = {}

    attributes['id'] = track.get('ID')
    attributes['format'] = track.get('Format')
    attributes['duration'] = parse_number(track.get('Duration'))
    attributes['frameCount'] = parse_number(track.get('Count'))
    attributes['captionServiceName'] = parse_number(track.get('CaptionServiceName'))

    return compact(attributes)


def get_signed_url(bucket, obj):
    AWS_REGION = os.environ.get('AWS_REGION', 'eu-west-1')
    ## PR: https://github.com/awslabs/video-on-demand-on-aws/pull/111
    boto_config = Config(
        signature_version='s3v4',
        region_name=AWS_REGION,
    )
    s3_client = boto3.client('s3', config=boto_config)
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': obj},
        ExpiresIn=7200
    )


def log(message: str, level: str, data: Dict[str, str] = {}) -> None:
    # const userMetadata = (event.detail && event.detail.userMetadata) || {};
    user_metadata = data.get('detail', {}).get('userMetadata', {})

    print(json.dumps({
        '@version': '1',
        '@timestamp': datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc, microsecond=0).isoformat(),
        'mdc': {
            'cmsId': data.get('cmsId', user_metadata.get('cmsId', '')),
            'guid': data.get('guid', user_metadata.get('guid', '')),
            'geoRestriction': data.get('geoRestriction', ''),
            'cmsCommandId': data.get('cmsCommandId', user_metadata.get('cmsCommandId')),
            'ttl': data.get('ttl', ''),
            'doPurge': data.get('doPurge', ''),
            'Version': os.environ.get('AWS_LAMBDA_FUNCTION_VERSION', ''),
            'RequestId': os.environ.get('_X_AMZN_TRACE_ID', ''),
            'Function': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', ''),
        },
        'level': level,
        'message': message,
        'data': json.dumps(data)
    }))


def lambda_handler(event, context):
    log('REQUEST', 'info', event)

    try:
        metadata = {}
        metadata['filename'] = event['srcVideo']

        signed_url = get_signed_url(event['srcBucket'], event['srcVideo'])

        dir_path = os.path.dirname(os.path.realpath(__file__))
        executable_path = os.path.join(dir_path, 'bin', 'mediainfo')
        media_info = subprocess.run([executable_path, '--Output=JSON', signed_url], check=True, capture_output=True)

        # docker — uncomment for local testing
        # media_info = subprocess.run([f'docker run --rm shamelesscookie/mediainfo --Output=JSON "{signed_url}"'], capture_output=True, shell=True)
        # media_info.check_returncode()
        # print(f'stdout = >> {media_info.stdout.decode("utf-8")} <<')
        # print(f'stderr = >> {media_info.stderr.decode("utf-8")} <<')

        stderr = media_info.stderr.decode('utf-8')
        if stderr and stderr != '':
            raise Exception('mediainfo failed.\n' + stderr)

        json_content = json.loads(media_info.stdout)
        log('MEDIAINFO OUTPUT', 'info', json_content)

        tracks = json_content['media']['track']
        for track in tracks:
            track_type = track['@type']
            if track_type == 'General':
                metadata['container'] = parse_general_attributes(track)
            elif track_type == 'Video':
                metadata.setdefault('video', []).append(parse_video_attributes(track))
            elif track_type == 'Audio':
                metadata.setdefault('audio', []).append(parse_audio_attributes(track))
            elif track_type == 'Text':
                metadata.setdefault('text', []).append(parse_text_attributes(track))
            else:
                log(message=f'Unsupported track @type: {track_type}', level='error', data=track)

        event['srcMediainfo'] = json.dumps(metadata, indent=2)
        log('RESPONSE', 'info', metadata)

        return event
    except Exception as err:
        log(str(err), "error", event)
        payload = {
            'guid': event['guid'],
            'event': event,
            'function': os.environ.get('AWS_LAMBDA_FUNCTION_NAME'),
            'error': str(err)
        }

        lambda_cli = boto3.client('lambda')
        lambda_cli.invoke(
            FunctionName=os.environ.get('ErrorHandler'),
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        raise err

#
# if __name__ == '__main__':
#     lambda_handler({
#         "guid": "e129c065-d408-4ab4-8dd2-f4730e021da0__rerun_1",
#         "startTime": "2022-02-15T10:24:58.411Z",
#         "workflowTrigger": "Video",
#         "workflowStatus": "Ingest",
#         "workflowName": "buzzhub",
#         "archiveSource": "DEEP_ARCHIVE",
#         "jobTemplate_1080p": "buzzhub_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset",
#         "jobTemplate_1080p_no_audio": "buzzhub_Ott_1080p_Avc_16x9_qvbr_no_preset",
#         "jobTemplate_720p": "buzzhub_Ott_720p_Avc_Aac_16x9_qvbr_no_preset",
#         "jobTemplate_720p_no_audio": "buzzhub_Ott_720p_Avc_16x9_qvbr_no_preset",
#         "inputRotate": "DEGREE_0",
#         "acceleratedTranscoding": "PREFERRED",
#         "geoRestriction": "world-wide",
#         "cmsId": "juUBYHbHK1Va",
#         "cmsCommandId": "e129c065-d408-4ab4-8dd2-f4730e021da0",
#         "ttl": 253402290720,
#         "srcBucket": "buzzhub-master-videos-053041861227-eu-west-1",
#         "srcVideo": "2021/11/juUBYHbHK1Va/reiner-calmund-ist-kaum-wiederzuerkennen.mp4"
#     }, None)
