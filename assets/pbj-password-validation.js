let pswInput = document.getElementById("RegisterForm-password");
let submitFormBtn = document.getElementById("register-button");
const registerForm = document.getElementById('create_customer');

let letter = document.getElementById("letter");
var capital = document.getElementById("capital");
var number = document.getElementById("number");
var symbol = document.getElementById("symbol");
var length = document.getElementById("length");

var isValid = false;

// When the user starts to type something inside the password field
pswInput.oninput = function() {


    // Validate lowercase letters
    let lowerCaseLetters = /[a-z]/g;
    if(pswInput.value.match(lowerCaseLetters)) {
      letter.classList.remove("invalid");
      letter.classList.add("valid");
      isValid = true;
    } else {
      letter.classList.add("invalid");
      letter.classList.remove("valid");
      pswInput.setAttribute('aria-describedby', letter.id);
  }

    // Validate capital letters
    let upperCaseLetters = /[A-Z]/g;
    if(pswInput.value.match(upperCaseLetters)) {
      capital.classList.remove("invalid");
      capital.classList.add("valid");
      isValid = true;
    } else {
      capital.classList.add("invalid");
      capital.classList.remove("valid");
      pswInput.setAttribute('aria-describedby', capital.id);
    }

    // Validate numbers
    let numbers = /[0-9]/g;
    if(pswInput.value.match(numbers)) {
      number.classList.remove("invalid");
      number.classList.add("valid");
      isValid = true;
    } else {
      number.classList.add("invalid");
      number.classList.remove("valid");
      pswInput.setAttribute('aria-describedby', number.id);
    }

    // Validate symbol
    let symbols = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    if(pswInput.value.match(symbols)) {
      symbol.classList.remove("invalid");
      symbol.classList.add("valid");
    } else {
      isValid = false;
      symbol.classList.add("invalid");
      symbol.classList.remove("valid");
      pswInput.setAttribute('aria-describedby', symbol.id);
    }

    // Validate length
    if(pswInput.value.length >= 5) {
      length.classList.remove("invalid");
      length.classList.add("valid");
    } else {
      isValid = false;
      length.classList.add("invalid");
      length.classList.remove("valid");
      pswInput.setAttribute('aria-describedby', length.id);

    }

    if (!isValid) {
      pswInput.setAttribute('aria-invalid', 'true');
    } else {
      pswInput.setAttribute('aria-invalid', 'false');
      pswInput.removeAttribute('aria-describedby');
    }

    // submitFormBtn.disabled = !isValid;
  }

  //Disable submit if password is invalid

  registerForm.addEventListener('submit', (e) => {
    if (!isValid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log(e)
        pswInput.focus();
        console.log('invalid submission')
    } else {
        e.target.submit();
    }
  });

  function showPassword(e) {
    const passwordInput = e.parentNode.querySelector("input");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}