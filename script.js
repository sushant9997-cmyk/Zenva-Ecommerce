const KEYS = {
    products: "zenva-products",
    cart: "zenva-cart",
    wishlist: "zenva-wishlist",
    user: "zenva-user",
    orders: "zenva-orders"
};

const starterProducts = [
    { id: 1, name: "Classic Blue Shirt", price: 999, category: "Men", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85", sizes: ["S", "M", "L", "XL"], colors: ["White", "Blue"], badge: "BESTSELLER" },
    {
        id: 2,
        name: "Premium T-Shirt",
        price: 499,
        category: "Men",
        image: "images/black.jpg.jpeg",

        sizes: ["S", "M", "L", "XL"],

        colors: ["Black", "White", "Beige"],

        colorImages: {
            Black: "images/black.jpg.jpeg",
            White: "images/white.jpg.jpeg",
            Beige: "images/beige.jpg.jpeg"
        }
    },
    { id: 3, name: "Elegant Summer Dress", price: 2499, category: "Women", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85", sizes: ["S", "M", "L"], colors: ["Beige", "Black"], badge: "NEW" },
    { id: 4, name: "Denim Jacket", price: 699, category: "Men", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85", sizes: ["S", "M", "L", "XL"], colors: ["Blue", "Black"] },
    { id: 5, name: "Women's Casual Outfit", price: 1299, category: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85", sizes: ["S", "M", "L"], colors: ["Beige", "White", "Black"] },
    { id: 6, name: "Classic Sunglasses", price: 399, category: "Accessories", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85", sizes: ["One Size"], colors: ["Black", "Brown"] },
    { id: 7, name: "Fashion Handbag", price: 1199, category: "Accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85", sizes: ["One Size"], colors: ["Beige", "Black", "Brown"] },
    { id: 8, name: "Casual Sneakers", price: 799, category: "Accessories", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", sizes: ["S", "M", "L", "XL"], colors: ["White", "Black"] }
];

function load(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

const save = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n).toLocaleString("en-IN");

function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));
}

let products = load(KEYS.products, starterProducts);
let cart = load(KEYS.cart, []);
let wishlist = load(KEYS.wishlist, []);
let orders = load(KEYS.orders, []);
let currentUser = load(KEYS.user, null);

let activeCategory = "All";
let selectedProduct = null;
let selectedSize = "M";
let selectedColor = "Black";
let detailQuantity = 1;

function showToast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
}

function updateCounts() {
    $("cart-count").textContent =
        cart.reduce((sum, item) => sum + item.quantity, 0);

    $("wishlist-count").textContent = wishlist.length;
}

function getProduct(id) {
    return products.find(p => p.id === Number(id));
}

function getProductImage(product, color) {
    return product.colorImages[color] || product.image;
}

/* PRODUCT SEARCH AND FILTERS */

function getFilteredProducts() {
    const search = $("search-input").value.trim().toLowerCase();
    const price = $("price-filter").value;
    const size = $("size-filter").value;
    const color = $("color-filter").value;

    let result = products.filter(product => {
        const text = (product.name + " " + product.category).toLowerCase();

        return (
            (activeCategory.toLowerCase() === "all" || String(product.category).trim().toLowerCase() === activeCategory.trim().toLowerCase()) &&
            (!search || text.includes(search)) &&
            (price === "all" || product.price < Number(price)) &&
            (size === "all" || (product.sizes || []).includes(size)) &&
            (color === "all" || (product.colors || []).includes(color))
        );
    });

    const sort = $("sort-filter").value;

    if (sort === "low-high") {
        result.sort((a, b) => a.price - b.price);
    } else if (sort === "high-low") {
        result.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
}

function displayProducts() {
    const result = getFilteredProducts();

    $("results-count").textContent =
        result.length + " product(s)";

    $("no-results").classList.toggle("hidden", result.length !== 0);

    $("product-list").innerHTML = result.map(product => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image"
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}">

        ${product.badge ? '<span class="product-badge">' + escapeHTML(product.badge) + '</span>' : ""}

        <button class="wishlist-heart"
          onclick="toggleWishlist(${product.id})">
          ${wishlist.includes(product.id) ? "♥️" : "♡"}
        </button>
      </div>

      <div class="product-info">
        <div class="product-category">${escapeHTML(product.category)}</div>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-price">${money(product.price)}</div>

        <div class="product-actions">
          <button class="small-action"
            onclick="openProductDetails(${product.id})">
            VIEW DETAILS
          </button>

          <button class="small-action primary"
            onclick="addToCart(${product.id})">
            ADD TO BAG
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

/* WISHLIST */

function toggleWishlist(id) {
    id = Number(id);

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
        showToast("Removed from wishlist");
    } else {
        wishlist.push(id);
        showToast("Added to wishlist");
    }

    save(KEYS.wishlist, wishlist);
    updateCounts();
    displayProducts();
    renderWishlist();
}

function renderWishlist() {
    const savedProducts = products.filter(p => wishlist.includes(p.id));

    $("wishlist-products").innerHTML = savedProducts.length ?
        savedProducts.map(p => `
      <div class="wishlist-card">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
        <h3>${escapeHTML(p.name)}</h3>
        <p>${money(p.price)}</p>
        <div class="wishlist-card-actions">
          <button onclick="addToCart(${p.id})">ADD TO BAG</button>
          <button onclick="toggleWishlist(${p.id})">REMOVE</button>
        </div>
      </div>
    `).join("") :
        "<p>Your wishlist is empty ♡</p>";
}

/* SHOPPING CART */

function addToCart(id, quantity = 1, size = "M", color = "Black") {
    const product = getProduct(id);

    if (!product) return;

    const existing = cart.find(item =>
        item.id === product.id &&
        item.size === size &&
        item.color === color
    );

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: product.id, quantity, size, color });
    }

    save(KEYS.cart, cart);
    updateCounts();
    renderCart();
    showToast("Added to your bag");
}

