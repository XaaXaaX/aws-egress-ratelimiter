import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApplicationLogLevel, Architecture, LoggingFormat, Runtime, StartingPosition, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { Stream, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { KinesisEventSource, SqsDlq } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
export type KinesisStreamsAsyncStackProps = EnforcedStackProps;

export class KinesisStreamsAsyncStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: KinesisStreamsAsyncStackProps) {
    super(scope, id, props);

    const functionRole = new Role(this, 'LambdaFunctionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    });

    const lambdaFunction = new NodejsFunction(this, 'LambdaZipFunction', {
      entry: resolve(process.cwd(), 'src/handler.ts'),
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

    const stream = new Stream(this, 'Queue', {
      streamMode: StreamMode.ON_DEMAND,
      removalPolicy: RemovalPolicy.DESTROY
    });

    lambdaFunction.addEventSource(new KinesisEventSource(stream, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(60),
      bisectBatchOnError: true,
      retryAttempts: 3,
      maxRecordAge: Duration.minutes(15),
      parallelizationFactor: 1,
      onFailure: new SqsDlq(new Queue(this, 'DLQ'))
    }));
    
    stream.grantRead(lambdaFunction);
  }
}
