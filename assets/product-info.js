if (!customElements.get("product-info")) {
  customElements.define(
    "product-info",
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();

        this.quantityInput = this.querySelector(".quantity__input");
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        this.initQuantityHandlers();
        setUpStockAlertEvents();
        this.dispatchEvent(
          new CustomEvent("product-info:loaded", { bubbles: true })
        );
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector(".product-form__quantity");
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(
            PUB_SUB_EVENTS.cartUpdate,
            this.fetchQuantityRules.bind(this)
          );
        }
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber();
        this.cartUpdateUnsubscriber?.();
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html
            .querySelectorAll(".scroll-trigger")
            .forEach((element) =>
              element.classList.add("scroll-trigger--cancel")
            )
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR();
        });
      }

      handleOptionValueChange({
        data: { event, target, selectedOptionValues },
      }) {
        if (!this.contains(event.target)) return;

        // REMOVE UPDATE TO THE BTN SINCE WE ARE UPDATING THE WHOLE CONTAINER
        // this.resetProductFormState();

        const productUrl =
          target.dataset.productUrl ||
          this.pendingRequestUrl ||
          this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage =
          this.dataset.updateUrl === "true" && shouldSwapProduct;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(
            productUrl,
            selectedOptionValues,
            shouldFetchFullPage
          ),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
            : this.handleUpdateProductInfo(productUrl),
        });

        this.handleShowPrice();
        this.handleVariantDetails();
      }

      handleShowPrice() {
        const idInfo = `#ProductInfo-${this.dataset.section}`;
        const idPrice = `#price-${this.dataset.section}`;

        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const target = mediaQuery.matches
          ? this.querySelector(idInfo).querySelector(idPrice)
          : this.querySelector(idPrice);

        const offset = mediaQuery.matches ? 300 : 100;
        const targetTop = target.getBoundingClientRect().top;

        if (targetTop < 100) {
          const elementPosition = targetTop + window.scrollY;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
      handleVariantDetails(variant) {
        const variantDetailsSelector = document.querySelectorAll(`#shopify-section-${this.dataset.section} .variant-details`);
        if (variantDetailsSelector && variant) {
          variantDetailsSelector.forEach(el => {
            el.classList[variant.id === +el.dataset?.variantId ? 'remove' : 'add']('hide')
          })
        }
      }
      handlePreOrder(variant) {
        var currency = (typeof window.variantStrings !== "undefined" && window.variantStrings.currency) ? window.variantStrings.currency : '$';
        const preOrderSelector = document.querySelector('script[data-preorder]')
        const variantPrice = (variant.price / 100).toFixed(2)
        if (preOrderSelector) {
          const data = JSON.parse(preOrderSelector.textContent.trim())

          const preOrder = data.preorder
          document.querySelectorAll('.js-preorder-badge').forEach(badge => {
            badge.classList[preOrder ? 'remove' : 'add']('hide')
          })
          const preOrderText = document.querySelector('.preorder-text-container')
          const preOrderDate = document.querySelector('.preorder-date')
          if (preOrderText) {
            preOrderText.classList[preOrder ? 'remove' : 'add']('hidden')
            preOrderDate.innerHTML = data.preorder_date
          }
          const stickybarCTA = document.querySelector('.sticky-product-bar__cta')
          if (stickybarCTA) {
            stickybarCTA.innerHTML = preOrder ? `PRE-ORDER - <span class="price-item">${currency}${variantPrice}</span>` : `ADD TO CART - <span class="price-item">${currency}${variantPrice}</span>`
          }
        }
      }

      resetProductFormState() {
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true);
        productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const selector = updateFullPage
            ? "product-info[id^='MainProduct']"
            : "product-info";
          const variant = this.getSelectedVariant(html.querySelector(selector));
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector("head title").innerHTML =
              html.querySelector("head title").innerHTML;

            HTMLUpdateUtility.viewTransition(
              document.querySelector("main"),
              html.querySelector("main"),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          } else {
            HTMLUpdateUtility.viewTransition(
              this,
              html.querySelector("product-info"),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          }
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            this.pendingRequestUrl = null;
            const html = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            callback(html);
          })
          .then(() => {
            // set focus to last clicked option value
            document.querySelector(`#${targetId}`)?.focus();
          })
          .catch((error) => {
            if (error.name === "AbortError") {
              console.log("Fetch aborted by user");
            } else {
              console.error(error);
            }
          });
      }

      getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode.querySelector(
          "variant-selects [data-selected-variant]"
        )?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      buildRequestUrlWithParams(
        url,
        optionValues,
        shouldFetchFullPage = false
      ) {
        const params = [];

        !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

        if (optionValues.length) {
          params.push(`option_values=${optionValues.join(",")}`);
        }

        return `${url}?${params.join("&")}`;
      }

      updateOptionValues(html) {
        const variantSelects = html.querySelector("variant-selects");
        if (variantSelects) {
          HTMLUpdateUtility.viewTransition(
            this.variantSelectors,
            variantSelects,
            this.preProcessHtmlCallbacks
          );
        }
      }

      // UPDATE THE WHOLE CTA CONTAINER
      updateCtaContainer(html) {
        const ctaContainer = html.querySelector(".pdp-cta-container");
        if (ctaContainer) {
          HTMLUpdateUtility.viewTransition(
            this.ctaContainer,
            ctaContainer,
            this.preProcessHtmlCallbacks
          );
        }
      }

      // UPDATE STICKY BAR CTA BUTTON
      updateStickyBar(html) {
        const stickyBar = html.querySelector(".sticky-pdp-container");
        if (stickyBar) {
          HTMLUpdateUtility.viewTransition(
            this.stickyBar,
            stickyBar,
            this.preProcessHtmlCallbacks
          );
        }
      }

      // UPDATE DESKTOP PRICE AND REVIEWS ON VARIANT SWITCH
      updateDesktopPriceBlock(html) {
        const desktopPriceBlock = html.querySelector(".desktop-price-block");
        if (desktopPriceBlock) {
          HTMLUpdateUtility.viewTransition(
            this.desktopPriceBlock,
            desktopPriceBlock,
            this.preProcessHtmlCallbacks
          );
        }
      }

      // UPDATE LOYALTY BADGES
      updateLoyaltyBadge(html) {
        const newLoyaltyBadges = [...html.querySelectorAll(".product__loyalty-badge")];
        const existingLoyaltyBadges = [...this.querySelectorAll(".product__loyalty-badge")]
        if (newLoyaltyBadges.length > 0) {
          newLoyaltyBadges.forEach((newLoyaltyBadge, index) => {
            const existingLoyaltyBadge = existingLoyaltyBadges[index];
            if (existingLoyaltyBadge) {
              HTMLUpdateUtility.viewTransition(
                existingLoyaltyBadge,
                newLoyaltyBadge,
                this.preProcessHtmlCallbacks
              );
            }
          });

          const accordionLoyaltyBadges = [...document.querySelectorAll(".accordion-item__content [data-loyalty-potential-credit]")];

          accordionLoyaltyBadges.forEach(loyaltyBadge => {
            loyaltyBadge.innerText = newLoyaltyBadges[0].querySelector('[data-loyalty-potential-credit]').innerText;
          })
        }
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          const recipientForm = document.querySelector('.js-recipient-form')
          const variant = this.getSelectedVariant(html);

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateCtaContainer(html);
          this.updateStickyBar(html);
          this.updateLoyaltyBadge(html);
          this.updateDesktopPriceBlock(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);
          this.handleVariantDetails(variant);
          this.handlePreOrder(variant);

          if (!variant) {
            this.setUnavailable();
            return;
          }

          this.updateMedia(html, variant?.featured_media?.id);

          const updateSourceFromDestination = (
            id,
            shouldHide = (source) => false
          ) => {
            try {
              const source = html.getElementById(`${id}-${this.sectionId}`);
              const destinations = this.querySelectorAll(
                `#${id}-${this.dataset.section}`
              );

              if (source && destinations.length > 0) {
                destinations.forEach((destination) => {
                  destination.innerHTML = source.innerHTML;
                  destination.classList.toggle("hidden", shouldHide(source));
                });
              }
            } catch (error) {
              console.error(error);
            }
          };

          updateSourceFromDestination("price");
          updateSourceFromDestination("Sku", ({ classList }) =>
            classList.contains("hidden")
          );
          updateSourceFromDestination(
            "Inventory",
            ({ innerText }) => innerText === ""
          );
          updateSourceFromDestination("Volume");
          updateSourceFromDestination("Price-Per-Item", ({ classList }) =>
            classList.contains("hidden")
          );

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(
            `#Quantity-Rules-${this.dataset.section}`
          )?.classList.remove("hidden");
          this.querySelector(
            `#Volume-Note-${this.dataset.section}`
          )?.classList.remove("hidden");

          setUpStockAlertEvents();

          if (recipientForm) {
            document.querySelectorAll('.js-recipient-form .js-recipient-input').forEach((input, index) => {
              const source = Array.from(recipientForm.querySelectorAll(`.js-recipient-input`))[index]
              const inputValue = source?.value

              if (source?.checked) {
                input.checked = true
                document.querySelector('recipient-form').dispatchEvent(new Event('change'))
              }
              if (inputValue) input.value = inputValue
            })
          }
          // REMOVE UPDATE TO THE BTN SINCE WE ARE UPDATING THE WHOLE CONTAINER
          // this.productForm?.toggleSubmitButton(
          //   html
          //     .getElementById(`ProductSubmitButton-${this.sectionId}`)
          //     ?.hasAttribute("disabled") ?? true,
          //   window.variantStrings.soldOut
          // );

          publish(PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: this.sectionId,
              html,
              variant,
            },
          });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        ).forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = variantId ?? "";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      updateURL(url, variantId) {
        this.querySelector("share-button")?.updateUrl(
          `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ""}`
        );

        if (this.dataset.updateUrl === "false") return;
        window.history.replaceState(
          {},
          "",
          `${url}${variantId ? `?variant=${variantId}` : ""}`
        );
      }

      setUnavailable() {
        // REMOVE UPDATE TO THE BTN SINCE WE ARE UPDATING THE WHOLE CONTAINER
        // this.productForm?.toggleSubmitButton(
        //   true,
        //   window.variantStrings.unavailable
        // );

        const selectors = [
          "price",
          "Inventory",
          "Sku",
          "Price-Per-Item",
          "Volume-Note",
          "Volume",
          "Quantity-Rules",
        ]
          .map((id) => `#${id}-${this.dataset.section}`)
          .join(", ");
        document
          .querySelectorAll(selectors)
          .forEach(({ classList }) => classList.add("hidden"));
      }

      updateMedia(html, variantFeaturedMediaId) {
        if (!variantFeaturedMediaId) return;

        const mediaGallerySource = this.querySelector("media-gallery ul");
        const mediaGalleryDestination = html.querySelector(`media-gallery ul`);

        const refreshSourceData = () => {
          if (this.hasAttribute("data-zoom-on-hover")) enableZoomOnHover(2);
          const mediaGallerySourceItems = Array.from(
            mediaGallerySource.querySelectorAll("li[data-media-id]")
          );
          const sourceSet = new Set(
            mediaGallerySourceItems.map((item) => item.dataset.mediaId)
          );
          const sourceMap = new Map(
            mediaGallerySourceItems.map((item, index) => [
              item.dataset.mediaId,
              { item, index },
            ])
          );
          return [mediaGallerySourceItems, sourceSet, sourceMap];
        };

        if (mediaGallerySource && mediaGalleryDestination) {
          let [mediaGallerySourceItems, sourceSet, sourceMap] =
            refreshSourceData();
          const mediaGalleryDestinationItems = Array.from(
            mediaGalleryDestination.querySelectorAll("li[data-media-id]")
          );
          const destinationSet = new Set(
            mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId)
          );
          let shouldRefresh = false;

          // add items from new data not present in DOM
          for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
            if (
              !sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)
            ) {
              mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
              shouldRefresh = true;
            }
          }

          // remove items from DOM not present in new data
          for (let i = 0; i < mediaGallerySourceItems.length; i++) {
            if (
              !destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)
            ) {
              mediaGallerySourceItems[i].remove();
              shouldRefresh = true;
            }
          }

          // refresh
          if (shouldRefresh)
            [mediaGallerySourceItems, sourceSet, sourceMap] =
              refreshSourceData();

          // if media galleries don't match, sort to match new data order
          mediaGalleryDestinationItems.forEach(
            (destinationItem, destinationIndex) => {
              const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

              if (sourceData && sourceData.index !== destinationIndex) {
                mediaGallerySource.insertBefore(
                  sourceData.item,
                  mediaGallerySource.querySelector(
                    `li:nth-of-type(${destinationIndex + 1})`
                  )
                );

                // refresh source now that it has been modified
                [mediaGallerySourceItems, sourceSet, sourceMap] =
                  refreshSourceData();
              }
            }
          );
        }

        // set featured media as active in the media gallery
        this.querySelector(`media-gallery`)?.setActiveMedia?.(
          `${this.dataset.section}-${variantFeaturedMediaId}`,
          true
        );

        // update media modal
        const modalContent = this.productModal?.querySelector(
          `.product-media-modal__content`
        );
        const newModalContent = html.querySelector(
          `product-modal .product-media-modal__content`
        );
        if (modalContent && newModalContent)
          modalContent.innerHTML = newModalContent.innerHTML;
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.quantityInput.dataset.cartQuantity
            ? parseInt(this.quantityInput.dataset.cartQuantity)
            : 0,
          min: this.quantityInput.dataset.min
            ? parseInt(this.quantityInput.dataset.min)
            : 1,
          max: this.quantityInput.dataset.max
            ? parseInt(this.quantityInput.dataset.max)
            : null,
          step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.quantityInput.min = min;

        if (max) {
          this.quantityInput.max = max;
        } else {
          this.quantityInput.removeAttribute("max");
        }
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        this.querySelector(
          ".quantity__rules-cart .loading__spinner"
        ).classList.remove("hidden");
        fetch(
          `${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`
        )
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch((e) => console.error(e))
          .finally(() =>
            this.querySelector(
              ".quantity__rules-cart .loading__spinner"
            ).classList.add("hidden")
          );
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(
          `Quantity-Form-${sectionId}`
        );
        const selectors = [
          ".quantity__input",
          ".quantity__rules",
          ".quantity__label",
        ];
        if (!quantityFormUpdated) return;
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === ".quantity__input") {
            const attributes = [
              "data-cart-quantity",
              "data-min",
              "data-max",
              "step",
            ];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) {
                current.setAttribute(attribute, valueUpdated);
              } else {
                current.removeAttribute(attribute);
              }
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get productModal() {
        return document.querySelector(`#ProductModal-${this.dataset.section}`);
      }

      get pickupAvailability() {
        return this.querySelector(`pickup-availability`);
      }

      get variantSelectors() {
        return this.querySelector("variant-selects");
      }

      get relatedProducts() {
        const relatedProductsSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          "related-products"
        );
        return document.querySelector(
          `product-recommendations[data-section-id^="${relatedProductsSectionId}"]`
        );
      }

      get quickOrderList() {
        const quickOrderListSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          "quick_order_list"
        );
        return document.querySelector(
          `quick-order-list[data-id^="${quickOrderListSectionId}"]`
        );
      }

      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }

      get ctaContainer() {
        return this.querySelector(`.pdp-cta-container`);
      }

      get stickyBar() {
        return this.querySelector(`.sticky-pdp-container`);
      }

      get desktopPriceBlock() {
        return this.querySelector(`.desktop-price-block`);
      }
    }
  );
}

