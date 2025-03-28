import { SQSEvent, SQSRecord } from "aws-lambda";

type recordType = SQSRecord & { body: { subject: string, type: string, data: any } };
export const handler = async (event: SQSEvent) => {

  const records = (event.Records as SQSRecord[])
    .sort((a, b) => { return a.attributes.ApproximateFirstReceiveTimestamp.localeCompare(b.attributes.ApproximateFirstReceiveTimestamp); })
    .map((record) => { return { ...record, body: JSON.parse(record.body) }});

  const grouped = Object.entries(
    Object.groupBy(records, (currentValue: recordType) => currentValue.body.subject)
  );

  const results: SQSRecord[] = [];
  
  grouped.forEach((entry) => {
    const entryValues = entry?.[1] as any[];
    let firstEvent = entryValues?.splice(0,1)?.[0];
    const initialType = firstEvent.body.type;

    entryValues.forEach((current: any) => {
        const currentData = current.body.data;
        const currentType = current.body.type;

        if(initialType == 'user.signedup') {
          if(currentType == 'user.profile_updated') {
            firstEvent.body.data.profile = {
              ...firstEvent.body.data.profile, 
              age: currentData.age,
              nickname : currentData.nickname,
              prefered_channels: currentData.prefered_channels
            };
          }
          else if(currentType == 'user.unsubscribed') {
              firstEvent = null;
          }
        }
    });
    results.push(firstEvent);
  });

  results.forEach((result) => { console.log(result); });
}