function cartSubtotal() {
    return cart.reduce((sum, item) => {
        const product = getProduct(item.id);
        return sum + ((product?.price || 0) * item.quantity);
    }, 0);
}

function renderCart() {

    if (!cart.length) {
        $("cart-items").innerHTML = "<p>Your bag is empty.</p>";
        $("cart-total").textContent = money(0);
        return;
    }

    $("cart-items").innerHTML = cart.map(item => {

        const product = getProduct(item.id);

        if (!product) return "";

        const productImage = getProductImage(
            product,
            item.color
        );

        return `
      <div class="cart-item">

        <img
          src="${escapeHTML(productImage)}"
          alt="${escapeHTML(product.name)}"
        >

        <div>

          <h4>${escapeHTML(product.name)}</h4>

          <p>
            Size: ${escapeHTML(item.size)}
          </p>

          <p>
            Colour: ${escapeHTML(item.color)}
          </p>

          <p>${money(product.price)}</p>

          <div class="quantity-control">

            <button onclick="changeQuantity(
              ${product.id}, -1,
              '${escapeHTML(item.size)}',
              '${escapeHTML(item.color)}'
            )">−</button>

            <span>${item.quantity}</span>

            <button onclick="changeQuantity(
              ${product.id}, 1,
              '${escapeHTML(item.size)}',
              '${escapeHTML(item.color)}'
            )">+</button>

          </div>

        </div>

        <button
          class="remove-item"
          onclick="removeFromCart(
            ${product.id},
            '${escapeHTML(item.size)}',
            '${escapeHTML(item.color)}'
          )">
          REMOVE
        </button>

      </div>
    `;

    }).join("");

    $("cart-total").textContent = money(cartSubtotal());
}

function changeQuantity(id, change, size, color) {
    const item = cart.find(x =>
        x.id === Number(id) && x.size === size && x.color === color
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(x => x !== item);
    }

    save(KEYS.cart, cart);
    updateCounts();
    renderCart();
}

function removeFromCart(id, size, color) {
    cart = cart.filter(item =>
        !(item.id === Number(id) && item.size === size && item.color === color)
    );

    save(KEYS.cart, cart);
    updateCounts();
    renderCart();
}

function openCart() {
    $("cart-drawer").classList.add("active");
    $("cart-overlay").classList.add("active");
    renderCart();
}

function closeCart() {
    $("cart-drawer").classList.remove("active");
    $("cart-overlay").classList.remove("active");
}

/* PRODUCT DETAILS */

function openProductDetails(id) {
    selectedProduct = getProduct(id);
    if (!selectedProduct) return;

    selectedSize = (selectedProduct.sizes || ["S", "M", "L", "XL"])[0];
    selectedColor = (selectedProduct.colors || ["Black"])[0];
    detailQuantity = 1;

    renderProductDetails();
    $("product-modal").classList.add("active");
}

