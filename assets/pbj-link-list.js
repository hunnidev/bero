document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const currentLinkViewParam = urlParams.get('view');
    
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.pbj-link-list .list-menu__item');


    for (const item of menuItems) {
        const itemHref = item.getAttribute('href');
        if (itemHref.includes(currentPath) &&
            (!currentLinkViewParam || itemHref.includes('?view=' + currentLinkViewParam))) {
            item.classList.add('list-menu__active');
            break;
        }
    }

    const mobileSelect = document.querySelector('.pbj-link-list select');

    const mobileMenuItems = document.querySelectorAll('.pbj-link-list select option');

    for (const item of mobileMenuItems) {
        const mobItemHref = item.getAttribute('value');        
        if (mobItemHref.includes(currentPath) &&
            (!currentLinkViewParam || mobItemHref.includes('?view=' + currentLinkViewParam))) {
            item.selected = true;
            item.disabled = true;
            break;
        }
    }

    mobileSelect.addEventListener('change', function () {
        if (this.value) {
            window.location.href = this.value;
        }
    });

});        