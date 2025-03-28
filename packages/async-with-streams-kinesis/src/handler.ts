import { KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";

export const handler = async (event: KinesisStreamEvent) => {
  console.log(event);
  const records = (event.Records as KinesisStreamRecord[]).sort((a, b) => 
    a.kinesis?.sequenceNumber.localeCompare(b.kinesis?.sequenceNumber)
  );

  console.log(records);

  let grouped = records.reduce(
    (result:any, currentValue:any) => {
      (result[currentValue.kinesis?.partitionKey] = result[currentValue.kinesis?.partitionKey] || []).push(currentValue);
      return result;
    }, {});

  
  const results: any[] = [];
  
  Object.entries(grouped).forEach((entry) => {
    let key = entry?.[0];
    let entryValues = entry?.[1] as KinesisStreamRecord[];
    let result = entryValues?.splice(0,1)?.[0];
    let data: Record<string, any> = JSON.parse(Buffer.from(result.kinesis.data, 'base64').toString());
    const initialType = data.type;
    console.log("data: ",data);
    entryValues.forEach((currentEntry: any) => {
      const current = JSON.parse(Buffer.from(currentEntry.kinesis.data, 'base64').toString());
      const currentData = current.data;
      const currentType = current.type;
      console.log(`${key} : ${currentType}`)
      console.log("currenct data", currentData);
      if(initialType == 'user.signedup') {
        if(currentType == 'user.profile_updated') {
          data.profile.age = currentData.age;
          data.profile.nickname = currentData.nickname;
          data.profile.prefered_channels = currentData.prefered_channels;
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