module.exports = (model_name, models) => {
  for (const model of models) {
    if (model.name === model_name) {
      return model.value;
    }else{
      return "b7aa9939-abed-4d4e-96c4-140b8c65dd92";
    }
  }
  return "-"; // Return null if no model with the given value is found
};
