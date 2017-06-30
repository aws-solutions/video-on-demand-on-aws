#!/bin/bash
# curently works in the following regions due to the combination of ETS and
# Step Functions
#EU (Ireland)
#Asia Pacific (Tokyo)
#US East (N. Virginia)
#US West (Oregon)
# Asia Pacific (Sydney)

# Check to see if input has been provided:
if [ -z "$1" ]; then
    echo "Please provide the base source bucket name where the lambda code will eventually reside.\nFor example: ./build-s3-dist.sh solutions"
    exit 1
fi

echo "mkdir -p dist"
mkdir -p dist

echo "cp video-on-demand.yaml dist/video-on-demand.template"
cp video-on-demand.yaml dist/video-on-demand.template

echo "sed -i -e $replace video-on-demand.yaml"
replace="s/%%BUCKET_NAME%%/$1/g"
sed -i -e $replace dist/video-on-demand.template

echo "zip and copy ../source/custom-resources to dist/"
cd ../source/custom-resources     # all lambda backed custom resources
npm install --silent
zip -q -r9 ../../deployment/dist/custom-resources.zip *

echo "zip and copy ../source/workflow  to dist/"
cd ../workflow           # lambda functions for step Functions
npm install --silent
zip -q -r9 ../../deployment/dist/workflow.zip *

echo "zip and copy ../source/metrics  to dist/"
cd ../metrics     # custom resource for stack create/update/delete metrics
npm install --silent
zip -q -r9 ../../deployment/dist/metrics.zip *

echo "compiling  mediainfo from source"
cd ../mediainfo/
ls
mkdir bin
cd bin
echo "Download MediaInfo"
wget http://mediaarea.net/download/binary/mediainfo/0.7.84/MediaInfo_CLI_0.7.84_GNU_FromSource.tar.xz
echo "Untar MediaInfo"
tar xf MediaInfo_CLI_0.7.84_GNU_FromSource.tar.xz

echo "Compile MediaInfo with Support for URL Inputs"
cd MediaInfo_CLI_GNU_FromSource/
./CLI_Compile.sh --with-libcurl
echo "move binary to mediainfo/bin"
mv ./MediaInfo/Project/GNU/CLI/mediainfo ../
cd ../..
echo "make sure mediainfo executable"
chmod 755 ./bin/mediainfo
echo "run mediainfo --version"
./bin/mediainfo --version
echo "rm mediainfo source files"
rm -rf ./bin/MediaInfo_CLI*

echo "zip and copy ../source/metrics  to dist/"
npm install
zip -q -r9 ../../deployment/dist/mediainfo.zip *
ls -la ../../deployment/dist/

echo "Build complete"
