import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as OreillyKinesisTraining from '../lib/oreilly-kinesis-training-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new OreillyKinesisTraining.OreillyKinesisTrainingStack(app, 'OreillyKinesisTrainingStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
