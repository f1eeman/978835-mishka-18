var slider = function () {
  var elements = document.querySelectorAll(".product__add-to-cart");
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    element.addEventListener("click", function (evt) {
      evt.preventDefault();
      cartPopup.classList.add("modal-cart__show");
      cartOverlay.classList.add("modal-overlay__show");
    });
  }
};
