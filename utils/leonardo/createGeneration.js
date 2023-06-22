const sdk = require("api")("@leonardoai/v1.0#28807z41owlgnis8jg");
require("dotenv").config();

module.exports = async (
  prompt,
  negative_prompt,
  model,
  width,
  height,
  promptMagic,
  count,
  interaction
) => {
  sdk.auth(process.env.LEONARDO_API_KEY);
  try {
    const { data } = await sdk.createGeneration({
      prompt: prompt,
      negative_prompt: negative_prompt,
      modelId: model,
      num_images: count,
      width: width || 640,
      height: height || 832,
      public: false,
      guidance_scale: 7,
      presetStyle: "LEONARDO",
      promptMagic: promptMagic,
    });
    const id_generations = data.sdGenerationJob.generationId;
    return id_generations;

  } catch (err) {
    console.log(err.data['error']);
    await interaction.editReply({
      content:
        "The prompt you provided contains NSFW (Not Safe for Work) content. Please provide a different prompt.",
    });
    return err;
  }
};
