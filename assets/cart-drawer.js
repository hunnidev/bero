class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this.querySelector("#CartDrawer-Overlay").addEventListener(
      "click",
      this.close.bind(this)
    );
    this.setHeaderCartIconAccessibility();
  }

  // updateFreeShippingProgress(cart) {
  //   console.log('test1');
    
  //   const freeShippingThreshold = parseFloat(document.querySelector("[data-free-shipping-threshold]").getAttribute('data-free-shipping-threshold')) * 100;
  //   const totalPrice = cart.total_price;
  //   let percentageProgress = 0;
    
  //   if (totalPrice >= freeShippingThreshold) {
  //     percentageProgress = 100;
  //   } else {
  //     percentageProgress = (totalPrice / freeShippingThreshold) * 100;
  //   }
    
  //   // Update the progress bar width
  //   const progressBar = document.querySelector(".cart-free-shipping__progress");
  //   if (progressBar) {
  //     progressBar.style.width = `${percentageProgress}%`;
  //   }

  //   // Update the amount remaining for free shipping
  //   const freeShippingRemainingElement = document.querySelector("[data-free-shipping-remaining]");
  //   const freeShippingRemaining = freeShippingThreshold - totalPrice;
  //   if (freeShippingRemainingElement) {
  //     freeShippingRemainingElement.textContent = Shopify.formatMoney(freeShippingRemaining);
  //   }

  //   // Hide/show success message based on free shipping status
  //   const freeShippingEl = document.querySelector(".cart-free-shipping");
  //   if (freeShippingMessageSuccess) {
  //     freeShippingEl.classList.add("cart-free-shipping--success");
  //   } else {
  //     freeShippingEl.classList.remove("cart-free-shipping--success");
  //   }
  // }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role"))
      this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add("animate", "active");
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("is-empty")
          ? this.querySelector(".drawer__inner-empty")
          : document.getElementById("CartDrawer");
        const focusElement =
          this.querySelector(".drawer__inner") ||
          this.querySelector(".drawer__close");
        trapFocus(containerToTrapFocusOn, focusElement);
        let focusableElements = getFocusableElements(containerToTrapFocusOn);
        if (focusableElements.length > 0) focusableElements[0].focus();
      },
      { once: true }
    );

    document.body.classList.add("overflow-hidden");
  }

  close() {
    this.classList.remove("active", "item-added");
    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute(
        "aria-controls",
        cartDrawerNote.nextElementSibling.id
      );
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute(
        "aria-expanded",
        !event.currentTarget.closest("details").hasAttribute("open")
      );
    });

    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector(".drawer__inner").classList.contains("is-empty") &&
      this.querySelector(".drawer__inner").classList.remove("is-empty");
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector
      );
    });

    this.classList.add('item-added')

    setTimeout(() => {
      this.classList.remove('item-added')
    }, 6000);

    setTimeout(() => {
      this.querySelector("#CartDrawer-Overlay").addEventListener(
        "click",
        this.close.bind(this)
      );
      this.open();
    });

    // this.updateFreeShippingProgress(parsedState.cart);
    
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
      },
    ];
  }

  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: ".drawer__inner",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
    ];
  }
}

customElements.define("cart-drawer-items", CartDrawerItems);

// pb+j trigger cartupdate event for age affirmation check
// pb+j 3/4/25 replacing age affirmation from front end to custom extension app

// class CheckAgeAffirmation extends CartItems {
//   connectedCallback() {
//     super.connectedCallback();  
//     const connectedEvent = new CustomEvent("CartItemsConnected");
//     document.dispatchEvent(connectedEvent);
//   }
// }

// customElements.define("cart-check-age", CheckAgeAffirmation);
