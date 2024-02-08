const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const ssmClient = new SSMClient({ region: "eu-west-1" });

async function getSecretValue(secretName) {
  const params = {
    Name: secretName,
    WithDecryption: true,
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

exports.handler = async function (event, context) {
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
