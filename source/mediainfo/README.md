The version of MediaInfo used by this solution is v20.09. If you want to use a different version, you can compile the source code using these commands (taken from this [blog post](https://aws.amazon.com/blogs/compute/extracting-video-metadata-using-lambda-and-mediainfo/)) as a reference:

```console
sudo yum update -y
sudo yum groupinstall 'Development Tools' -y
sudo yum install libcurl-devel -y
wget https://mediaarea.net/download/binary/mediainfo/19.09/MediaInfo_CLI_20.09_GNU_FromSource.tar.xz
tar xvf MediaInfo_CLI_20.09_GNU_FromSource.tar.xz
cd MediaInfo_CLI_GNU_FromSource/
./CLI_Compile.sh --with-libcurl
```

Run these commands to confirm the compilation was successful:

```console
cd MediaInfo/Project/GNU/CLI/
./mediainfo --version
```

***

With the update of MediaInfo (from v0.7.92.1 to v20.09), you might run into some issues if you depend on the metadata report format. Here's an example for a mp4 file:

```diff
{
    "filename": "video.mp4",
    "container": {
        "format": "MPEG-4",
-       "mimeType": "video/mp4",
        "fileSize": 22145829,
-       "duration": 21021,
+       "duration": 21.021,
        "totalBitrate": 8428078
    },
    "video": [
        {
            "codec": "AVC",
            "profile": "High@L4",
            "bitrate": 8000000,
-           "duration": 21021,
+           "duration": 21.021,
            "frameCount": 630,
            "width": 1920,
            "height": 1080,
            "framerate": 29.97,
            "scanType": "Progressive",
-           "aspectRatio": "16:9",
+           "aspectRatio": "1.778",
            "bitDepth": 8,
            "colorSpace": "YUV 4:2:0"
        }
    ],
    "audio": [
        {
            "codec": "AAC",
            "bitrate": 384000,
-           "duration": 21021,
+           "duration": 21.021,
            "frameCount": 985,
            "bitrateMode": "VBR",
            "channels": 2,
            "samplingRate": 48000,
            "samplePerFrame": 1024
        }
    ]
}
```

In summary:
- Some properties, such as _duration_, are now floats instead of integers
- _mimeType_ is not included anymore
- Format for _aspectRatio_ has changed

For a complete list of changes, please refer to the [MediaInfo change log](https://mediaarea.net/MediaInfo/ChangeLog).