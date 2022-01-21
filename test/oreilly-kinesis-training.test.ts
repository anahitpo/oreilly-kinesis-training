import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { App } from 'aws-cdk-lib';
import * as OreillyKinesisTraining from '../lib/oreilly-kinesis-training-stack';

test('Not Empty Stack', () => {
    const app = new App();
    // WHEN
    const stack = new OreillyKinesisTraining.OreillyKinesisTrainingStack(app, 'OreillyKinesisTrainingStack');
    // THEN
    expectCDK(stack).notTo(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
