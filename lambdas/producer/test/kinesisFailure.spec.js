require('dotenv').config({ path: '.env-test' })
const nock = require('nock')
const {
  describe,
  it,
  afterEach
} = require('mocha')

const { sendRecordsInABatch } = require('../kinesisFailures')

const { MAX_RETRIES } = process.env

const kinesisURL = `https://kinesis.${process.env.AWS_REGION}.amazonaws.com:443`

/**
 * Partial failures of the requests
 */
describe('Partial Failures', () => {
  const kinesisSuccessAfterPartialFaillure = () => nock(kinesisURL)
    .post('/')
    .reply(200, () => (
      {
        FailedRecordCount: 1,
        Records: [
          {
            SequenceNumber: '123456',
            ShardId: 'shardId-000000000000'
          },
          {
            ErrorCode: 'ProvisionedThroughputExceededException',
            ErrorMessage: 'Rate exceeded for shard shardId-000000000000 in stream oreilly-stream under account xxx.'
          }
        ]
      }))
    .post('/')
    .reply(200, () => {
      console.log('partial retry SUCCEEDS!')
      return {
        Records: [
          {
            SequenceNumber: '654321',
            ShardId: 'shardId-000000000000'
          }
        ]
      }
    })

  const kinesisPartialFaillure = () => nock(kinesisURL)
    .post('/')
    .times(MAX_RETRIES + 1)
    .reply(200, () => (
      {
        FailedRecordCount: 1,
        Records: [
          {
            ErrorCode: 'ProvisionedThroughputExceededException',
            ErrorMessage: 'Rate exceeded for shard shardId-000000000000 in stream oreilly-stream under account xxx.'
          }
        ]
      }))

  afterEach(() => {
    nock.cleanAll()
  })

  it('retrying with a single partial failure', async () => {
    kinesisSuccessAfterPartialFaillure()

    await sendRecordsInABatch(['1', '2'])
  })

  it('retrying with partial failure that will not succeed', async () => {
    kinesisPartialFaillure()

    await sendRecordsInABatch(['1'])
  })
})
