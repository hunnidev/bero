// THIS FILE IS JUST FOR REFERENCE OF THE METHODS CREATED

// Subscribe to Klaviyo Mailing List
// Present in sections/pbj-account-dashboard-main.liquid

async function klaviyoSubscribeToList() {
    const co = "UYwKnY";
    const formElement = document.getElementById('kl_subscribe_list');
    const successMessage = document.querySelector('.success');
    const errorMessage = document.querySelector('.error');
    const id_list = formElement.querySelector('input[name="kl_list"]').value;
    const user_email = formElement.querySelector('input[name="user_email"]').value;
    const zip_code = formElement.querySelector('input[name="user_zip"]').value;
    const nl_block = document.querySelector('.nl-block');
    const options = {
        method: 'POST',
        headers: { revision: '2024-07-15', 'content-type': 'application/json' },
        body: JSON.stringify({
            data: {
                type: 'subscription',
                attributes: {
                    profile: {
                        data: {
                            type: 'profile',
                            attributes: {
                                location: { zip: zip_code },
                                email: user_email,
                            },
                        }
                    },
                    custom_source: 'Account dashboard subscribe button'
                },
                relationships: { list: { data: { type: 'list', id: id_list } } }
            }
        })
    };

    try {
        let result = await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${co}`, options);

        if (!result.ok) {
            // console.log(result);            
                result = await result.json();
                // console.log(result);            
            throw new Error(result.errors?.[0]?.detail || 'Unknown error occurred');
        }

        nl_block.classList.add('hidden');
        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        console.log(`Form submitted`);
    } catch (e) {
        successMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = `Failed to subscribe: ${e.message}`;
        console.log(`Failed to subscribe. Reason: "${e.message}"`);
    }
}

// KLAVIYO FORMS ZIP CODE VALIDATION (5 digit, numeric)
// Present in snippets/script-klaviyo-form-validation.liquid -> rendered in layout/theme.liquid
document.addEventListener('DOMContentLoaded', function () {    
    window.addEventListener("klaviyoForms", function (e) {
        if (e.detail.type == 'embedOpen') {
            setTimeout(() => {
                console.log("klaviyo embed form opened");
                let zipCodeInputs = document.querySelectorAll('.klaviyo-form input[id*="Zip_Code"]');
                if (zipCodeInputs.length) {
                  zipCodeInputs.forEach((input) => {
                    input.setAttribute('oninput', "this.value = this.value.replace(/[^0-9]/g, '').slice(0, 5)");
                  });
                }              
            }, 2000);
        }
    });
  });

//   KLAVIYO SUBSCRIBE TO STOCK ALERT SCRIPTS
// Present in assets/product-info.js
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
  
          subscribeToMailingList = formElement.querySelector('input[name="list_subscribe"]').checked;
          if (subscribeToMailingList) {
            console.log('subscribing to mailing list!')
            let resultSubscribe = await pdpKlaviyoSubscribeToList(formElement);
            if (!resultSubscribe.ok) {
              resultSubscribe = await resultSubscribe.json();
              throw new Error(resultSubscribe.errors[0].detail);
            }
          };
  
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
    const email = formElement.querySelector('input[name="user_email"]').value;
    const variant = formElement.querySelector('input[name="variant"]').value;
    
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        revision: '2024-07-15',
        'content-type': 'application/json',
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
  
    let result;
  
    return fetch(`https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=${co}`, options)
      .then((response) => {
        result = response;
        return result;
      })
      .catch((err) => console.error(err));
  }
  
  window.subscribeProductStockToKlaviyo = subscribeProductStockToKlaviyo;
  
  function pdpKlaviyoSubscribeToList(formElement) {
    const co = "UYwKnY";
    const successMessage = document.querySelector('.success');
    const errorMessage = document.querySelector('.error');
    const id_list = formElement.querySelector('input[name="kl_list"]').value;
    const user_email = formElement.querySelector('input[name="user_email"]').value;
  
    const nl_block = document.querySelector('.nl-block');
  
    const options = {
      method: 'POST',
      headers: { revision: '2024-07-15', 'content-type': 'application/json' },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: user_email,
                },
              }
            },
            custom_source: 'PDP stock alert subscribe button'
          },
          relationships: { list: { data: { type: 'list', id: id_list } } }
        }
      })
    };
  
    let result;
  
    return fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${co}`, options)
      .then((response) => {
        result = response;
        return result;
      })
      .catch((err) => console.error(err));
  
  }

  window.pdpKlaviyoSubscribeToList = pdpKlaviyoSubscribeToList;