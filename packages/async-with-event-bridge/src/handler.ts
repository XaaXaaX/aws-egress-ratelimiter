import { LambdaFunctionURLEvent } from "aws-lambda";

export const handler = async (event: LambdaFunctionURLEvent) => {
  console.log({ ...event });
  return {
    statusCode: 200,
    body: JSON.stringify('Hello World'),
  };
}