function setUpStockAlertEvents() {
  let formElement = document.getElementById('kl_stock_alert');
  let submitButton = document.getElementById('kl_stock_alert-btn');
  let successMessage = document.querySelector('.kl_stock_alert-success');
  let errorMessage = document.querySelector('.kl_stock_alert-error');

  if (formElement && submitButton) {
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();
      submitButton.click();
    });
  }

  if (submitButton) {
    submitButton.addEventListener('click', async () => {
      try {
        let result = await subscribeProductStockToKlaviyo(formElement);
        // console.log(result);
        if (!result.ok) {
          result = await result.json();
          throw new Error(result.errors[0].detail);
        }

        let subscribeToMailingList = formElement.querySelector('input[name="list_subscribe"]').checked;
        let resultSubscribe = false;
        // console.log('subscribed checked?: ' + subscribeToMailingList);
        if (subscribeToMailingList) {
          resultSubscribe = await pdpKlaviyoAddPropertyAndSubscribeToList(formElement);
        } else {
          resultSubscribe = await pdpKlaviyoAddProperty(formElement);
        }

        if (!resultSubscribe.ok) {
          resultSubscribe = await resultSubscribe.json();
          throw new Error(resultSubscribe.errors[0].detail);
        }


        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        formElement.classList.add('hidden');
        submitButton.classList.add('hidden');
        console.log(`Form submitted`);

      } catch (e) {
        successMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = `Failed to subscribe: ${e.message}`;
        console.log(`Failed to subscribe. Reason: "${e.message}"`);
      }
    });
  }
}

