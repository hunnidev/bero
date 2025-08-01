const selectors = {
    customerAddresses: '[data-customer-addresses]',
    addressCountrySelect: '[data-address-country-select]',
    addressContainer: '[data-address]',
    toggleAddressButton: 'button[aria-expanded]',
    cancelAddressButton: 'button[type="reset"]',
    deleteAddressButton: 'button[data-confirm-message]',
  };
  
  const attributes = {
    expanded: 'aria-expanded',
    confirmMessage: 'data-confirm-message',
  };
  
  class CustomerAddresses {
    constructor() {
      this.elements = this._getElements();
      if (Object.keys(this.elements).length === 0) return;
      this._setupCountries();
      this._setupEventListeners();
    }
  
    _getElements() {
      const container = document.querySelector(selectors.customerAddresses);
      return container
        ? {
            container,
            addressContainer: container.querySelector(selectors.addressContainer),
            toggleButtons: document.querySelectorAll(selectors.toggleAddressButton),
            cancelButtons: container.querySelectorAll(selectors.cancelAddressButton),
            deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
            countrySelects: container.querySelectorAll(selectors.addressCountrySelect),
          }
        : {};
    }
  
    _setupCountries() {
      if (Shopify && Shopify.CountryProvinceSelector) {
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
          hideElement: 'AddressProvinceContainerNew',
        });
        this.elements.countrySelects.forEach((select) => {
          const formId = select.dataset.formId;
          // eslint-disable-next-line no-new
          new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
            hideElement: `AddressProvinceContainer_${formId}`,
          });
        });
      }
    }
  
    _setupEventListeners() {
      this.elements.toggleButtons.forEach((element) => {
        element.addEventListener('click', this._handleAddEditButtonClick);
      });
      this.elements.cancelButtons.forEach((element) => {
        element.addEventListener('click', this._handleCancelButtonClick);
      });
      this.elements.deleteButtons.forEach((element) => {
        element.addEventListener('click', this._handleDeleteButtonClick);
      });
    }
  
    _toggleExpanded(target) {
      target.setAttribute(attributes.expanded, (target.getAttribute(attributes.expanded) === 'false').toString());
    }
  
    _handleAddEditButtonClick = ({ currentTarget }) => {
      this._toggleExpanded(currentTarget);
    };
  
    _handleCancelButtonClick = ({ currentTarget }) => {
      this._toggleExpanded(currentTarget.closest(selectors.addressContainer).querySelector(`[${attributes.expanded}]`));
    };
  
    _handleDeleteButtonClick = ({ currentTarget }) => {
      // eslint-disable-next-line no-alert
      if (confirm(currentTarget.getAttribute(attributes.confirmMessage))) {
        Shopify.postLink(currentTarget.dataset.target, {
          parameters: { _method: 'delete' },
        });
      }
    };
  }
  
  function handleDeleteButtonClick(event) {
    const { currentTarget } = event;
    const confirmMessage = currentTarget.getAttribute('data-confirm-message');

    if (confirm(confirmMessage)) {
      Shopify.postLink(currentTarget.dataset.target, {
        parameters: { _method: 'delete' },
      });
    }
  }

  // Account form updating code
  const forms = document.querySelectorAll('form')
  forms.forEach((form) =>{
    const countrySelects = form.querySelector('[data-address-country-select]') || null;
    if(countrySelects != null){
      let formID = ('').concat('_', countrySelects.id.split('_')[1]);
      countrySelects.addEventListener('change', ()=>{
        console.log('-- change -- ')
        console.log(countrySelects.value)
        console.log('--> ', formID)
        codeUpdate(form, formID, countrySelects)
      })
    }
    const newCountrySelects = form.querySelector(`#AddressCountryNew`) || null;
    if(newCountrySelects != null){
      newCountrySelects.addEventListener('change', ()=>{
        console.log('-- new change -- ')
        console.log(newCountrySelects.value)
        codeUpdate(form, 'New', newCountrySelects)
      })
    }
  })
  function codeUpdate(form, formID, countrySelects) {
    let input = form.querySelector(`#AddressZip${formID}`);
    let label = form.querySelector(`[for="AddressZip${formID}"]`);
    console.log('i: ', input);
    console.log('l: ', label);
    if(countrySelects.value === 'United Kingdom') {
      console.log('UK')
      input.attributes.placeholder = 'Postcode';
      label.innerText = 'Postcode';
    } else {
      console.log('not UK')
      input.attributes.placeholder = 'Zip code';
      label.innerText = 'Zip code';
    }
  }