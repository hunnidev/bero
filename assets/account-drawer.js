const drawer = document.querySelector("account-drawer");
const drawerOverlay = document.querySelector(".account-drawer__overlay");
const drawerCloseBtn = drawer.querySelector(".close-btn");
const drawerInner = document.querySelector(".drawer__inner-account");

drawer.addEventListener("click", function(e) {
    if (e.target.classList.contains("drawer")) {
        drawerOverlay.style.visibility = "visible";
        drawerInner.style.visibility = "visible";
        drawer.classList.add("active");
        e.stopPropagation();
    }
});

drawerOverlay.addEventListener("click", function(e) {
    if (e.target.classList.contains("account-drawer__overlay")) {
        drawer.classList.remove("active");
        drawerOverlay.style.visibility = "hidden";
        drawerInner.style.visibility = "hidden";
    }
});

drawerCloseBtn.addEventListener("click", function(e) {
    drawer.classList.remove("active");
    drawerOverlay.style.visibility = "hidden";
    drawerInner.style.visibility = "hidden";
});

//Add listener to the header icon

const headerIcon = document.querySelector(".account-icon-header-anchor");
const headerIconMobile = document.querySelector(".account-icon-header-anchor-mobile");

headerIcon.addEventListener("click", function(e) {
    e.preventDefault();
    
    drawer.classList.add("active");
    drawerOverlay.style.visibility = "visible";
    drawerInner.style.visibility = "visible";
});

headerIconMobile.addEventListener("click", function(e) {
    e.preventDefault();
    
    drawer.classList.add("active");
    drawerOverlay.style.visibility = "visible";
    drawerInner.style.visibility = "visible";
});

//Display logic between forms 

const registerForm = document.querySelector("account-drawer .customer.register");
const loginForm = document.querySelector("account-drawer .customer.login");

registerForm.style.display = "none";

const registerTrigger = loginForm.querySelector("#register-now"); // I know, I was lazy and used the same class name for both buttons, but did not want to write styling twice
const loginTrigger = registerForm.querySelector("#sign-in-now");

registerTrigger.addEventListener("click", function(e) {
    e.preventDefault();
    registerForm.style.display = "block";
    loginForm.style.display = "none";
});

loginTrigger.addEventListener("click", function(e) {
    e.preventDefault();
    loginForm.style.display = "block";
    registerForm.style.display = "none";
});

//Show password

function showPassword(e) {
    const passwordInput = e.parentNode.querySelector("input");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}