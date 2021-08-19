const {
  sendSeparateRecords
} = require('./kinesisBasic')

const {
  sendTooManyRecords,
  sendRecordsInABatchWithLogging,
  sendTooManyRecordsWithLogging
} = require('./kinesisThrottling')

const {
  sendRecordsInABatch,
  sendTooManyRecordsWithRetries
} = require('./kinesisFailures')

const generateKeys = (count) => [...Array(count).keys()].map((key) => key.toString())

exports.handler = async (event) => {
  const { recordCount, batchCount } = event
  if (!recordCount) {
    throw new Error('Event is missing required parameter(s)!')
  }

  const partitionKeys = generateKeys(recordCount)

  /* Step 0 */
  await sendSeparateRecords(partitionKeys)

  /* Step 2: Throttling */
  // - Step 2.1:
  // await sendTooManyRecords(partitionKeys, batchCount)
  // - Step 2.2:
  // await sendRecordsInABatchWithLogging(partitionKeys)
  // - Step 2.3:
  // await sendTooManyRecordsWithLogging(partitionKeys, batchCount)

  /* Step 3: Handle the Failures */
  // - Step 3.0:
  // await sendRecordsInABatch(partitionKeys)
  // - Step 3.5 - 3.6:
  // await sendTooManyRecordsWithRetries(partitionKeys, batchCount)
}
