import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
const ssmClient = new SSMClient({ region: "eu-west-1" });

async function getSecretValue(secretName: string) {
  const params = {
    Name: secretName,
    WithDecryption: true, // Required for secureString
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter not found: ${secretName}`);
    }
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

exports.handler = async function () {
  console.log("Lambda running");

  try {
    const result = await getSecretValue("/env/algoliaIdx");
    console.log("Parameter Value:", result);
  } catch (error) {
    console.error("Error fetching parameter:", error);
    // Handle the error accordingly
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/json" },
    body: "Hello world!",
  };
};
