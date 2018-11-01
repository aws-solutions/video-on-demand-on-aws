#!/bin/bash -eu

# Check to see if input has been provided:
if [ "$#" -lt 2 ]; then
    echo "Please provide the base source bucket name and version where the lambda code will eventually reside."
    echo "For example: ./deploy.sh solutions v1.0.0"
    exit 1
fi

# ensure bucket exists
aws s3api create-bucket --bucket $1-us-east-1 --region us-east-1

# upload to s3
aws s3 sync ../deployment/dist s3://$1-us-east-1/video-on-demand/$2 --delete

# deploy on cloudformation
aws cloudformation deploy \
    --stack-name $1-us-east-1 \
    --capabilities CAPABILITY_NAMED_IAM \
    --template-file ../deployment/dist/packaged.yaml \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        AdminEmail=mbiard@seedbox.com \
        WorkflowTrigger=SourceVideo \
        MP4= \
        HLS=2160,1080,720,540,360,270 \
        DASH=
