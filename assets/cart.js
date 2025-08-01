class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems =
        this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener("change", debouncedOnChange.bind(this));

    // Ensure these validations are called once on page load
    this.firstLoad = true;
    this.validateCartItems(); // Validate free gift and Beromaster on page load, special promo code and free shipping
  }

  async applySpecialPromos(cart) {

    if (!window.promotions) {
      console.log("Skipping special promo. Code and/or products are not set.");
      // pb+j 3/4/25 replacing free shipping from front end to custom extension app
      // this.applyFreeShippingDiscount();
      return;
    }

    try {
      // 23-5 Only 1 cart fetch in function params
      // const response = await fetch("/cart.js");
      // const cart = await response.json();

      let specialPromoCode = window.promotions.specialPromoCode;
      let specialPromoCode2 = window.promotions.specialPromoCode2;

      if (specialPromoCode) {
        console.log("Checking special promo 1");
        this.checkPromoParamInUrl(specialPromoCode);
        let hasPromo = this.checkPromotionProductsInCart(cart, 1);
        // console.log(hasPromo);
        if (hasPromo && sessionStorage.getItem('sp_pr') === specialPromoCode) {
          console.log("Adding special promo discount code 1");
          document.cookie = `discount_code=${specialPromoCode}; path=/; max-age=86400`;
        } else {
          console.log("Removing special promo discount code, if any");
          document.cookie = 'discount_code=wipe-promo-discounts; path=/; max-age=86400'
          // pb+j 3/4/25 replacing free shipping from front end to custom extension app
          // this.applyFreeShippingDiscount();
        }
      }

      if (specialPromoCode2) {
        console.log("Checking special promo 2");
        this.checkPromoParamInUrl(specialPromoCode2);
        let hasPromo = this.checkPromotionProductsInCart(cart, 2);
        // console.log(hasPromo);
        if (hasPromo && sessionStorage.getItem('sp_pr') === specialPromoCode2) {
          console.log("Adding special promo discount code 2");
          document.cookie = `discount_code=${specialPromoCode2}; path=/; max-age=86400`;
          // DO NOT REMOVE PROMO CODE 1!
        } else if (specialPromoCode && sessionStorage.getItem('sp_pr') === specialPromoCode) {
          console.log("Promo 1 already applied!");
        } else {
          console.log("Removing special promo discount code, if any");
          document.cookie = 'discount_code=wipe-promo-discounts; path=/; max-age=86400'
          // pb+j 3/4/25 replacing free shipping from front end to custom extension app
          // this.applyFreeShippingDiscount();
        }
      }

    } catch (error) {
      console.error("Error checking special promotions:", error);
    }

  }

  checkPromoParamInUrl(specialPromoCode) {
    // Sets a session storage item to know if the user landed on Bero with the special promo in the URL
    const urlParams = new URLSearchParams(window.location.search);
    // console.log(urlParams.get('promo'));
    // console.log(specialPromoCode);
    if (urlParams.get('promo') && urlParams.get('promo') === specialPromoCode) {
      console.log("User has the special promo param in the URL");
      sessionStorage.setItem('sp_pr', specialPromoCode);
    }
  }

  checkPromotionProductsInCart(cart, promoN) {
    let hasPromoProducts = false;
    let specialPromoProducts;

    if (promoN == 1) {
      specialPromoProducts = window.promotions.specialPromoProducts.trim().split(',');
    } else if (promoN == 2) {
      specialPromoProducts = window.promotions.specialPromoProducts2.trim().split(',');
    }

    specialPromoProducts.forEach(promoProduct => {
      let findProduct = cart.items.find(item => item.sku === promoProduct);
      if (typeof (findProduct) !== "undefined") {
        hasPromoProducts = true;
      };
    });

    return hasPromoProducts;
  }

  // pb+j 3/4/25 replacing free shipping from front end to custom extension app
  applyFreeShippingDiscount() {
    if (window.customer) {
      let discountCode = window.customer.shippingCodes.freeMember;
      if (window.customer.tags.includes("vip")) {
        discountCode = window.customer.shippingCodes.paidMember;
      }
      console.log('adding discount code', discountCode);

      console.log('adding discount code for logged in user');
      document.cookie = `discount_code=${discountCode}; path=/; max-age=86400`;

    } else {
      // If the customer is not logged in, apply another invalid discount code to clear any existing discounts
      console.log('adding discount code for non-logged in user');

      document.cookie = 'discount_code=wipe-shipping-discounts; path=/; max-age=86400'
    }
  }


  async validateCartItems() {
    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();
      await this.checkAndRemoveGWP(cart); // remove gifts from cart when loaded
      await this.applySpecialPromos(cart);  // Free shipping has been moved in here
      // await this.validateFreeGift(cart); // remove validate free gift, moved to liquid + app
      await this.checkBeromasterQuantity(cart);

      // Run both free gift validation, Beromaster validation, special promos and free shipping together
      
      // Trigger update cart for frontend modifications
      this.onCartUpdate();
      
    } catch (error) {
      console.error("Error validating cart items:", error);
    }

  }
  // 23-5-25 deprecated function, moved to liquid + app
  async validateFreeGift(cart) {
    if (window.Shopify.country != "US") {
      console.log("Skipping validateFreeGift: current country does not have GWP.");
      return;
    }

    if (!window.freeGift) {
      console.log("Skipping validateFreeGift: Free gift data is not set.");
      return;
    }

    if (this.isValidatingGift) {
      console.log("Skipping validateFreeGift: Validation is already in process.");
      return;
    }

    this.isValidatingGift = true; // Set the flag for validation process
    console.log("Running validateFreeGift");

    let freeGiftThreshold = window.freeGift.thresholds.freeMember;
    if (window.customer && window.customer.tags && window.customer.tags.includes("vip")) {
      freeGiftThreshold = window.freeGift.thresholds.paidMember;
      console.log("Customer is VIP. Using paid member threshold:", freeGiftThreshold);
    } else {
      console.log("Customer is not VIP. Using free member threshold:", freeGiftThreshold);
    }

    try {
      if (this.isAddingFreeGift) {
        console.log("Skipping free gift addition: Process is already ongoing.");
        this.isValidatingGift = false;
        return; // Skip adding if we're already in the process of adding
      }

      this.isAddingFreeGift = true; // Prevent adding the free gift multiple times

      // Fetch the cart to determine if the free gift is in the cart
      // 23-5 Only 1 cart fetch in function param
      // const response = await fetch("/cart.js");
      // const cart = await response.json();

      const freeGiftVariantId = parseInt(window.freeGift.ProductId, 10);
      const freeGiftInCart = cart.items.find(item => item.variant_id === freeGiftVariantId);

      // REMOVE GWP PROMOS
      this.checkAndRemoveGWP(cart, freeGiftVariantId);

      // Calculate cart total without the free gift
      const cartTotalExcludingFreeGift = cart.items.reduce((total, item) => {
        if (item.variant_id !== freeGiftVariantId) {
          return total + item.final_line_price;
        }
        return total;
      }, 0) / 100; // Convert from cents to dollars

      console.log("Cart total excluding free gift:", cartTotalExcludingFreeGift);

      // Check if at least one item (excluding the free gift) requires shipping
      const hasShippableItem = cart.items.some(item => item.variant_id !== freeGiftVariantId && item.requires_shipping);

      if (!hasShippableItem) {
        console.log("No items in the cart (excluding the free gift) require shipping.");
      }

      let beromasterItemInCart = false;
      if (window.beromaster && window.beromaster.productId) {
        let beromasterProductId = parseInt(window.beromaster.productId, 10);
        beromasterItemInCart = cart.items.find(item => item.variant_id === beromasterProductId);
        if(typeof beromasterItemInCart != "undefined") {
          console.log("Beromaster membership in cart");
        }
      }

      if (!window.customer) {
        console.log("No customer is logged in.");
      } else if (!window.customer.eligibleForFreeGift) {
        console.log("Customer is not eligible for the free gift.");
      }

      // If the cart total is below the threshold, customer is ineligible, or no item requires shipping, or beromaster membership is in cart, remove the free gift
      if (cartTotalExcludingFreeGift < freeGiftThreshold || !(window.customer && window.customer.eligibleForFreeGift) || !hasShippableItem || beromasterItemInCart) {
        if (freeGiftInCart) {
          console.log("Removing free gift as conditions are not met.");
          await this.removeFreeGift(freeGiftInCart.key);
        } else {
          console.log("No free gift in cart to remove.");
        }
      } else {
        // Ensure only one free gift is in the cart
        if (freeGiftInCart) {
          if (freeGiftInCart.quantity > 1) {
            console.log("Free gift is in cart but quantity is more than 1. Adjusting quantity to 1.");
            await this.updateFreeGiftQuantity(freeGiftInCart.key, 1);
          } else {
            console.log("Free gift is already in the cart with the correct quantity.");
          }
        } else {
          console.log("Adding free gift to the cart.");
          await this.addFreeGift(freeGiftVariantId);
        }
      }
    } catch (error) {
      console.error("Error validating free gift:", error);
    } finally {
      this.isAddingFreeGift = false;
      this.isValidatingGift = false;
      console.log("Finished validateFreeGift process.");
    }
  }



    async checkBeromasterQuantity(cart) {
    if (!window.beromaster || !window.beromaster.productId) {
      console.log("Beromaster product ID is not set.");
      return;
    }

    try {
      // 23-5 Only 1 cart fetch in function param
      // const response = await fetch("/cart.js");
      // const cart = await response.json();

      const beromasterProductId = parseInt(window.beromaster.productId, 10);
      const beromasterItemInCart = cart.items.find(item => item.variant_id === beromasterProductId);

      if (!window.customer) {
        // Customer is not logged in, remove Beromaster product if it's in the cart
        if (beromasterItemInCart) {
          console.log("Customer is not logged in. Removing Beromaster product from cart.");
          await this.removeBeromasterFromCart(beromasterItemInCart.key);
        }
      } else {
        // Customer is logged in, ensure the quantity is no more than 1
        if (beromasterItemInCart && beromasterItemInCart.quantity > 1) {
          console.log("Reducing quantity of Beromaster product to 1.");
          await this.updateBeromasterQuantity(beromasterItemInCart.key, 1);
        } else {
          console.log("Finished Beromaster product quantity check.");
        }
      }
    } catch (error) {
      console.error("Error checking Beromaster product quantity:", error);
    }
  }

  async addFreeGift(variantId) {
    const body = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }],
    });

    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      console.log("Free gift added to cart.");
      this.onCartUpdate();
    } else {
      const errorData = await response.json();
      console.error("Failed to add free gift", errorData);
    }
  }

  async updateFreeGiftQuantity(key, quantity) {
    const body = JSON.stringify({
      id: key,
      quantity: quantity,
    });

    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      console.log("Free gift quantity updated.");
      this.onCartUpdate();
    } else {
      const errorData = await response.json();
      console.error("Failed to update free gift quantity", errorData);
    }
  }

  async removeFreeGift(key) {
    const body = JSON.stringify({
      id: key,
      quantity: 0,
    });

    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      console.log("Free gift removed from cart.");
      const cart = await response.json();
      if (cart.item_count === 0) {
        location.reload(); // Refresh the page if the cart is empty
      } else {
        this.onCartUpdate();
      }
    } else {
      const errorData = await response.json();
      console.error("Failed to remove free gift", errorData);
    }
  }

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === "cart-items") {
          return;
        }
        this.onCartUpdate();
      }
    );

    // 23-5-25 deprected, doesn't need first load check already happens
    // Call validateFreeGift once on initial load
    // if (this.firstLoad) {
    //   this.validateFreeGift();
    //   this.firstLoad = false;
    // }
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = "";

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace(
        "[min]",
        event.target.dataset.min
      );
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace(
        "[max]",
        event.target.max
      );
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace(
        "[step]",
        event.target.step
      );
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute("name"),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }


  async updateBeromasterQuantity(key, quantity) {
    const body = JSON.stringify({
      id: key,
      quantity: quantity,
    });

    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      console.log("Beromaster quantity updated.");
      this.onCartUpdate();
    } else {
      const errorData = await response.json();
      console.error("Failed to update Beromaster quantity", errorData);
    }
  }

  async removeBeromasterFromCart(key) {
    const body = JSON.stringify({
      id: key,
      quantity: 0,
    });

    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      console.log("Beromaster product removed from cart.");
      const cart = await response.json();
      if (cart.item_count === 0) {
        location.reload(); // Refresh the page if the cart is empty
      } else {
        this.onCartUpdate();
      }
    } else {
      const errorData = await response.json();
      console.error("Failed to remove Beromaster product", errorData);
    }
  }


  async checkAndRemoveGWP(cart) {
    const gwpInCart = cart.items.filter(item => item.product_type === "GWP");
    // console.log(gwpInCart);
    if (gwpInCart.length > 0) {
      for (const gwp of gwpInCart) {
        console.log("removing gift " + gwp.handle);
        await this.removeFreeGift(gwp.key);
      }
    }
  }

  onCartUpdate() {
    if (this.tagName === "CART-DRAWER-ITEMS") {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html");
          const selectors = ["#CartDrawer-CartItems", ".drawer__footer"];
          selectors.forEach((selector) => {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          });
          // Remove unneeded extra validation
          // this.validateCartItems(); // Validate free gift and Beromaster after cart update
        })
        .catch((error) => {
          console.error("Error updating cart drawer:", error);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html");
          const sourceQty = html.querySelector("cart-items");
          this.innerHTML = sourceQty.innerHTML;
          // Remove unneeded extra validation
          // this.validateCartItems(); // Validate free gift and Beromaster after cart update
        })
        .catch((error) => {
          console.error("Error updating cart page:", error);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items").dataset.id,
        selector: ".js-contents--items",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer").dataset.id,
        selector: ".js-contents--footer",
      },
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) ||
          document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll(".cart-item");

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute("value");
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector("cart-drawer");
        const cartFooter = document.getElementById("main-cart-footer");

        if (cartFooter)
          cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
        if (cartDrawerWrapper)
          cartDrawerWrapper.classList.toggle(
            "is-empty",
            parsedState.item_count === 0
          );

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document
              .getElementById(section.id)
              .querySelector(section.selector) ||
            document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });

        const updatedValue = parsedState.items[line - 1]
          ? parsedState.items[line - 1].quantity
          : undefined;

        let message = "";
        if (
          items.length === parsedState.items.length &&
          updatedValue !== parseInt(quantityElement.value)
        ) {
          if (typeof updatedValue === "undefined") {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace(
              "[quantity]",
              updatedValue
            );
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) ||
          document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(
              cartDrawerWrapper,
              lineItem.querySelector(`[name="${name}"]`)
            )
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper.querySelector(".drawer__inner-empty"),
            cartDrawerWrapper.querySelector("a")
          );
        } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper,
            document.querySelector(".cart-item__name")
          );
        }

        // Re-validate the free gift and Beromaster after cart update
        this.validateCartItems();
      })
      .catch(() => {
        this.querySelectorAll(".loading__spinner").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError)
      lineItemError.querySelector(".cart-item__error-text").innerHTML = message;

    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus =
      document.getElementById("cart-live-region-text") ||
      document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
    cartDrawerItemElements.forEach((overlay) =>
      overlay.classList.add("hidden")
    );
  }
}

customElements.define("cart-items", CartItems);


if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.maxLength = this.getAttribute("data-max-length") || 200;

        this.addEventListener(
          "input",
          debounce((event) => {
            const inputElement = event.target;
            const noteValue = inputElement.value;

            // Enforce character limit
            if (noteValue.length > this.maxLength) {
              inputElement.value = noteValue.slice(0, this.maxLength); // Trim the value if it exceeds the limit
              alert("Note cannot exceed 200 characters."); // Optional alert or provide better UI feedback
            }

            const body = JSON.stringify({ note: inputElement.value });
            fetch(`${routes.cart_update_url}`, {
              ...fetchConfig(),
              ...{ body },
            });

            // Optionally, update a character counter or show feedback
            this.updateCharCounter(inputElement.value.length);
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }

      // Optional method to display character count feedback
      updateCharCounter(currentLength) {
        const counterElement = document.querySelector("#cart-note-counter"); // Example selector for a counter element
        if (counterElement) {
          counterElement.textContent = `${this.maxLength - currentLength} characters remaining.`;
        }
      }

      connectedCallback() {
        // Initialize character counter if necessary
        const noteValue = this.querySelector("textarea").value;
        this.updateCharCounter(noteValue.length);
      }
    }
  );
}
