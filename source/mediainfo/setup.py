######################################################################################################################
#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

import sys
from setuptools import setup
from setuptools.command.test import test as TestCommand
from setuptools import Command
import subprocess

def run_bash_command(command):
    try:
        subprocess.check_call([command], shell=True)
    except subprocess.CalledProcessError as error:
        print(f'Command failed with exit code: {error.returncode}')
        sys.exit(error.returncode)

class BuildPackageCommand(Command):
    description = 'Build lambda package'
    user_options = [
        ('zip-path=', None, 'Location where the zip file will be generated')
    ]

    def initialize_options(self):
        self.zip_path = None

    def finalize_options(self):
        assert self.zip_path is not None, 'Invalid zip_path'

    def run(self):
        run_bash_command(f'zip -rq9 {self.zip_path} lambda_function.py ./bin/*')

class UnitTestsCommand(TestCommand):
    description = 'Run unit tests'

    def run_tests(self):
        run_bash_command('rm -rf ./pytests && mkdir ./pytests')
        run_bash_command('cp lambda_function.py ./test*.py ./pytests')
        run_bash_command('python3 -m unittest discover -s ./pytests -v')
        run_bash_command('rm -rf ./pytests')

setup(
    name='mediainfo-function',
    author='AWS Solutions Builder',
    description='Mediainfo function of the Video on Demand on AWS solution',
    license='Apache-2.0',
    url='https://github.com/awslabs/video-on-demand-on-aws/',
    cmdclass={
        'build_pkg': BuildPackageCommand,
        'test': UnitTestsCommand
    }
)
