import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApplicationLogLevel, Architecture, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
export type EventBridgeAsyncStackProps = EnforcedStackProps;

export class EventBridgeAsyncStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: EventBridgeAsyncStackProps) {
    super(scope, id, props);

    const functionRole = new Role(this, 'LambdaFunctionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    });

    const lambdaFunction = new NodejsFunction(this, 'LambdaZipFunction', {
      entry: resolve(process.cwd(), 'src/handler.ts'),
      reservedConcurrentExecutions: 1,
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      loggingFormat: LoggingFormat.JSON,
      role: functionRole,
      memorySize: 256,
      timeout: Duration.seconds(30),
      systemLogLevelV2: SystemLogLevel.INFO,
      applicationLogLevelV2: ApplicationLogLevel.INFO,
      awsSdkConnectionReuse: false,
      bundling: {
        platform: 'node',
        format: OutputFormat.ESM,
        mainFields: ['module', 'main'],
        minify: true,
        sourceMap: true,
        sourcesContent: false,
        sourceMapMode: SourceMapMode.INLINE,
      },
    });

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: 1,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const bus = new EventBus(this, 'EventBus');

    new Rule(this, 'Rule', {
      eventPattern: {
        source: ['com.company.myservice']
      },
      eventBus: bus,
    }).addTarget(new LambdaFunction(lambdaFunction, {
      maxEventAge: Duration.hours(1),
      retryAttempts: 3
    }));

  }
}
