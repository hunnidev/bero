if (!customElements.get("recipient-form")) {
  customElements.define(
    "recipient-form",
    class RecipientForm extends HTMLElement {
      constructor() {
        super();
        this.recipientFieldsLiveRegion = this.querySelector(
          `#Recipient-fields-live-region-${this.dataset.sectionId}`
        );
        this.checkboxInput = this.querySelector(
          `#Recipient-checkbox-${this.dataset.sectionId}`
        );
        this.checkboxInput.disabled = false;
        this.hiddenControlField = this.querySelector(
          `#Recipient-control-${this.dataset.sectionId}`
        );
        this.hiddenControlField.disabled = true;
        this.emailInput = this.querySelector(
          `#Recipient-email-${this.dataset.sectionId}`
        );
        this.nameInput = this.querySelector(
          `#Recipient-name-${this.dataset.sectionId}`
        );
        this.messageInput = this.querySelector(
          `#Recipient-message-${this.dataset.sectionId}`
        );
        this.sendonInput = this.querySelector(
          `#Recipient-send-on-${this.dataset.sectionId}`
        );
        this.offsetProperty = this.querySelector(
          `#Recipient-timezone-offset-${this.dataset.sectionId}`
        );
        if (this.offsetProperty)
          this.offsetProperty.value = new Date().getTimezoneOffset().toString();

        // Add date validation setup with 90 days limit
        if (this.sendonInput) {
          const today = new Date().toISOString().split('T')[0];
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + 90);
          
          this.sendonInput.setAttribute('min', today); // Add minimum date
          this.sendonInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
          this.sendonInput.addEventListener('input', this.validateDate.bind(this));
          this.sendonInput.addEventListener('keydown', this.preventInvalidDate.bind(this));
          this.sendonInput.addEventListener('change', this.validateDate.bind(this));
          
          // Find the closest form and add submit validation
          const form = this.closest('form');
          if (form) {
            form.addEventListener('submit', this.validateFormSubmission.bind(this));
          }
        }

        this.errorMessageWrapper = this.querySelector(
          ".product-form__recipient-error-message-wrapper"
        );
        this.errorMessageList = this.errorMessageWrapper?.querySelector("ul");
        this.errorMessage =
          this.errorMessageWrapper?.querySelector(".error-message");
        this.defaultErrorHeader = this.errorMessage?.innerText;
        this.currentProductVariantId = this.dataset.productVariantId;
        this.addEventListener("change", this.onChange.bind(this));
        this.onChange();
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;
      cartErrorUnsubscriber = undefined;

      getMaxDate() {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90);
        maxDate.setHours(0, 0, 0, 0);
        return maxDate;
      }

      getMinDate() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }

      validateFormSubmission(event) {
        if (this.checkboxInput.checked) {
          const isValid = this.validateDate({ target: this.sendonInput });
          if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
        }
        return true;
      }

      validateDate(event) {
        const input = event.target;
        const selectedDate = new Date(input.value);
        const maxDate = this.getMaxDate();
        const minDate = this.getMinDate();

        // Check if the date is invalid or empty
        if (!input.value || isNaN(selectedDate.getTime())) {
          this.displayErrorMessage(
            'Invalid Date',
            { sendon: ['Please select a valid date'] }
          );
          return false;
        }

        // Check if date is before today
        if (selectedDate < minDate) {
          input.value = minDate.toISOString().split('T')[0];
          this.displayErrorMessage(
            'Invalid Date',
            { sendon: ['Date cannot be in the past'] }
          );
          return false;
        }

        // Check if date is more than 90 days in the future
        if (selectedDate > maxDate) {
          input.value = maxDate.toISOString().split('T')[0];
          this.displayErrorMessage(
            'Invalid Date',
            { sendon: ['Date cannot be more than 90 days in the future'] }
          );
          return false;
        }

        this.clearErrorMessage();
        return true;
      }

      preventInvalidDate(event) {
        const input = event.target;
        const currentValue = input.value;
        
        if (event.ctrlKey || event.metaKey || event.keyCode === 8 || event.keyCode === 46) {
          return;
        }

        setTimeout(() => {
          const newValue = input.value;
          if (newValue !== currentValue) {
            this.validateDate({ target: input });
          }
        }, 0);
      }

      // ... rest of the existing code remains the same ...
    }
  );
}
