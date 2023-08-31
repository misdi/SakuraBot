module.exports = (model_name, models) => {
  for (const model of models) {
    if (model.name === model_name) {
      return model.value;
    }else{
      return "ac614f96-1082-45bf-be9d-757f2d31c174";
    }
  }
  return "-"; // Return null if no model with the given value is found
};
