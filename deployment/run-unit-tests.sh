#!/bin/bash

cd ../source/archive-source
npm install --silent
npm test

cd ../custom-resource
npm install --silent
npm test

cd ../dynamo
npm install --silent
npm test

cd ../encode
npm install --silent
npm test

cd ../error-handler
npm install --silent
npm test

cd ../input-validate
npm install --silent
npm test

cd ../profiler
npm install --silent
npm test

cd ../sns-notification
npm install --silent
npm test

cd ../step-functions
npm install --silent
npm test
