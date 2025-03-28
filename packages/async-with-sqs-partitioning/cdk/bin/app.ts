#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SqsAsyncPartitioningStack } from '../lib/app-stack';
import { getConfig, getEnv } from '@xaaxaax/cdk-core';

const app = new cdk.App();
const environment = getEnv(app);

const { 
  contextVariables 
} = getConfig(environment, 'sqs-async-patitioning');

new SqsAsyncPartitioningStack(app, SqsAsyncPartitioningStack.name, {
  contextVariables,
});
