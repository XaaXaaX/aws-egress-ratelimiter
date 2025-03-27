import { SNSEvent } from "aws-lambda";

export const handler = async (event:SNSEvent) => {
  console.log({ ...event });
  return {
    statusCode: 200,
    body: JSON.stringify('Hello World'),
  };
}