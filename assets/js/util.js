ko.bindingHandlers.fileUpload = {
  init: function (element, valueAccessor) {
    $(element).on("change", function () {
      valueAccessor()(element.files[0]);
    });
  },
  update: function (element, valueAccessor) {
    if (ko.unwrap(valueAccessor()) === null) {
      $(element).wrap("<form>").closest("form").get(0).reset();
      $(element).unwrap();
    }
  },
};

function _convert(v, from, to){
    return math.unit(parseFloat(v), from).toNumber(to);
}

function _foreach(arr, fn) {
    return ko.utils.arrayMap(arr, fn)
}

const ORDINAL_SUFFIXES = {1: "st", 2: "nd", 3: "rd"}
