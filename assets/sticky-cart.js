function updateStickyCart(optionName, price, currencySymbol) {
    //Update value
    const stickyCartOptionLabel = document.querySelector('.sticky-product-bar__info .variant-value');
    if (stickyCartOptionLabel) stickyCartOptionLabel.innerHTML = optionName;

    //Update price
    const stickyCartPrice = document.querySelector('.sticky-product-bar__actions .price-item');
    if (stickyCartPrice) stickyCartPrice.innerHTML = `${currencySymbol}${parseFloat(price / 100).toFixed(2)}`;
}

function scrollToTitle() {
    console.log('Scrolling to title');
    let title1 = document.querySelector('#product-title');
    let title2 = document.querySelector('variant-selects');

    title1.scrollIntoView()
    title2.scrollIntoView({block: "center", inline: "nearest"})
}

function scrollStickyCartToVisible() {
    const productRecommendations = document.querySelector('product-recommendations.related-products');
    productRecommendations.scrollIntoView({block: "start", inline: "nearest"});
}

function stickyCartVisibleOnFocus(){
    const stickyCart = document.querySelector('.sticky-product-bar');

    stickyCart.classList.add('sticky-product-bar--show');
    
}