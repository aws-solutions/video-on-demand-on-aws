#!/usr/bin/env node
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

import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { DefaultStackSynthesizer, Stack } from 'aws-cdk-lib'
import { VideoOnDemand } from '../lib/vod-stack'
import { AwsSolutionsChecks } from 'cdk-nag'

const app = new cdk.App()
new VideoOnDemand(app, 'VideoOnDemand', {
  // NOSONAR
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
  consumerAccountPrincipal: new iam.AccountPrincipal('488682066271'),
}) // NOSONAR

//cdk nag
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