window.setUpStockAlertEvents = setUpStockAlertEvents;

function subscribeProductStockToKlaviyo(formElement) {
  const co = 'UYwKnY';
  let email = formElement.querySelector('input[name="user_email"]').value;
  let variant = formElement.querySelector('input[name="variant"]').value;

  let options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      revision: '2024-07-15',
      'content-type': 'application/json',
      Authorization: `Klaviyo-API-Key ${co}`
    },
    body: JSON.stringify({
      data: {
        type: 'back-in-stock-subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: email || '',
              },
            },
          },
          channels: ['EMAIL'],
        },
        relationships: {
          variant: {
            data: {
              type: 'catalog-variant',
              id: `$shopify:::$default:::${variant}`,
            },
          },
        },
      },
    }),
  };

  // console.log('subscribeProductStockToKlaviyo options', options);

  let result;

  return fetch(`https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=${co}`, options)
    .then((response) => {
      result = response;
      // console.log('subscribeProductStockToKlaviyo result', result);
      return result;
    })
    .catch((err) => console.error(err));
}

window.subscribeProductStockToKlaviyo = subscribeProductStockToKlaviyo;

function pdpKlaviyoAddProperty(formElement) {
  const co = "UYwKnY";
  let user_email = formElement.querySelector('input[name="user_email"]').value;
  let mkt_custom_property_name = formElement.querySelector('input[name="mkt_custom_property_name"]').value;


  // Get the detected country and adding custom property 
  let detectedCountry = window.Shopify.customerPrivacy.getRegion();
  
  let signUpSource = Shopify.country == 'GB' ? 'UK' : Shopify.country;
  /*
    let signUpSource = '';
    if(detectedCountry.includes('US')) {
      signUpSource = 'US';
    } else if (detectedCountry.includes('GB')) {
      signUpSource = 'UK';
    } else {
      signUpSource = 'INT';
    }
  */

  let klaviyoProperties = {};
  klaviyoProperties[mkt_custom_property_name] = "true";
  // klaviyoProperties.sign_up_source = signUpSource;
  klaviyoProperties.updateable_source = signUpSource;
  console.log('adding custom property to email!');

  // console.log(klaviyoProperties);

  let options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-01-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${co}`
    },
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          properties: klaviyoProperties,
          email: user_email,
          // subscriptions: {
          //   email: {
          //     marketing: {
          //       consent: "SUBSCRIBED"
          //     }
          //   },
          // },
        }
      }
    })
  };

  let result;

  return fetch(`https://a.klaviyo.com/client/profiles/?company_id=${co}`, options)
    .then((response) => {
      result = response;
      return result;
    })
    .catch((err) => console.error(err));

}