function renderProductDetails() {
    const p = selectedProduct;

    $("product-detail-content").innerHTML = `
    <div class="detail-layout">

      <img
        src="${escapeHTML(getProductImage(p, selectedColor))}"
        alt="${escapeHTML(p.name)}"
        class="detail-product-image"
      >

      <div class="detail-copy">

        <p>${escapeHTML(p.category)}</p>

        <h2>${escapeHTML(p.name)}</h2>

        <h3>${money(p.price)}</h3>

        <p>
          Comfortable, versatile and made for everyday styling.
        </p>

        <h4>SELECT SIZE</h4>

        <div class="option-row">
          ${(p.sizes || ["S","M","L","XL"]).map(s => `
            <button
              class="option-button ${s === selectedSize ? "selected" : ""}"
              onclick="selectOption('size','${s}')">
              ${s}
            </button>
          `).join("")}
        </div>

        <h4>SELECT COLOUR</h4>

        <div class="option-row">
          ${(p.colors || ["Black","White","Beige"]).map(c => `
            <button
              class="option-button ${c === selectedColor ? "selected" : ""}"
              onclick="selectOption('color','${c}')">
              ${c}
            </button>
          `).join("")}
        </div>

        <div class="detail-quantity">
          <button onclick="changeDetailQuantity(-1)">−</button>

          <strong>${detailQuantity}</strong>

          <button onclick="changeDetailQuantity(1)">+</button>
        </div>

        <button
          class="button full-width"
          onclick="addDetailToCart()">
          ADD TO BAG
        </button>

      </div>
    </div>
  `;
}

function selectOption(type, value) {
  if (type === "size"){ selectedSize = value;
}
if (type =="color"){ selectedColor = value;
}

  renderProductDetails();
}

function changeDetailQuantity(change) {
  detailQuantity = Math.max(1, detailQuantity + change);
  renderProductDetails();
}

function addDetailToCart() {
  addToCart(selectedProduct.id, detailQuantity, selectedSize, selectedColor);
  closeModal("product-modal");
  openCart();
}

/* MODALS */

function openModal(id) {
  $(id).classList.add("active");
}

function closeModal(id) {
  $(id).classList.remove("active");
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal.id);
  });
});

/* LOGIN AND REGISTRATION - DEMO ONLY */

function setAuthMode(mode) {
  const login = mode === "login";

  $("login-form").classList.toggle("hidden", !login);
  $("register-form").classList.toggle("hidden", login);
}

function refreshAuth() {
  if (currentUser) {
    $("auth-title").textContent = "Hello, " + currentUser.name;
    $("login-form").classList.add("hidden");
    $("register-form").classList.add("hidden");
    $("logout-button").classList.remove("hidden");
  } else {
    $("auth-title").textContent = "Your Account";
    $("logout-button").classList.add("hidden");
    setAuthMode("login");
  }
}

$("account-button").addEventListener("click", () => {
  refreshAuth();
  openModal("auth-modal");
});

$("login-tab").addEventListener("click", () => setAuthMode("login"));
$("register-tab").addEventListener("click", () => setAuthMode("register"));

$("login-form").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("login-email").value.trim();

  currentUser = {
    name: email.split("@")[0],
    email
  };

  save(KEYS.user, currentUser);
  refreshAuth();
  showToast("login successful");
});

$("register-form").addEventListener("submit", event => {
  event.preventDefault();

  currentUser = {
    name: $("register-name").value.trim(),
    email: $("register-email").value.trim()
  };

  save(KEYS.user, currentUser);
  refreshAuth();
  showToast("Account created");
});

$("logout-button").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(KEYS.user);
  refreshAuth();
  showToast("Logged out");
});

/* CHECKOUT */

function openCheckout() {
  if (!cart.length) {
    showToast("Your bag is empty");
    return;
  }

  closeCart();

  const subtotal = cartSubtotal();
  const shipping = subtotal >= 1999 ? 0 : 99;

  $("checkout-summary").innerHTML = `
    <p>Subtotal: ${money(subtotal)}</p>
    <p>Shipping: ${shipping ? money(shipping) : "FREE"}</p>
    <h3>Total: ${money(subtotal + shipping)}</h3>
  `;

  if (currentUser) {
    $("shipping-name").value = currentUser.name;
    $("shipping-email").value = currentUser.email;
  }

  openModal("checkout-modal");
}

$("checkout-form").addEventListener("submit", event => {
  event.preventDefault();

  const subtotal = cartSubtotal();
  const shipping = subtotal >= 1999 ? 0 : 99;

  const order = {
    id: "ZNV" + Date.now(),
    date: new Date().toLocaleString("en-IN"),
    items: [...cart],
    subtotal,
    shipping,
    total: subtotal + shipping,
    customer: $("shipping-name").value,
    email: $("shipping-email").value,
    payment: $("payment-method").value,
    status: "Processing"
  };

  orders.unshift(order);
  save(KEYS.orders, orders);

  cart = [];
  save(KEYS.cart, cart);
  updateCounts();
  renderCart();

  closeModal("checkout-modal");

  $("success-message").textContent =
    "order " + order.id + " has been placed. No real payment was collected.";

  openModal("success-modal");
  event.target.reset();
});

/* ORDER HISTORY */

