import { KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";

export const handler = async (event: KinesisStreamEvent) => {
  
  const records = (event.Records as KinesisStreamRecord[])
    .sort((a, b) => a.kinesis?.sequenceNumber.localeCompare(b.kinesis?.sequenceNumber));

  const grouped = Object.entries(
    Object.groupBy(records, (currentValue: KinesisStreamRecord) => currentValue.kinesis.partitionKey)
  );
  
  const results: Record<string, any>[] = [];
  
  grouped.forEach((entry) => {
    let key = entry?.[0];
    let entryValues = entry?.[1] as KinesisStreamRecord[];
    let firstEvent = entryValues?.splice(0,1)?.[0];
    let data: Record<string, any> = JSON.parse(Buffer.from(firstEvent.kinesis.data, 'base64').toString());
    const initialType = data.type;

    entryValues.forEach((currentEntry: KinesisStreamRecord) => {
      const current = JSON.parse(Buffer.from(currentEntry.kinesis.data, 'base64').toString());
      const currentData = current.data;
      const currentType = current.type;
      console.log(`${key} : ${currentType}`)
      
      if(initialType == 'user.signedup') {
        if(currentType == 'user.profile_updated') {
          data.profile = {
            ...data.profile,
            age: currentData.age,
            nickname: currentData.nickname,
            prefered_channels: currentData.prefered_channels
          }
        }
        else if(currentType == 'user.unsubscribed') {
          data = {};
        }
      }
    });
    results.push(data);
  });

  results.forEach((result) => { console.log(result); });
}