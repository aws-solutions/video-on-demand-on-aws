#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd ${parent_path}/../source/archive-source
npm test

cd ${parent_path}/../source/custom-resource
npm test

cd ${parent_path}/../source/dynamo
npm test

cd ${parent_path}/../source/encode
npm test

cd ${parent_path}/../source/error-handler
npm test

cd ${parent_path}/../source/media-package-assets
npm test

cd ${parent_path}/../source/input-validate
npm test

cd ${parent_path}/../source/profiler
npm test

cd ${parent_path}/../source/sns-notification
npm test

cd ${parent_path}/../source/step-functions
npm test

# If you're running these commands on macOS and Python3 has been installed using Homebrew, you might see this issue:
#    DistutilsOptionError: must supply either home or prefix/exec-prefix
# Please follow the workaround suggested on this StackOverflow answer: https://stackoverflow.com/a/44728772
cd ${parent_path}/../source/mediainfo
rm -rf ./pytests && mkdir ./pytests
cp lambda_function.py ./test*.py ./pytests
pip3 install boto3 -t ./pytests
python3 -m unittest discover -s ./pytests -v
rm -rf ./pytests
