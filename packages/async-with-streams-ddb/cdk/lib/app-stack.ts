import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApplicationLogLevel, Architecture, LoggingFormat, Runtime, StartingPosition, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
export type DdbStreamsAsyncStackProps = EnforcedStackProps;

export class DdbStreamsAsyncStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: DdbStreamsAsyncStackProps) {
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

    const table = new Table(this, 'Table', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    lambdaFunction.addEventSource(new DynamoEventSource(table, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(60),
      bisectBatchOnError: true,
      retryAttempts: 3,
      maxRecordAge: Duration.minutes(15),
      parallelizationFactor: 1,
    }));  

    table.grantStreamRead(lambdaFunction);
  }
}
