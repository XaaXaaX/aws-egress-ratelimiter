# Egress Rate Controlling Patterns

This project is a collection of service related examples, illustrating how controlling the egress rate load while communicating over isolated and unaligned boundaries.

## Useful Commands

### SQS

```shell
  aws sqs send-message-batch --queue-url <QUEUE_URL> --entries file://requests/request-sqs-send-message-batch.json
```

### DDB

```shell
aws dynamodb batch-write-item --request-items file://requests/request-ddb-batch-write-items.json
```

### SNS

```shell
aws sns publish-batch \
  --topic-arn <TOPIC_ARN> \
  --publish-batch-request-entries file://requests/request-sns-publish-batch.json

```

### EventBridge

```shell
aws events put-events --entries file://requests/request-eb-put-records.json
```

### Kinesis

```shell
aws kinesis put-records --stream-name <STREAM_NAME> --cli-input-json file://requests/request-kinesis-put-records.json
```