function renderOrders() {
  const container = document.getElementById("orders-list");

  if (!orders.length) {
    container.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <strong>Order ${escapeHTML(order.id)}</strong>

      <p>${escapeHTML(order.date)}</p>

      <p>
        Total: ${money(order.total)}
        — Status: ${escapeHTML(order.status)}
      </p>

      <div>
        ${order.items.map(item => {
          const product = getProduct(item.id);
          const productName = product
            ? escapeHTML(product.name)
            : "Product";

          return `
            <p>
              ${productName} × ${item.quantity}
            </p>
          `;
        }).join("")}
      </div>

      ${
        order.status !== "Cancelled"
          ? `<button onclick="cancelOrder('${escapeHTML(order.id)}')">
               CANCEL ORDER
             </button>`
          : "<p>Order cancelled</p>"
      }
    </div>
  `).join("");
}

function cancelOrder(id) {
  const order = orders.find(x => x.id === id);

  if (!order) return;

  order.status = "Cancelled";
  save(KEYS.orders, orders);
  renderOrders();
  showToast("Order cancelled");
}

$("footer-orders").addEventListener("click", event => {
  event.preventDefault();
  renderOrders();
  openModal("orders-modal");
});

/* ADMIN DASHBOARD  */

function renderAdmin() {
  $("admin-stats").innerHTML = `
    <p>Products: ${products.length}</p>
    <p>Orders: ${orders.length}</p>
  `;

  $("admin-product-list").innerHTML = products.map(p => `
    <div class="admin-row">
      <span>${escapeHTML(p.name)} — ${money(p.price)}</span>
      <button onclick="deleteProduct(${p.id})">DELETE</button>
    </div>
  `).join("");

  $("admin-orders").innerHTML = orders.map(o => `
    <div class="admin-row">
      ${escapeHTML(o.id)} — ${money(o.total)} — ${escapeHTML(o.status)}
    </div>
  `).join("");
}

$("admin-button").addEventListener("click", () => {
  renderAdmin();
  openModal("admin-modal");
});

$("admin-product-form").addEventListener("submit", event => {
  event.preventDefault();

  const product = {
    id: Date.now(),
    name: $("admin-name").value.trim(),
    price: Number($("admin-price").value),
    category: $("admin-category").value,
    image: $("admin-image").value.trim(),
    sizes: ["S","M","L","XL"],
    colors: ["Black","White","Beige"],
    badge: "NEW"
  };

  products.push(product);
  save(KEYS.products, products);

  event.target.reset();
  displayProducts();
  renderAdmin();
  showToast("Product added");
});

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  products = products.filter(p => p.id !== Number(id));
  wishlist = wishlist.filter(x => x !== Number(id));
  cart = cart.filter(x => x.id !== Number(id));

  save(KEYS.products, products);
  save(KEYS.wishlist, wishlist);
  save(KEYS.cart, cart);

  updateCounts();
  displayProducts();
  renderCart();
  renderAdmin();
}

/* CATEGORY FILTERS */

document.addEventListener("click", function(event) {

  const button = event.target.closest(
    "[data-category], [data-category-link]"
  );

  if (!button) return;

  event.preventDefault();

  activeCategory =
    button.dataset.category ||
    button.dataset.categoryLink ||
    "All";

  document.querySelectorAll(".category-button").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.category === activeCategory
    );
  });

  displayProducts();

  document.getElementById("products").scrollIntoView({
    behavior: "smooth"
  });

});

document.querySelectorAll("[data-category-link]").forEach(link => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.categoryLink;

    document.querySelectorAll(".category-button").forEach(button =>
      button.classList.toggle(
        "active",
        button.dataset.category === activeCategory
      )
    );

    displayProducts();
  });
});

/* SEARCH AND FILTER EVENTS */

$("search-input").addEventListener("input", displayProducts);

["price-filter","size-filter","color-filter","sort-filter"].forEach(id => {
  $(id).addEventListener("change", displayProducts);
});

$("clear-filters").addEventListener("click", () => {
  $("search-input").value = "";
  $("price-filter").value = "all";
  $("size-filter").value = "all";
  $("color-filter").value = "all";
  $("sort-filter").value = "default";

  activeCategory = "All";

  document.querySelectorAll(".category-button").forEach(button =>
    button.classList.toggle("active", button.dataset.category === "All")
  );

  displayProducts();
});

/* BUTTON EVENTS */

$("cart-button").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
$("cart-overlay").addEventListener("click", closeCart);
$("checkout-btn").addEventListener("click", openCheckout);

$("wishlist-button").addEventListener("click", () => {
  renderWishlist();
  openModal("wishlist-modal");
});

/* ESCAPE KEY */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal.active").forEach(modal => {
      modal.classList.remove("active");
    });

    closeCart();
  }
});

/* INITIALIZE WEBSITE */

updateCounts();
displayProducts();
renderCart();