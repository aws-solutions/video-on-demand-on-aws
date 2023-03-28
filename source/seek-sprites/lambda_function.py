import datetime
import io
import json
import os
from typing import Dict
from urllib.parse import urlparse

import boto3
import numpy as np
from PIL import Image

IS_LAMBDA = os.environ.get('AWS_EXECUTION_ENV') is not None
MAX_IMAGE_WIDTH_HEIGHT = 108
S3_DST_KEY_SUFFIX = 'web_vtt'
OUTPUT_FORMAT = 'webp'

# 1 thumbnail every 5s
THUMBNAIL_EVERY_N_SECONDS = 5

# max 2min
MAX_FRAMES_PER_SPRITE = int(420 / 5)

s3 = boto3.client('s3')


def log(message: str, level: str, data: Dict[str, str] = {}) -> None:
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


def pil_grid(images: list[Image], max_horiz=np.iinfo(int).max):
    n_images = len(images)
    n_horiz = min(n_images, max_horiz)
    h_sizes = [0] * n_horiz
    v_sizes = [0] * ((n_images // n_horiz) + (1 if n_images % n_horiz > 0 else 0))
    images = list(map(lambda x: x(), images))
    for i, im in enumerate(images):
        im.thumbnail((MAX_IMAGE_WIDTH_HEIGHT, MAX_IMAGE_WIDTH_HEIGHT), resample=Image.LANCZOS)
        h, v = i % n_horiz, i // n_horiz
        h_sizes[h] = max(h_sizes[h], im.size[0])
        v_sizes[v] = max(v_sizes[v], im.size[1])
    h_sizes, v_sizes = np.cumsum([0] + h_sizes), np.cumsum([0] + v_sizes)
    im_grid = Image.new('RGB', (h_sizes[-1], v_sizes[-1]), color='white')
    for i, im in enumerate(images):
        im_grid.paste(im, (h_sizes[i % n_horiz], v_sizes[i // n_horiz]))
    return im_grid, im.size


def web_vtt(images: list[list[Image]], size: (int, int)) -> str:
    vtt = 'WEBVTT\n\n'
    for row, chunk in enumerate(images):
        offset = row * MAX_FRAMES_PER_SPRITE * THUMBNAIL_EVERY_N_SECONDS
        for i, im in enumerate(chunk):
            start = str(datetime.timedelta(seconds=max(0, offset + i * THUMBNAIL_EVERY_N_SECONDS)))
            end = str(datetime.timedelta(seconds=max(0, offset + (i + 1) * THUMBNAIL_EVERY_N_SECONDS)))
            vtt = vtt + f'0{start}.000 --> 0{end}.000\n'
            vtt = vtt + f'sprite-{row}.{OUTPUT_FORMAT}#xywh={size[0] * i},0,{size[0]},{size[1]}'
            vtt = vtt + '\n\n'
    return vtt


def put_objects(bucket: str, key: str, vtt: str, images: list[Image], event: Dict[str, str] = {}) -> None:
    log(f'put_objects[{len(images)}]: {bucket}/{key}', 'info', event)
    if IS_LAMBDA:
        s3.put_object(Bucket=bucket, Key=f'{key}{S3_DST_KEY_SUFFIX}/{OUTPUT_FORMAT}.vtt', Body=vtt,
                      ContentType='text/vtt')
    else:
        os.makedirs('./tmp', exist_ok=True)
        with open(f'./tmp/{OUTPUT_FORMAT}.vtt', 'w') as f:
            f.write(vtt)
            f.close()
    for i, image in enumerate(images):
        if IS_LAMBDA:
            image_buffer = io.BytesIO()
            image.save(image_buffer, format=f'{OUTPUT_FORMAT}')  # You can use other formats like 'JPEG', 'GIF' etc.
            image_buffer.seek(0)  # Reset the buffer position to the beginning
            s3.put_object(Bucket=bucket, Key=f'{key}{S3_DST_KEY_SUFFIX}/sprite-{i}.{OUTPUT_FORMAT}', Body=image_buffer,
                          ContentType=f'image/{OUTPUT_FORMAT}')
        else:
            image.save(f'./tmp/sprite-{i}.{OUTPUT_FORMAT}', format=f'{OUTPUT_FORMAT}')
            image.show()


def fetch_img(bucket, x):
    return lambda: Image.open(s3.get_object(Bucket=bucket, Key=x)['Body'])


def lambda_handler(event, context):
    try:
        log('REQUEST', 'info', event)
        thumbnails = event['thumbNails'][0]

        url = urlparse(thumbnails)
        root_dir = os.path.dirname(url.path)
        root_dir = root_dir[1:] if root_dir.startswith('/') else root_dir

        thumbnail_keys = s3.list_objects_v2(Bucket=url.netloc, Prefix=root_dir)['Contents']
        thumbnail_keys = list(map(lambda x: x['Key'], thumbnail_keys))

        src_images = list(map(lambda x: fetch_img(url.netloc, x), thumbnail_keys))
        src_chunks = [src_images[i:i + MAX_FRAMES_PER_SPRITE] for i in range(0, len(src_images), MAX_FRAMES_PER_SPRITE)]
        sprite_chunks = []
        for chunk in src_chunks:
            sprite, size = pil_grid(chunk)
            sprite_chunks.append(sprite)
        vtt = web_vtt(src_chunks, size)
        put_objects(url.netloc, root_dir.replace('thumbnails', ''), vtt, sprite_chunks, event)
        return event
    except Exception as err:
        log(str(err), 'error', event)
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


if __name__ == '__main__':
    lambda_handler({
        'thumbNails': [
            's3://buzzhub-transcoded-videos-053041861227-eu-west-1/2023/03/1ue2hnT61T4A/thumbnails/video_thumb.0000012.jpg'
        ],
        'guid': '1ue2hnT61T4A'
    }, {})
#
# if __name__ == '__main__':
#     lambda_handler({
#         'guid': 'e129c065-d408-4ab4-8dd2-f4730e021da0__rerun_1',
#         'startTime': '2022-02-15T10:24:58.411Z',
#         'workflowTrigger': 'Video',
#         'workflowStatus': 'Ingest',
#         'workflowName': 'buzzhub',
#         'archiveSource': 'DEEP_ARCHIVE',
#         'jobTemplate_1080p': 'buzzhub_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset',
#         'jobTemplate_1080p_no_audio': 'buzzhub_Ott_1080p_Avc_16x9_qvbr_no_preset',
#         'jobTemplate_720p': 'buzzhub_Ott_720p_Avc_Aac_16x9_qvbr_no_preset',
#         'jobTemplate_720p_no_audio': 'buzzhub_Ott_720p_Avc_16x9_qvbr_no_preset',
#         'inputRotate': 'DEGREE_0',
#         'acceleratedTranscoding': 'PREFERRED',
#         'geoRestriction': 'world-wide',
#         'cmsId': 'juUBYHbHK1Va',
#         'cmsCommandId': 'e129c065-d408-4ab4-8dd2-f4730e021da0',
#         'ttl': 253402290720,
#         'srcBucket': 'buzzhub-master-videos-053041861227-eu-west-1',
#         'srcVideo': '2021/11/juUBYHbHK1Va/reiner-calmund-ist-kaum-wiederzuerkennen.mp4'
#     }, None)
