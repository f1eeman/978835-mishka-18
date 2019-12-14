var navMain = document.querySelector('.main-nav');
var navToggle = document.querySelector('.main-nav__toggle');
var popup = document.querySelector(".modal-cart");
var link = document.querySelector(".popular-item__to-order");
var overlay = document.querySelector(".modal-overlay")
var elements = document.querySelectorAll(".product__add-to-cart");

navMain.classList.remove('main-nav--nojs');

navToggle.addEventListener('click', function() {
  if (navMain.classList.contains('main-nav--closed')) {
      navMain.classList.remove('main-nav--closed');
      navMain.classList.add('main-nav--opened');
  } else {
    navMain.classList.add('main-nav--closed');
    navMain.classList.remove('main-nav--opened');
  }
});

if (link) {
  link.addEventListener("click", function (evt) {
    evt.preventDefault();
    popup.classList.add("modal-cart__show");
    overlay.classList.add("modal-overlay__show");
  });
}
for (var i = 0; i < elements.length; i++) {
  var element = elements[i];
  element.addEventListener("click", function (evt) {
  evt.preventDefault();
  popup.classList.add("modal-cart__show");
  overlay.classList.add("modal-overlay__show");
  });
};

window.addEventListener("keydown", function(evt) {
  if (evt.keyCode === 27 && popup.classList.contains("modal-cart__show")) {
    evt.preventDefault();
    popup.classList.remove("modal-cart__show");
    overlay.classList.remove("modal-overlay__show");
  };
});

overlay.addEventListener("click", function (evt) {
  evt.preventDefault();
  popup.classList.remove("modal-cart__show");
  overlay.classList.remove("modal-overlay__show");
});
