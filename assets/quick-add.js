if (!customElements.get("quick-add-modal")) {
  customElements.define(
    "quick-add-modal",
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
        this.previousActiveElement;

        this.addEventListener("product-info:loaded", ({ target }) => {
          // target.addPreProcessCallback(this.preprocessHTML.bind(this));
        });
      }

      hide(preventFocus = false) {
        console.log('Hiding quick add modal');
        const cartNotification =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);

        setTimeout(() => {
          this.modalContent.innerHTML = "";
        }, 1000);


        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        console.log('Opening quick add modal for:', opener);
        this.previousActiveElement = opener;
        opener.setAttribute("aria-disabled", true);
        opener.classList.add("loading");
        opener.querySelector(".loading__spinner").classList.remove("hidden");
      
        fetch(opener.getAttribute("data-product-url"))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            const productElement = responseHTML.querySelector("product-info");
      
            this.preprocessHTML(productElement);
            HTMLUpdateUtility.setInnerHTML(
              this.modalContent,
              productElement.outerHTML
            );
      
            /*
              Query quick-add__return outside the dynamic content
            */
            const modalQuickAddReturn = this.closest('quick-add-modal').querySelector('.quick-add__return');
            const modalInfoWrapper = this.modalContent.querySelector('.product__info-wrapper');
            const modalInfoContent = this.modalContent;

            /*
              Clone the quick-add__return and move the clone to the start of product__info-wrapper
            */
            if (modalQuickAddReturn && modalInfoWrapper) {
              const clonedQuickAddReturn = modalQuickAddReturn.cloneNode(true);

              modalQuickAddReturn.classList.add('hidden');
              clonedQuickAddReturn.classList.remove('hidden');

              modalInfoContent.appendChild(modalInfoWrapper);
              modalInfoContent.querySelector('product-info .product__info-container').prepend(clonedQuickAddReturn)


              /*
                Trigger the original button's click event when the clone is clicked
              */
              clonedQuickAddReturn.addEventListener("click", function() {
                modalQuickAddReturn.click();
              });
            }

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
            if (window.ProductModel) window.ProductModel.loadShopifyXR();
      
            super.show(opener);
          })
          .finally(() => {
            opener.removeAttribute("aria-disabled");
            opener.classList.remove("loading");
            opener.querySelector(".loading__spinner").classList.add("hidden");
          });
      }

      preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
          if (classApplied.startsWith("color-") || classApplied === "gradient")
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
      }

      preventVariantURLSwitching(productElement) {
        productElement.setAttribute("data-update-url", "false");
      }

      removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector(
          "pickup-availability"
        );

        const productTitle = productElement.querySelector('#product-title');
        if (productTitle) productTitle.remove();

        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector("product-modal");
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll("modal-dialog");
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(
          oldId,
          newId
        );
        Array.from(productElement.attributes).forEach((attribute) => {
          if (attribute.value.includes(oldId)) {
            productElement.setAttribute(
              attribute.name,
              attribute.value.replace(oldId, newId)
            );
          }
        });

        productElement.dataset.originalSection = sectionId;
      }

      removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector(
          '[id^="Slider-Gallery"]'
        );
        if (!galleryList) return;

        galleryList.setAttribute("role", "presentation");
        galleryList
          .querySelectorAll('[id^="Slide-"]')
          .forEach((li) => li.setAttribute("role", "presentation"));
      }

      updateImageSizes(productElement) {
        const product = productElement.querySelector(".product");
        const desktopColumns = product?.classList.contains("product--columns");
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll(".product__media img");
        if (!mediaImages.length) return;

        let mediaImageSizes =
          "(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)";

        if (product.classList.contains("product--medium")) {
          mediaImageSizes = mediaImageSizes.replace("715px", "605px");
        } else if (product.classList.contains("product--small")) {
          mediaImageSizes = mediaImageSizes.replace("715px", "495px");
        }

        mediaImages.forEach((img) =>
          img.setAttribute("sizes", mediaImageSizes)
        );
      }
    }
  );
}
