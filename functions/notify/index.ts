import { TableClient } from "@azure/data-tables";
import { AzureFunction, Context } from "@azure/functions";
import { EmailClient } from "@azure/communication-email";

const queueTrigger: AzureFunction = async function (
  context: Context,
  notificationData: { id: string; caption: string; confidence: number }
): Promise<void> {
  context.log("Queue trigger function processed work item", notificationData);

  const connectionString = process.env.PSR_STORAGE_ACCOUNT_DB_CONNECTION_STRING;
  const tableName = process.env.PSR_STORAGE_ACCOUNT_DB_TABLE_NAME;
  const tableClient = TableClient.fromConnectionString(connectionString, tableName);

  const notificationEntity = await tableClient.getEntity("pk", notificationData.id);

  const { email } : any = notificationEntity;
  const senderAddress = "DoNotReply@bb868c70-ba5a-4681-b176-90c957cf6d37.azurecomm.net";

  const messageText = notificationData.caption
    ? `We found '${notificationData.caption}' in your photo with ${(notificationData.confidence * 100).toFixed(2)}% confidence.`
    : "We couldn't recognize your photo.";

  context.log(`Sending email to ${email}: ${messageText}`);

  try {
    // context.log("KEY: ", process.env.PSR_COMMUNICATION_SERVICE_CONNECTION_STRING);
    const emailClient = new EmailClient(
      process.env.PSR_COMMUNICATION_SERVICE_CONNECTION_STRING
    );
    const poller = await emailClient.beginSend({
      senderAddress: senderAddress,
      content: {
        subject: "Image recognition result",
        plainText: messageText,
      },
      recipients: { to: [ { address: email } ] },
    });
    const response = await poller.pollUntilDone();
    context.log("Email sent: ", response);
  } catch (error) {
    context.log("Unable to send Email: ", error);
  }
};

export default queueTrigger;
