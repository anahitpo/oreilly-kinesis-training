const AWS = require('aws-sdk')

const { countKeys } = require('./tumbilngWindow')
const { processRecords, processRecordsProperly } = require('./poisonPill')


exports.handler = async (event) => {
  console.log('Received a batch of size', event.Records.length)
  // Step 1: Incoming events
  // console.log('INCOMING EVENT:', JSON.stringify(event))

  /* Step 2: Error handling & retries */
  // - Step 2.1:
  // processRecords(event.Records)
  // - Step 2.2:
  // return processRecordsProperly(event.Records)

  /* Step 3: Tumbling window */
  // return { state: { keyCounts: countKeys(event) } }
}
