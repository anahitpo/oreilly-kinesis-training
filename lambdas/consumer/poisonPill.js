const parseData = (kinesisData) => {
  const decodedDataString = Buffer.from(kinesisData, 'base64').toString('utf8')
  return JSON.parse(decodedDataString)
}

let failureSequenceNumber

const poisonPill = (kinesisRecord) => {
  if (kinesisRecord.partitionKey === '1') {
    failureSequenceNumber = kinesisRecord.sequenceNumber
    throw new Error('This is a poson pill!')
  }
}

const processRecord = (record) => {
  console.log('PARTITION KEY:', record.kinesis.partitionKey)

  poisonPill(record.kinesis)

  return parseData(record.kinesis.data)
}

/**
 * No Error handling
 */
exports.processRecords = (kinesisRecords) => {
  const recordPayloads = kinesisRecords.map(processRecord)
  console.log('DATA:', recordPayloads)
}

/**
 * Partial success
 */
exports.processRecordsProperly = (kinesisRecords) => {
  try {
    const recordPayloads = kinesisRecords.map(processRecord)
    console.log('DATA:', recordPayloads)

    return undefined
  } catch (err) {
    console.log(err)
    return { batchItemFailures: [{ itemIdentifier: failureSequenceNumber }] }
  }
}
