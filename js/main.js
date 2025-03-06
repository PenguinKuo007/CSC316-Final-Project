// Initialize global variables
// let innovativeVis;

// Load data using promises
let promises = [
    d3.csv("data/lung_cancer_data.csv"),
    d3.csv("data/lung_cancer_prediction.csv")
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data);
    })
    .catch(function (err) {
        console.error(err);
    });

function initMainPage(dataArray) {
    // innovativeVis = new InnovativeVis("innovative-div", dataArray[1]);
}
