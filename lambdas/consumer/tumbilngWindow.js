const countOccurrences = (prevKeyCounts, keys) => keys.reduce((keyCount, key) => {
  keyCount[key] = ++keyCount[key] || 1
  return keyCount
}, prevKeyCounts || {})


exports.countKeys = (kinesisEvent) => {
  const { state, isFinalInvokeForWindow, window } = kinesisEvent

  console.log('CURRENT STATE:', state.keyCounts)

  if (isFinalInvokeForWindow) {
    console.log('LAST ONE, this is what we have aggregated in this window:', state)
    console.log('CURRENT WINDOW:', window)
  }

  const partitionKeys = kinesisEvent.Records.map((record) => record.kinesis.partitionKey)
  return countOccurrences(state.keyCounts, partitionKeys)
}
