import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse, getBoundary } from "parse-multipart-data";
import { TableClient } from "@azure/data-tables";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const bodyBuffer = Buffer.from(req.body);
  const boundary = getBoundary(req.headers["content-type"]);
  const parts = parse(bodyBuffer, boundary);

  if (!parts?.length) {
    context.res.body = "File buffer is incorrect";
    context.res.status = 400;
  }

  if (parts[0]?.filename)
    console.log(`Original filename = ${parts[0]?.filename}`);
  if (parts[0]?.type) console.log(`Content type = ${parts[0]?.type}`);
  if (parts[0]?.data?.length) console.log(`Size = ${parts[0]?.data?.length}`);

  try {
    let email = parts[1]?.data?.toString();

    if (!email) {
      context.res.body = "Email is required";
      context.res.status = 400;
      return;
    }

    context.log("Email: ", email);

    // context.bindings.storage = parts[0]?.data;

    const connectionString =
      process.env.PSR_STORAGE_ACCOUNT_DB_CONNECTION_STRING;
    const tableName = process.env.PSR_STORAGE_ACCOUNT_DB_TABLE_NAME;
    const client = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    context.log("TableClient created");

    const partitionKey = "pk";
    const rowKey = "rk" + Math.random().toString(36).substring(2, 5);

    const image = parts[0]?.data?.toString("base64");

    context.bindings.processQueue = JSON.stringify({
      id: rowKey,
      image,
    });

    const entity = {
      partitionKey,
      rowKey,
      email,
    };

    await client.createEntity(entity).catch((err) => {
      context.log(`Error creating entity: ${err}`);
    });

    context.res.body = {
      id: rowKey,
      filename: parts[0]?.filename,
      email: email,
    };

    context.log(`Upload complete for ${rowKey}`);
  } catch (error) {
    context.log("Unable to upload an image: ", error);
  }
};

export default httpTrigger;
