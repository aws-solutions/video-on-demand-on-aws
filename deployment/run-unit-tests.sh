#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd source/

for folder in */ ; do
    cd "$folder"

    function_name=${PWD##*/}
    if [ -e "package.json" ]; then
        #rm -rf node_modules/
        npm test

    elif [ -e "setup.py" ]; then
      # If you're running these commands on macOS and Python3 has been installed using Homebrew, you might see this issue:
      #    DistutilsOptionError: must supply either home or prefix/exec-prefix
      # Please follow the workaround suggested on this StackOverflow answer: https://stackoverflow.com/a/44728772
      rm -rf ./pytests && mkdir ./pytests
      cp lambda_function.py ./test*.py ./pytests
      pip3 install boto3 -t ./pytests
      python3 -m unittest discover -s ./pytests -v
      rm -rf ./pytests
    fi

    cd ..
done