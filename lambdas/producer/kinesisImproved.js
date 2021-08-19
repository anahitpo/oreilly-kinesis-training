/**
 * v1:
 * Configure retries and timeouts:
 * use Kinesis or Config objects.
 * Add try/catch
 */

const AWS = require('aws-sdk')

const { STREAM_NAME, MAX_RETRIES } = process.env

const kinesis = new AWS.Kinesis({
  apiVersion: '2013-12-02',
  maxRetries: Number(MAX_RETRIES), // Default: 3
  retryDelayOptions: { base: 50 }, // Default: 100 ms
  httpOptions: { connectTimeout: 1000, timeout: 1000 } // Default: 2 minutes..
})

/*
AWS.config = new AWS.Config({
  region: process.env.AWS_REGION,
  apiVersions: {
    kinesis: '2013-12-02'
  },
  maxRetries: Number(process.env.MAX_RETRIES),
  retryDelayOptions: { base: 50 },
  httpOptions: { connectTimeout: 1000, timeout: 1000 }
})
*/

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

exports.sendRecordsInABatch = async (partitionKeys) => {
  const records = generateKinesisRecords(partitionKeys)
  try {
    await putKinesisRecords(records)
  } catch (err) {
    console.error('ERROR: Smth bad happened!')
  }
}
