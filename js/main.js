// Initialize global variables
let innovativeVis,
    vis1,
    chart,
    groupedBarChart;

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
    innovativeVis = new InnovativeVis("innovative-div", dataArray[1]);
    vis1 = new Vis1("vis1", dataArray[0]);
    chart = new BarChart("barchart-secondhand",  dataArray[1]);
    groupedBarChart = new GroupedBarChart("grouped-barchart-div", dataArray[1]);
}
