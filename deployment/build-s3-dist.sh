#!/usr/bin/env bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh
#

set -eu

template_dir=$PWD

# Get reference for all important folders
build_dist_dir="$template_dir/target/package"
source_dir="$template_dir/source"

rm -rf build_dist_dir || true
mkdir -p $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "Download mediainfo binary for AWS Lambda"
echo "------------------------------------------------------------------------------"
# https://mediaarea.net/en/MediaInfo/Download/Lambda
cd $source_dir/mediainfo/
rm -rf bin/*
MI_VERSION="21.03"
curl -O https://mediaarea.net/download/binary/mediainfo/${MI_VERSION}/MediaInfo_CLI_${MI_VERSION}_Lambda.zip
unzip MediaInfo_CLI_${MI_VERSION}_Lambda.zip
mv LICENSE bin/
chmod +x ./bin/mediainfo
rm -r MediaInfo_CLI_${MI_VERSION}_Lambda.zip

cd $source_dir/
echo "------------------------------------------------------------------------------"
echo "Lambda Functions"
echo "------------------------------------------------------------------------------"

for folder in */ ; do
    cd "$folder"

    function_name=${PWD##*/}
    zip_path="$build_dist_dir/$function_name/package.zip"
    mkdir -p "$build_dist_dir/$function_name"

    echo "Creating deployment package for $function_name at $zip_path"

    if [ -e "package.json" ]; then
        #rm -rf node_modules/
        npm install --production

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
