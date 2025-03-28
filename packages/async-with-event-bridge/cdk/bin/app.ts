#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventBridgeAsyncStack } from '../lib/app-stack';
import { getConfig, getEnv } from '@xaaxaax/cdk-core';

const app = new cdk.App();
const environment = getEnv(app);

const { 
  contextVariables 
} = getConfig(environment, 'event-bridge-async');

new EventBridgeAsyncStack(app, EventBridgeAsyncStack.name, {
  contextVariables,
});
