import { AzureFunction, Context } from "@azure/functions";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

const queueTrigger: AzureFunction = async function (
  context: Context,
  processQueueItem: { id: string; image: string }
): Promise<void> {
  context.log("Processing processQueueItem: ", processQueueItem);
  try {
    const { id, image } = processQueueItem;

    const imageData = Buffer.from(image, "base64");

    const computerVisionClient = new ComputerVisionClient(
      new ApiKeyCredentials({
        inHeader: {
          "Ocp-Apim-Subscription-Key": process.env.PSR_COMPUTER_VISION_KEY,
        },
      }),
      process.env.PSR_COMPUTER_VISION_ENDPOINT
    );

    const result = await computerVisionClient.analyzeImageInStream(imageData, {
      visualFeatures: ["Description"]
    });

    const caption = result?.description?.captions[0]?.text || null;
    const confidence = result?.description?.captions[0]?.confidence || null;

    context.log(
      "Generated caption: ",
      { caption },
      "with confidence: ",
      { confidence },
      "for image: ",
      context.bindingData.blobTrigger
    );

    context.bindings.notificationQueue = JSON.stringify({
      id,
      caption,
      confidence,
      blobTrigger: context.bindingData.blobTrigger,
    });
  } catch (error) {
    context.log("Unable to process image", error);
  }
};

export default queueTrigger;
