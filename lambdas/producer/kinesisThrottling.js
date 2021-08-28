/**
 * v2:
 * Simulate throttling when sending too many records.
 */

const AWS = require('aws-sdk')

const { STREAM_NAME, MAX_RETRIES } = process.env
const RETRY_DELAY_BASE = 50

const kinesis = new AWS.Kinesis({
  apiVersion: '2013-12-02',
  maxRetries: Number(MAX_RETRIES), // Default: 3
  retryDelayOptions: { base: RETRY_DELAY_BASE }, // Default: 100 ms
  httpOptions: { connectTimeout: 1000, timeout: 1000 } // Default: 2 minutes..
})


const putKinesisRecords = (records) => {
  const payload = {
    StreamName: STREAM_NAME,
    Records: records
  }
  return kinesis.putRecords(payload).promise()
}

const generateKinesisRecords = (partitionKeys) => partitionKeys.map((key) => ({
  Data: JSON.stringify({
    importantStuff: 'Your data is important!',
    smthElse: 'Kinesis will take good care of it'
  }),
  PartitionKey: key
}))


// ----> Try out in console
const tooManyRecords = (partitionKeys, batchCount) => {
  const batchArray = []
  for (let i = 0; i < batchCount; i++) {
    batchArray.push(generateKinesisRecords(partitionKeys))
  }
  return batchArray
}

exports.sendTooManyRecords = async (partitionKeys, batchCount) => {
  const recordBatches = tooManyRecords(partitionKeys, batchCount)

  try {
    await Promise.all(recordBatches.map(putKinesisRecords))
  } catch (err) {
    console.error('ERROR: Smth bad happened!', err)
  }
}

//

exports.sendRecordsInABatchWithLogging = async (partitionKeys) => {
  const records = generateKinesisRecords(partitionKeys)
  try {
    const response = await putKinesisRecords(records)
    console.log('RESPONSE:', response)
  } catch (err) {
    console.error('ERROR: Smth bad happened!')
  }
}

//

const logFailedResponse = (response) => {
  if (response?.FailedRecordCount > 0) {
    console.log('PARTIAL FAILURE:', response)
  }
}

exports.sendTooManyRecordsWithLogging = async (partitionKeys, batchCount) => {
  const recordBatches = tooManyRecords(partitionKeys, batchCount)

  try {
    await Promise.all(recordBatches.map(async (records) => {
      const response = await putKinesisRecords(records)

      logFailedResponse(response)
    }))
  } catch (err) {
    console.error('ERROR: Smth bad happened!', err)
  }
}
// <----
