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

cd ../mediainfo
python3 setup.py test
