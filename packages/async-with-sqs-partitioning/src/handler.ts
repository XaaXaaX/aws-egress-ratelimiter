import { SQSEvent, SQSRecord } from "aws-lambda";

export const handler = async (event: SQSEvent) => {
  const records = (event.Records as SQSRecord[]).sort((a, b) => {
    return a.attributes.ApproximateFirstReceiveTimestamp.localeCompare(b.attributes.ApproximateFirstReceiveTimestamp);
  }).map((record) => {
    return { ...record, body: JSON.parse(record.body) }
  });

  let grouped = records.reduce(
    (result:any, currentValue:any) => {
      (result[currentValue.body['subject']] = result[currentValue.body['subject']] || []).push(currentValue);
      return result;
    }, {});

  
  const results: SQSRecord[] = [];
  
  Object.entries(grouped).forEach((entry) => {
    let key = entry?.[0];
    let entryValues = entry?.[1] as any[];
    let result = entryValues?.splice(0,1)?.[0];
    const initialType = result.body.type;

    entryValues.forEach((current: any) => {
        console.log(`${key} : ${current.body.type}`)
        const currentData = current.body.data;
        const currentType = current.body.type;

        if(initialType == 'user.signedup') {
          if(currentType == 'user.profile_updated') {
            result.body.data.profile.age = currentData.age;
            result.body.data.profile.nickname = currentData.nickname;
            result.body.data.profile.prefered_channels = currentData.prefered_channels;
          }
          else if(currentType == 'user.unsubscribed') {
              result = null;
          }
        }
    });
    results.push(result);
  });

  results.forEach((result) => { console.log(result); });
}