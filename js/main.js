/**
 * Load data from CSV file asynchronously and render charts
 */

// global objects
let data, doughnutChart, scatterPlot, heatmap;
let individuals = [];
let ageDurationFilter = [];
let sp_hp = [];

d3.csv('data/Sleep_Efficiency_preprocessed.csv').then(_data => {
    data = _data;
    data.forEach(d => {
        d.age = +d.age;
        d.id = +d.id;
        d.sleepDuration = +d.sleepDuration;
        d.sleepEfficiency = +d.sleepEfficiency;
        d.REMSleepPercentage = +d.REMSleepPercentage;
        d.deepSleepPercentage = +d.deepSleepPercentage;
        d.lightSleepPercentage = +d.lightSleepPercentage;
        d.caffeineConsumption = +d.caffeineConsumption;
        d.alcoholConsumption = +d.alcoholConsumption;
        d.exerciseFrequency = +d.exerciseFrequency;
        if (d.time.charAt(0) == '0') {
            d.time = "02 " + d.time;
        } else {
            d.time = "01 " + d.time;
        }
        if (d.age >= 0 && d.age <= 9) {
            d.ageGroup = '0-9';
        } else if (d.age >= 10 && d.age <= 19) {
            d.ageGroup = '10-19';
        } else if (d.age >= 20 && d.age <= 29) {
            d.ageGroup = '20-29';
        } else if (d.age >= 30 && d.age <= 39) {
            d.ageGroup = '30-39';
        } else if (d.age >= 40 && d.age <= 49) {
            d.ageGroup = '40-49';
        } else if (d.age >= 50 && d.age <= 59) {
            d.ageGroup = '50-59';
        } else if (d.age >= 60 && d.age <= 69) {
            d.ageGroup = '60-69';
        }
    });

    // TODO: commented out to avoid errors, uncomment for testing purpose
    doughnutChart = new DoughnutChart({
        parentElement: '#doughnutchart',
    }, data);
    doughnutChart.updateVis();

    scatterPlot = new ScatterPlot({
        parentElement: '#scatterplot',
    }, data);
    scatterPlot.updateVis();

    heatmap = new Heatmap({
        parentElement: '#heatmap',
    }, data, 'caffeine');
    heatmap.updateVis();

    // TODO: take a look at variables after transformation first
    console.log(data);
});
/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */

d3.selectAll("input").on("change", function(){
    heatmap.category = this.id;
    heatmap.updateVis();
});
