# Mastering AWS Kinesis Data Streams

Hello and welcome! Here you can find all the code from O'Reilly's **['Mastering AWS Kinesis Data Streams'](https://learning.oreilly.com/attend/mastering-aws-kinesis-data-streams/0636920059729/0636920059728/)** online training course.

The AWS infrastructure is created and managed by [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html). The application code is in TypeScript.

## Prerequisites
* Node.js 16.x
* npm
* TypeScript 2.7 or later (`npm -g install typescript`)
* AWS CLI
  * Configure AWS account credentials and region (`aws configure`)
* AWS CDK (`npm install -g aws-cdk`)
  * Bootstrap CDK resourses (`cdk bootstrap aws://ACCOUNT-NUMBER/REGION`)

## Useful CDK commands

 * `npm install`     install project dependencies 
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emit the synthesized CloudFormation template
 * `cdk destroy`     destroy this stack from your AWS account

## Lambda functions

The two lambda functions that act as a Kinesis producer and a Kinesis consumer are in the `lambdas` directory. The lambda code itself is Node.js.

### Lambda Tests

For the demonstration purposes, there are several [Mocha](https://mochajs.org/) tests written for the producer Lambda. They use [Nock](https://github.com/nock/nock) to mock the Kinesis HTTP responses.

To run individual test files, from the `producer` directory run
```
  npm i
  npm t test/<test_file_name>
```

You can also run all the tests at once:
```
  npm it
```

### Deploying lambdas

From the corresponding lambda directories, run
```
  npm i --production
```

After that, the actual deployment is handled by the CDK, along with the rest of the AWS resources (`cdk deploy` from the root directory).
