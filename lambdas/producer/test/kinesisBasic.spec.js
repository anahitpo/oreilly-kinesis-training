require('dotenv').config({ path: '.env-test' })
const nock = require('nock')
const {
  describe,
  it,
  afterEach
} = require('mocha')

const { sendSeparateRecords, sendRecordsInABatch } = require('../kinesisBasic')

const kinesisURL = `https://kinesis.${process.env.AWS_REGION}.amazonaws.com:443`

const kinesisSuccessWithLogging = () => nock(kinesisURL)
  .persist()
  .post('/')
  .reply(200, function (uri, requestBody) {
    console.log('REQUEST HEADERS:', this.req.headers)
    console.log('REQUEST BODY:', JSON.parse(requestBody))
  })

/**
 * Request Overhead
 */
describe('Print the Kinesis HTTP request', () => {
  afterEach(() => {
    nock.cleanAll()
    console.log('*****************************', '\n')
  })

  it('using separate putRecord requests', async () => {
    console.log('******* SINGLE RECORDS *******', '\n')
    kinesisSuccessWithLogging()

    await sendSeparateRecords(['0', '1', '2', '3', '4'])
  })

  it('using a batch putRecords request', async () => {
    console.log('*********** BATCH ***********', '\n')
    kinesisSuccessWithLogging()

    await sendRecordsInABatch(['0', '1', '2', '3', '4'])
  })
})
