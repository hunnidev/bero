
//t is the date in unix format

function fastInit(t, duration = 5000) {
    let now = new Date().getTime();
    let diff = t - now;
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));

    updateTimerRandom(t)// Executes every second

}

function updateTimerRandom(t) {
    let now = new Date().getTime();
    let diff = t - now;
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const nums = document.querySelectorAll('.num');
    const reversedArray = [];

    nums.forEach((element) => {
        reversedArray.unshift(element);
    });

    let stop = false

    reversedArray.forEach((num, index) => {

        if (num.innerHTML == (days - 1)) {
            stop = true;
        };

        if (stop) return;
        setTimeout(() => {
            nums.forEach(num => num.classList.remove('active'));
            num.classList.toggle('active');
        }, 250 * (index + 1))
        
    });
}

fastInit(new Date("Oct 16, 2024").getTime())