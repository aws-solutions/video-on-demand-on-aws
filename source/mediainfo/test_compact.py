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

import unittest
import lambda_function as function

class TestCompact(unittest.TestCase):
    def test_removes_empty_attributes(self):
        attributes = {
            'format': 'mp4',
            'fileSize': 1000,
            'duration': None
        }

        expected = {
            'format': 'mp4',
            'fileSize': 1000
        }

        self.assertEqual(function.compact(attributes), expected)

    def test_does_not_remove_zero_attributes(self):
        attributes = {
            'format': 'mp4',
            'fileSize': 0
        }

        expected = {
            'format': 'mp4',
            'fileSize': 0
        }

        self.assertEqual(function.compact(attributes), expected)

if __name__ == '__main__':
    unittest.main()
