/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import '@aws-cdk/assert/jest';
import { Stack } from 'aws-cdk-lib';
import { SynthUtils } from '@aws-cdk/assert';
import * as VideoOnDemand from '../lib/vod-stack';

expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string',
    print: (val) => {
        const valueReplacements = [
            {
                regex: /([A-Fa-f0-9]{64}).zip/,
                replacementValue: '[HASH REMOVED].zip'
            }
        ];

        return `${valueReplacements.reduce(
            (output, replacement) => output.replace(replacement.regex, replacement.replacementValue),
            val as string
        )}`;
    }
});

test('VideoOnDemand Stack Test', () => {
    const stack = new Stack();
    const vodTest = new VideoOnDemand.VideoOnDemand(stack, 'VideoOnDemand');
    expect(SynthUtils.toCloudFormation(vodTest)).toMatchSnapshot();
});