import * as cdk from '@aws-cdk/core'
import * as kinesis from '@aws-cdk/aws-kinesis'
import * as lambda from '@aws-cdk/aws-lambda'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import { StreamEncryption, CfnStreamConsumer, StreamMode } from '@aws-cdk/aws-kinesis'
import { KinesisEventSource, SqsDlq } from '@aws-cdk/aws-lambda-event-sources'
import { EventSourceMapping } from '@aws-cdk/aws-lambda'
import { Queue } from '@aws-cdk/aws-sqs'
import { Dashboard, GraphWidget, IWidget, Metric, DimensionsMap } from '@aws-cdk/aws-cloudwatch'

export class OreillyKinesisTrainingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The stream
    const stream = new kinesis.Stream(this, 'OReillyStream', {
      streamName: 'oreilly-stream',
      shardCount: 1,
      streamMode: StreamMode.PROVISIONED,
      encryption: StreamEncryption.UNENCRYPTED
    })

    // Producer Lambda
    const producer = new lambda.Function(this, 'KinesisProducer', {
      functionName: 'kinesisProducer',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/producer', { exclude: ['test', '*.json'] }),
      handler: 'producer.handler',
      timeout: cdk.Duration.seconds(300), // 5 min
      memorySize: 1024,
      environment: {
        STREAM_NAME: stream.streamName,
        MAX_RETRIES: '10'
      }
    })

    stream.grantWrite(producer)

    // Consumer Lambda
    const consumer = new lambda.Function(this, 'KinesisConsumer', {
      functionName: 'kinesisConsumer',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/consumer', { exclude: ['test', '*.json'] }),
      handler: 'consumer.handler',
      environment: {
      }
    })

    stream.grantRead(consumer)

    /* Basic ESM */

    consumer.addEventSource(new KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10000
    }))


    /* Parallelization factor */
    /*
    consumer.addEventSource(new KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10000,
      parallelizationFactor: 3
    }))
    */


    /** Failures */
    const dlq = new Queue(this, 'DLQ', {
      queueName: 'consumer-lambda-dlq'
    })
    /*
    consumer.addEventSource(new KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10000,
      retryAttempts: 1,
      maxRecordAge: cdk.Duration.minutes(1),
      //bisectBatchOnError: true,
      //reportBatchItemFailures: true,
      //onFailure: new SqsDlq(dlq)
    }))
    */


    /** Tumbling window */
    /*
    consumer.addEventSource(new KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 3,
      tumblingWindow: cdk.Duration.seconds(10)
    }))
    */


    /**
     * EFO
     */
    /** Step 1.0 */
    /*
    const enhancedConsumer = new CfnStreamConsumer(this, 'EnhancedConsumer', {
      consumerName: 'oreilly-stream-consumer',
      streamArn: stream.streamArn
    })
    */

    /** Step 1.1: IAM policy */
    /*
    const enhancedConsumerPolicy = new PolicyStatement({
      resources: [enhancedConsumer.attrConsumerArn],
      actions: ['kinesis:SubscribeToShard'],
    })

    consumer.addToRolePolicy(enhancedConsumerPolicy)
    */

    /** Step 1.2: ESM */
    /*
    new EventSourceMapping(this, 'EventSourceMapping', {
      batchSize: 10000,
      startingPosition: lambda.StartingPosition.LATEST,
      eventSourceArn: enhancedConsumer.attrConsumerArn,
      target: consumer,
    })
    */
   /** EFO */


    // CloudWatch Dashboard
    const dashboard = new Dashboard(this, 'OReillyDashboard', {
      dashboardName: 'OReilly'
    })

    const kinesisMetric = (metricName: string, label: string, color: string, statistic: string = 'Sum') => new Metric({
      metricName,
      namespace: 'AWS/Kinesis',
      dimensionsMap: {'StreamName': stream.streamName},
      statistic,
      label,
      period: cdk.Duration.minutes(1),
      color
    })

    const lambdaMetric = (metricName: string, label: string, color: string, dimensionsMap: DimensionsMap = {}) => new Metric({
      metricName,
      namespace: 'AWS/Lambda',
      dimensionsMap,
      statistic: 'Maximum',
      label,
      period: cdk.Duration.minutes(1),
      color
    })

    const writingMetrics = new GraphWidget({
      width: 24,
      height: 8,
      title: 'Writing to a Stream',
      left: [
        kinesisMetric(
          'PutRecords.TotalRecords',
          'PutRecords.TotalRecords: Records in total',
          '#9467bd'),
        kinesisMetric(
            'PutRecords.SuccessfulRecords',
            'PutRecords.SuccessfulRecords:  Successfully written records',
            '#2ca02c'),
        kinesisMetric(
            'IncomingRecords',
            'IncomingRecords: Successfully written records',
            '#2ca02c'),
        kinesisMetric(
            'PutRecords.Success',
            'PutRecords.Success: Batch operations with at least one success',
            '#dbdb8d')
      ],
      right: [
        kinesisMetric(
          'PutRecords.ThrottledRecords',
          'PutRecords.ThrottledRecords: Records rejected due to throttling',
          '#d62728'),
        kinesisMetric(
          'WriteProvisionedThroughputExceeded',
          'WriteProvisionedThroughputExceeded: Records rejected due to throttling',
          '#d62728'),
        kinesisMetric(
          'PutRecords.FailedRecords',
          'PutRecords.FailedRecords: Records rejected due to internal failures',
          '#e377c2')
      ]
    })

    const readingMetrics = new GraphWidget({
      width: 24,
      height: 8,
      title: 'Reading from a stream',
      left: [
        kinesisMetric(
          'GetRecords.IteratorAgeMilliseconds',
          'GetRecords.IteratorAgeMilliseconds: Age of the last obtained record, across all consumers',
          '#9467bd',
          'Maximum'),
        lambdaMetric(
          'IteratorAge',
          'Lambda IteratorAge: Age of the latest record the ESM reads',
          '#17becf',
          { 'FunctionName': consumer.functionName })
      ],
      right: [
        kinesisMetric(
          'ReadProvisionedThroughputExceeded',
          'ReadProvisionedThroughputExceeded: Throttled GetRecords calls',
          '#d62728'),
        lambdaMetric(
          'ConcurrentExecutions',
          'ConcurrentExecutions: Across all the lambdas in the acount + region',
          '#ffbb78'
        )
      ]
    })

    dashboard.addWidgets(writingMetrics)
    dashboard.addWidgets(readingMetrics)
  }
}
