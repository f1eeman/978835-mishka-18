var popup = document.querySelector(".modal-cart");
var link = document.querySelector(".popular-item__to-order");
var overlay = document.querySelector(".modal-overlay")

link.addEventListener("click", function (evt) {
  evt.preventDefault();
  popup.classList.add("modal-cart__show");
  overlay.classList.add("modal-overlay__show");
});

window.addEventListener("keydown", function(evt) {
  if (evt.keyCode === 27 && popup.classList.contains("modal-cart__show")) {
    evt.preventDefault();
    popup.classList.remove("modal-cart__show");
    overlay.classList.remove("modal-overlay__show");
  }
});

overlay.addEventListener("click", function (evt) {
  evt.preventDefault();
  popup.classList.remove("modal-cart__show");
  overlay.classList.remove("modal-overlay__show");
});
