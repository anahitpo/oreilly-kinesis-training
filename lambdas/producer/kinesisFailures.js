/**
 * v3:
 * Handle partial failures:
 * - simple retries
 * - retries with upper limit
 * - retries with delays (exponential and jitter)
 */

const AWS = require('aws-sdk')
const zipWith = require('lodash.zipwith')

const { STREAM_NAME, MAX_RETRIES } = process.env
const RETRY_DELAY_BASE = 1000

const kinesis = new AWS.Kinesis({
  apiVersion: '2013-12-02',
  maxRetries: Number(MAX_RETRIES), // Default: 3
  retryDelayOptions: { base: 50 }, // Default: 100 ms
  httpOptions: { connectTimeout: 1000, timeout: 1000 } // Default: 2 minutes..
})


const putKinesisRecords = (records) => {
  const payload = {
    StreamName: STREAM_NAME,
    Records: records
  }
  console.log('RECORD COUNT:', records.length)
  //console.log('RECORD:', JSON.stringify(payload))
  return kinesis.putRecords(payload).promise()
}

const generateKinesisRecords = (partitionKeys) => partitionKeys.map((key) => ({
  Data: JSON.stringify({
    importantStuff: 'Your data is important!',
    smthElse: 'Kinesis will take good care of it'
  }),
  PartitionKey: key
}))


/**
 * Partial Failures
 */
const partialFailure = (response) => response?.FailedRecordCount > 0

const failedRecords = (records, response) => {
  const toRetry = []

  zipWith(records, response.Records, (requestRecord, responseRecord) => {
    if (responseRecord.ErrorCode) {
      toRetry.push(requestRecord)
    }
  })
  return toRetry
}

/**
 * Simple one time retry
 */
const simpleRetryForFailedRecords = async (records, response) => {
  try {
    if (!partialFailure(response)) {
      return
    }

    const recordsToRetry = failedRecords(records, response)
    console.log(`Retrying ${recordsToRetry.length} failed records..`)

    await putKinesisRecords(recordsToRetry)
  } catch (err) {
    console.error('ERROR: Smth bad happened when retrying failed records!', err)
  }
}


/**
 * Max attempts
 */
const betterRetryForFailedRecords = async (records, response, attempt = 1) => {
  try {
    if (!partialFailure(response)) {
      return
    }

    const recordsToRetry = failedRecords(records, response)

    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying ${recordsToRetry.length} failed records..attempt:`, attempt)

      const newResponse = await putKinesisRecords(recordsToRetry)
      await betterRetryForFailedRecords(recordsToRetry, newResponse, attempt + 1)
    } else if (attempt > MAX_RETRIES) {
      console.error(`ERROR: Could not send the records even after ${attempt} attempts :(`)
    }
  } catch (err) {
    console.error('ERROR: Smth bad happened when retrying failed records!', err)
  }
}

/**
 * Delays
*/
const backoff = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const exponentialDelay = (attempt) => RETRY_DELAY_BASE * (2 ** attempt)

const delayWithJitter = (attempt) => RETRY_DELAY_BASE + Math.floor(
  Math.random() * (exponentialDelay(attempt) - RETRY_DELAY_BASE)
)


const bestRetryForFailedRecords = async (records, response, attempt = 1) => {
  try {
    if (!partialFailure(response)) {
      return
    }

    const recordsToRetry = failedRecords(records, response)

    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying ${recordsToRetry.length} failed records..attempt:`, attempt)

      // Step 3.3
      await backoff(exponentialDelay(attempt))
      // Step 3.4 - 3.5.
      // await backoff(delayWithJitter(attempt))

      const newResponse = await putKinesisRecords(recordsToRetry)
      await bestRetryForFailedRecords(recordsToRetry, newResponse, attempt + 1)
    } else if (attempt > MAX_RETRIES) {
      console.error(`ERROR: Could not send ${recordsToRetry.length} records even after ${attempt} attempts :(`)
    }
  } catch (err) {
    console.error('ERROR: Smth bad happened when retrying failed records!', err)
  }
}


exports.sendRecordsInABatch = async (partitionKeys) => {
  const records = generateKinesisRecords(partitionKeys)
  try {
    const response = await putKinesisRecords(records)
    console.log('RESPONSE:', response)

    // - Step 3.1
    await simpleRetryForFailedRecords(records, response)
    // - Step 3.2
    // await betterRetryForFailedRecords(records, response)
    // - Step 3.3 - 3.5
    // await bestRetryForFailedRecords(records, response)
  } catch (err) {
    console.error('ERROR: Smth bad happened!')
  }
}

// ----> Try out in console
const tooManyRecords = (partitionKeys, batchCount) => {
  const batchArray = []
  for (let i = 0; i < batchCount; i++) {
    batchArray.push(generateKinesisRecords(partitionKeys))
  }
  return batchArray
}

exports.sendTooManyRecordsWithRetries = async (partitionKeys, batchCount) => {
  const recordBatches = tooManyRecords(partitionKeys, batchCount)

  try {
    await Promise.all(recordBatches.map(async (records) => {
      const response = await putKinesisRecords(records)

      await bestRetryForFailedRecords(records, response)
    }))
  } catch (err) {
    console.error('ERROR: Smth bad happened!', err)
  }
}
// <----
