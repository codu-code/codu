exports.handler = async function (event, context) {
    console.log("Lambda running");
  
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/json" },
      body: "Hello world!",
    };
  };
  