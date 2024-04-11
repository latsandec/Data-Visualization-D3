class DoughnutChart {
    // Definition of sleep type from wikipidia
    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        // TODO: adjust config according to the design and add parameters if needed
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 600,
            containerHeight: 500,
            margin: { top: 25, right: 25, bottom: 25, left: 25 },
            radius: 200,
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        // Create SVG area, initialize scale
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize scales
        vis.tooltipScale = d3.scaleOrdinal()
            .domain(["Rapid Eye Movement Sleep", "Deep Sleep", "Light Sleep"])
            .range(["Rapid eye movement sleep (REM sleep) is a unique phase of sleep in mammals and birds, characterized by random rapid movement <br />of the eyes, accompanied by low muscle tone throughout the body, and the propensity of the sleeper to dream vividly.",
                "Slow-wave sleep, often referred to as deep sleep, consists of stage three of non-rapid eye movement sleep.",
                "Non-rapid eye movement sleep, also known as light sleep, is unlike REM sleep, there is usually little or no eye movement during <br />these stages. Dreaming occurs during both sleep states, and muscles are not paralyzed as in REM sleep."]);

        vis.colorScale = d3.scaleOrdinal()
            .domain(["Rapid Eye Movement Sleep", "Deep Sleep", "Light Sleep"])
            .range(["#FFBC76", "#AD5A54", "#6D9E88"]);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Initialize arc area
        vis.arc = d3.arc()
            .innerRadius(vis.config.radius - 55)
            .outerRadius(vis.config.radius)
            .cornerRadius(10);

        vis.pie = d3.pie()
            .value(d => d.percentage)
            .padAngle(.01);

        // Append group element that will contain our actual chart (see margin convention)
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.width / 2},${vis.config.height / 2})`);


        vis.updateVis();

        // Add legend
        const legend = vis.svg.selectAll(".legend")
            .data(vis.pie(vis.nestedData.percent))
            .join("g")
            .attr('class', 'legend')
            .attr("transform", (d, i) => `translate(${vis.config.containerWidth - 210},${vis.config.containerHeight - 80 + (i * 22)})`)
            .attr("class", "legend");

        vis.svg.append("text")
            .text("Stages of sleep")
            .style("font-size", 18)
            .attr("fill", "#FFFACA")
            .attr("x", vis.config.containerWidth - 210)
            .attr("y", vis.config.containerHeight - 92);

        legend.append("rect")
            .attr("width", 17)
            .attr("height", 17)
            .attr("rx", 4)
            .attr("fill", d => vis.colorScale(vis.typeValue(d)));

        legend.append("text")
            .text(d => vis.typeValue(d))
            .style("font-size", 15)
            .attr("fill", "#FFFACA")
            .attr("y", 12)
            .attr("x", 22);

        // Tooltip event listeners
        legend.on('mouseover', (event, d) => {
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding - 40) + 'px')
                .html(`
          <div class='tooltip-title'>${vis.tooltipScale(vis.typeValue(d))}</div>
        `);
        })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });
    }

    updateVis() {
        // Prepare data
        let vis = this;
        vis.filteredData = vis.data.filter(d => individuals.includes(d.id));
        if (individuals.length == 0) {
            vis.filteredData = vis.data;
        }
        if (individuals.length == 1) {
            let single = vis.filteredData[0];
            vis.nestedData = {
                percent: [{ type: "Rapid Eye Movement Sleep", percentage: single.REMSleepPercentage },
                { type: "Deep Sleep", percentage: single.deepSleepPercentage },
                { type: "Light Sleep", percentage: single.lightSleepPercentage }],
                average: [{ title: "ID", value: single.id },
                { title: "Age", value: single.age },
                { title: "Sleep Duration", value: single.sleepDuration },
                { title: "Sleep Efficiency", value: single.sleepEfficiency }]
            };
        } else {
            vis.nestedData = {
                percent: [{ type: "Rapid Eye Movement Sleep", percentage: d3.mean(vis.filteredData, d => d.REMSleepPercentage) },
                { type: "Deep Sleep", percentage: d3.mean(vis.filteredData, d => d.deepSleepPercentage) },
                { type: "Light Sleep", percentage: d3.mean(vis.filteredData, d => d.lightSleepPercentage) }],
                average: [{ title: "Selected", value: vis.filteredData.length },
                { title: "Average Age", value: d3.mean(vis.filteredData, d => d.age) },
                { title: "Average Sleep Duration", value: d3.mean(vis.filteredData, d => d.sleepDuration) },
                { title: "Average Sleep Efficiency", value: d3.mean(vis.filteredData, d => d.sleepEfficiency) }]
            };
        }
        vis.typeValue = d => d.data.type;
        vis.renderVis();
    }

    renderVis() {
        // Bind data to visual elements
        let vis = this;
        
        // Add doughnut chart
        const arcs = vis.chart.selectAll(".arc")
            .data(vis.pie(vis.nestedData.percent))
            .join('path')
            .attr('class', 'arc')
            .attr("fill", d => vis.colorScale(vis.typeValue(d)))
            .attr("d", vis.arc);

        // Add text label on doughnut chart
        const label = vis.chart.selectAll(".label")
            .data(vis.pie(vis.nestedData.percent))
            .join("text")
            .attr('class', 'label')
            .attr("transform", d => "translate(" + vis.arc.centroid(d) + ")")
            .style("text-anchor", "middle")
            .style("font-size", 17)
            .style("font-weight", 600)
            .attr("fill", "white")
            .text(d => d3.format(".1f")(d.data.percentage) + "%");

        // Add text for detailed information
        const text = vis.svg.selectAll(".text")
            .data(vis.nestedData.average)
            .join("text")
            .attr('class', 'text')
            .attr("transform", (d, i) => `translate(${vis.config.width / 2},${vis.config.height / 2 - 60 + (i * 35)})`)
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", 500)
            .attr("fill", "#FFFACA")
            .text(d => {
                if (d.title == "Sleep Duration" || d.title == "Average Sleep Duration") {
                    return d.title + " : " + d3.format(".1f")(d.value) + " h";
                } else if (d.title == "Selected" || d.title == "Age" || d.title == "ID") {
                    return d.title + " : " + d3.format(".0f")(d.value);
                } else {
                    return d.title + " : " + d3.format(".1f")(d.value);
                }
            });
    }
}