window.pdpKlaviyoAddProperty = pdpKlaviyoAddProperty;

function pdpKlaviyoAddPropertyAndSubscribeToList(formElement) {
  const co = "UYwKnY";
  let id_list = formElement.querySelector('input[name="kl_list"]').value;
  let user_email = formElement.querySelector('input[name="user_email"]').value;

  let mkt_custom_property_name = formElement.querySelector('input[name="mkt_custom_property_name"]').value;

  let klaviyoProperties = {};
  klaviyoProperties[mkt_custom_property_name] = "true";
  console.log('adding custom property to email!');


  console.log('subscribing to mailing list!');
  klaviyoProperties.ad_personalization = "granted";
  klaviyoProperties.ad_user_data = "granted";
  let marketingPropertyName = "Accepts Marketing";
  klaviyoProperties[marketingPropertyName] = "true";

  // Get the detected country and adding custom property 
  let detectedCountry = window.Shopify.customerPrivacy.getRegion();
  console.log('detectedCountry', detectedCountry);

  let signUpSource = Shopify.country == 'GB' ? 'UK' : Shopify.country;
  /*
    let signUpSource = '';
    if(detectedCountry.includes('US')) {
      signUpSource = 'US';
    } else if (detectedCountry.includes('GB')) {
      signUpSource = 'UK';
    } else {
      signUpSource = 'INT';
    }
  */

  // klaviyoProperties.sign_up_source = signUpSource;
  klaviyoProperties.updateable_source = signUpSource;
  // if(signUpSource !== '') {}
  console.log('klaviyoProperties', klaviyoProperties);


  let options = {
    method: 'POST',
    headers: { 
      revision: '2024-07-15', 
      'content-type': 'application/json',
      Authorization: `Klaviyo-API-Key ${co}`
    },
    body: JSON.stringify({
      data: {
        type: 'subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                properties: klaviyoProperties,
                email: user_email,
              },
            }
          },
          // subscriptions: {
          //   email: {
          //     marketing: {
          //       consent: "SUBSCRIBED"
          //     }
          //   },
          // },
          custom_source: 'PDP stock alert subscribe button'
        },
        relationships: { list: { data: { type: 'list', id: id_list } } }
      }
    })
  };
  // console.log('options', options);

  let result;

  return fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${co}`, options)
    .then((response) => {
      result = response;
      return result;
    })
    .catch((err) => console.error(err));

}

window.pdpKlaviyoAddPropertyAndSubscribeToList = pdpKlaviyoAddPropertyAndSubscribeToList;