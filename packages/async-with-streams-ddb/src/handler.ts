import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from "@aws-sdk/client-dynamodb"

type DynamoDbInternalRecord = { [key: string]: AttributeValue }

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log(event);
  const records = (event.Records as DynamoDBRecord[]).sort((a, b) => 
    (a.dynamodb?.ApproximateCreationDateTime || 0) - (b.dynamodb?.ApproximateCreationDateTime || 0)
  );

  let grouped = records.reduce(
    (result:any, currentValue:any) => {
      (result[currentValue.dynamodb?.Keys?.pk.S] = result[currentValue.dynamodb?.Keys?.pk.S] || []).push(currentValue);
      return result;
    }, {});

  
  const results: any[] = [];
  
  Object.entries(grouped).forEach((entry) => {
    let key = entry?.[0];
    let entryValues = entry?.[1] as DynamoDBRecord[];
    let result = entryValues?.splice(0,1)?.[0];
    const initialType = result.eventName;

    let data: Record<string, any> = {};
    if(initialType == 'INSERT' || initialType == 'MODIFY')
     data = unmarshall(result.dynamodb?.NewImage as DynamoDbInternalRecord);
     if(initialType == 'REMOVE') {
      data = unmarshall(result.dynamodb?.OldImage as DynamoDbInternalRecord);
     }


    entryValues.forEach((current: any) => {
      const currentType = current.eventName;
      const currentData = unmarshall(current.dynamodb?.NewImage as DynamoDbInternalRecord);
      console.log(`${key} : ${currentData.sk} ${currentType}`)
    
      if(initialType == 'INSERT') {
        if(currentType == 'MODIFY') {
          data.age = currentData.age;
          data.nickname = currentData.nickname;
          data.prefered_channels = currentData.prefered_channels;
        }
        else if(currentType == 'REMOVE') {
          data = {};
        }
      }
    });
    results.push(data);
  });

  results.forEach((result) => { console.log(result); });
}