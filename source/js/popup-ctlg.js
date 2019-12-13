var cartPopup = document.querySelector(".modal-cart");
var cartOverlay = document.querySelector(".modal-overlay")
var elements = document.querySelectorAll(".product__add-to-cart");

for (var i = 0; i < elements.length; i++) {
  var element = elements[i];
  element.addEventListener("click", function (evt) {
  evt.preventDefault();
  cartPopup.classList.add("modal-cart__show");
  cartOverlay.classList.add("modal-overlay__show");
  });
};

window.addEventListener("keydown", function(evt) {
  if (evt.keyCode === 27 && cartPopup.classList.contains("modal-cart__show")) {
      evt.preventDefault();
      cartPopup.classList.remove("modal-cart__show");
      cartOverlay.classList.remove("modal-overlay__show");
  }
});

cartOverlay.addEventListener("click", function (evt) {
  evt.preventDefault();
  cartPopup.classList.remove("modal-cart__show");
  cartOverlay.classList.remove("modal-overlay__show");
});
