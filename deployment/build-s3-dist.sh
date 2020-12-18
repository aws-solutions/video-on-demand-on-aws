#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name trademarked-solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - trademarked-solution-name: name of the solution for consistency
#
#  - version-code: version of the package

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademark approved solution name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

set -e

# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "Rebuild distribution"
echo "------------------------------------------------------------------------------"
rm -rf $template_dist_dir
mkdir -p $template_dist_dir
rm -rf $build_dist_dir
mkdir -p $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "CloudFormation Template"
echo "------------------------------------------------------------------------------"
cp $template_dir/video-on-demand-on-aws.yaml $template_dist_dir/video-on-demand-on-aws.template

replace="s/%%BUCKET_NAME%%/$1/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/video-on-demand-on-aws.template

replace="s/%%SOLUTION_NAME%%/$2/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/video-on-demand-on-aws.template

replace="s/%%VERSION%%/$3/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/video-on-demand-on-aws.template
sed -i -e $replace $template_dir/../README.md

cp $template_dist_dir/video-on-demand-on-aws.template $build_dist_dir/

echo "------------------------------------------------------------------------------"
echo "Download mediainfo binary for AWS Lambda"
echo "------------------------------------------------------------------------------"
cd $source_dir/mediainfo/
rm -rf bin/*
curl -O https://mediaarea.net/download/binary/mediainfo/20.09/MediaInfo_CLI_20.09_Lambda.zip
unzip MediaInfo_CLI_20.09_Lambda.zip 
mv LICENSE bin/
chmod +x ./bin/mediainfo
rm -r MediaInfo_CLI_20.09_Lambda.zip

cd $source_dir/
echo "------------------------------------------------------------------------------"
echo "Lambda Functions"
echo "------------------------------------------------------------------------------"

for folder in */ ; do
    cd "$folder"

    function_name=${PWD##*/}
    zip_path="$build_dist_dir/$function_name.zip"

    echo "Creating deployment package for $function_name at $zip_path"

    if [ -e "package.json" ]; then
        rm -rf node_modules/
        npm i --production

        zip -q -r9 $zip_path .
    elif [ -e "setup.py" ]; then
        # If you're running this command on macOS and Python3 has been installed using Homebrew, you might see this issue:
        #    DistutilsOptionError: must supply either home or prefix/exec-prefix
        # Please follow the workaround suggested on this StackOverflow answer: https://stackoverflow.com/a/4472877
        python3 setup.py build_pkg --zip-path=$zip_path
    fi

    cd ..
done

echo "------------------------------------------------------------------------------"
echo "S3 Packaging Complete"
echo "------------------------------------------------------------------------------"
