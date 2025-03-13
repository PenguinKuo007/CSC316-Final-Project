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

    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    };

    innovativeVis = new InnovativeVis("innovative-div", dataArray[1]);
    vis1 = new Vis1("vis1", dataArray[0]);
    chart = new BarChart("barchart-secondhand",  dataArray[1]);
    groupedBarChart = new GroupedBarChart("grouped-barchart-div", dataArray[1]);
    vis2 = new Vis2("vis2", dataArray[0]);
    visBrush = new VisBrush("visBrush", dataArray[0], eventHandler);


    eventHandler.bind("selectionChanged", function(event){
        let rangeStart = event.detail[0];
        let rangeEnd = event.detail[1];

        vis2.onSelectionChange(rangeStart, rangeEnd);


    });
}
