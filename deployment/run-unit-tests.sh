#!/bin/bash

[ "$DEBUG" == 'true' ] && set -x
set -e

prepare_jest_coverage_report() {
  local component_name=$1

  if [ ! -d "coverage" ]; then
      echo "ValidationError: Missing required directory coverage after running unit tests"
      exit 129
  fi

  # prepare coverage reports
  rm -fr coverage/lcov-report
  mkdir -p "$coverage_reports_top_path/jest"
  coverage_report_path="$coverage_reports_top_path/jest/$component_name"
  rm -fr "$coverage_report_path"
  mv coverage "$coverage_report_path"
}

run_javascript_test() {
  local component_path=$1
  local component_name=$2

  echo "------------------------------------------------------------------------------"
  echo "[Test] Run javascript unit test with coverage for $component_name"
  echo "------------------------------------------------------------------------------"
  echo "cd $component_path"
  cd "$component_path"

  # install dependencies
  npm install --silent
  # run unit tests
  npm test

  # prepare coverage reports
  prepare_jest_coverage_report "$component_name"
}

# Get reference for all important folders
template_dir="$PWD"
source_dir="$template_dir/../source"
coverage_reports_top_path="$source_dir/test/coverage-reports"

# Test the attached Lambda function
declare -a lambda_packages=(
  "cdk"
  "custom-resource"
  "archive-source"
  "dynamo"
  "encode"
  "error-handler"
  "input-validate"
  "media-package-assets"
  "output-validate"
  "profiler"
  "sns-notification"
  "sqs-publish"
  "step-functions"
)

for lambda_package in "${lambda_packages[@]}"
do
  rm -rf "$source_dir/$lambda_package/coverage"
  mkdir "$source_dir/$lambda_package/coverage"
  run_javascript_test "$source_dir/$lambda_package" $lambda_package

  # Check the result of the test and exit if a failure is identified
  if [ $? -eq 0 ]
  then
    echo "Test for $lambda_package passed"
  else
    echo "******************************************************************************"
    echo "Lambda test FAILED for $lambda_package"
    echo "******************************************************************************"
    exit 1
  fi

done


echo "------------------------------------------------------------------------------"
echo "[Test] Run python unit test with coverage for mediainfo"
echo "------------------------------------------------------------------------------"
echo "cd $source_dir/mediainfo"
# If you're running these commands on macOS and Python3 has been installed using Homebrew, you might see this issue:
#    DistutilsOptionError: must supply either home or prefix/exec-prefix
# Please follow the workaround suggested on this StackOverflow answer: https://stackoverflow.com/a/44728772
cd ../mediainfo
pip3 install boto3 -t ./pytests --quiet
pip3 install pytest --quiet
pip3 install pytest-cov --quiet

rm -rf coverage
pytest --cov=. --cov-report xml:coverage/coverage.xml
# fix source file path
sed -i -- 's/filename\=\"/filename\=\"source\/mediainfo\//g' coverage/coverage.xml
mkdir -p "$coverage_reports_top_path/pytest"
mv coverage "$coverage_reports_top_path/pytest/mediainfo"
rm -rf pytests
