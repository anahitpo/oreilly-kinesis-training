require('dotenv').config({ path: '.env-test' })
const nock = require('nock')
const {
  describe,
  it,
  afterEach
} = require('mocha')

const { sendRecordsInABatch } = require('../kinesisImproved')

const { MAX_RETRIES } = process.env

const kinesisURL = `https://kinesis.${process.env.AWS_REGION}.amazonaws.com:443`


/**
 * Retries and failures of the entire request
 */
describe('SDK Retries', () => {

  const kinesisSuccessAfterFailures = () => nock(kinesisURL)
    .post('/')
    .times(MAX_RETRIES)
    .reply(500, () => {
      console.log('First it fails..')
    })
    .post('/')
    .reply(200, () => {
      console.log('retry ..and now it SUCCEEDS!')
    })

  const kinesisFailure = () => nock(kinesisURL)
    .post('/')
    .times(MAX_RETRIES + 1)
    .reply(500, () => {
      console.log('It fails..')
    })

  afterEach(() => {
    nock.cleanAll()
    console.log('*******************************', '\n')
  })

  it('SUCCESS', async () => {
    console.log('*********** SUCCESS ***********', '\n')
    kinesisSuccessAfterFailures()

    await sendRecordsInABatch(['1', '2', '3'])
  })

  it('FAILURE', async () => {
    console.log('*********** FAILURE ***********', '\n')
    kinesisFailure()

    await sendRecordsInABatch(['1', '2', '3'])
  })
})
