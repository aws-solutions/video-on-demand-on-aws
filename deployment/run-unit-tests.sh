#!/bin/bash

set -e

cd ../source/archive-source
npm test

cd ../custom-resource
npm test

cd ../dynamo
npm test

cd ../encode
npm test

cd ../error-handler
npm test

cd ../media-package-assets
npm test

cd ../input-validate
npm test

cd ../profiler
npm test

cd ../sns-notification
npm test

cd ../step-functions
npm test

# If you're running these commands on macOS and Python3 has been installed using Homebrew, you might see this issue:
#    DistutilsOptionError: must supply either home or prefix/exec-prefix
# Please follow the workaround suggested on this StackOverflow answer: https://stackoverflow.com/a/44728772
cd ../mediainfo
rm -rf ./pytests && mkdir ./pytests
cp lambda_function.py ./test*.py ./pytests
pip3 install boto3 -t ./pytests
python3 -m unittest discover -s ./pytests -v
rm -rf ./pytests
