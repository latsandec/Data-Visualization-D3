class ScatterPlot {


    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        // TODO: adjust config according to the design and add parameters if needed
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 480,
            margin: {top: 15, right: 15, bottom: 20, left: 30},
            tooltipPadding: 5
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        // Create SVG area, initialize scales and axes
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize scales
        vis.xScale = d3.scaleLinear()
            .range([10, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height-10, 10]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(15)
            .tickSize(-vis.height + 10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(10)
            .tickSize(-vis.width - 10)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height-10})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(10,5)`);

        // Append both axis titles
        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height - 24)
            .attr('x', vis.width + 10)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Age');

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 3)
            .attr('dy', '.71em')
            .text('Sleep Efficiency');

        vis.group = d3.group(vis.data, d => d.ageGroup, d => d.sleepDuration);
    }

    updateVis() {
        // Prepare data and scales
        let vis = this;

        // Specificy accessor functions
        vis.xValue = d => d.age;
        vis.yValue = d => d.sleepEfficiency;

        // Set the scale input domains
        vis.xScale.domain([5, 70]);
        vis.yScale.domain([0.4, 1]);

        vis.renderVis();
    }

    renderVis() {
        // Bind data to visual elements, update axes
        let vis = this;

        // Add circles
        const circles = vis.chart.selectAll('.point')
            .data(vis.data)
            .join('circle')
            .attr('class', function (d) {
                if (individuals.includes(d.id)) {
                    return 'point active';
                } else {
                    return 'point';
                }
            })
            .attr('r', 7)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .on('click', function(event, d) {
                let ageGroup = d.ageGroup;
                let sleepDuration = d.sleepDuration;
                let id = d.id;
                let key = ageGroup.concat(",").concat(sleepDuration);

                const isActive = individuals.includes(d.id);
                if (isActive) {
                    individuals = individuals.filter(f => f !== d.id); // Remove filter
                } else {
                    individuals.push(d.id); // Append filter
                }

                let group = vis.group.get(d.ageGroup).get(d.sleepDuration);
                let isAgeDurationActive = ageDurationFilter.includes(key);
                let pointsIncluded = group.filter(d => individuals.includes(d.id));

                // Filter data for heatmap
                if (isAgeDurationActive && isActive) {
                    if (pointsIncluded.length === 0) {
                        ageDurationFilter = ageDurationFilter.filter(f => f !== key);
                        d3.select(this).classed('active', !isActive);
                    }
                } else if (!isAgeDurationActive && !isActive){
                    ageDurationFilter.push(key);
                    d3.select(this).classed('active', !isActive);
                }

                // update other charts
                heatmap.updateVis();
                doughnutChart.updateVis();
                d3.select(this).classed('active', !isActive); // Add class to style active filters with CSS

            });

        // Tooltip event listeners
        circles
            .on('mouseover', (event,d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
              <div class="tooltip-title">Age: ${d.age}</div>
              <div><i>Sleep Efficiency: ${d.sleepEfficiency}</i></div>
                <li>Sleep Duration: ${d.sleepDuration} hours</li>
                <li>Caffeine Consumption: ${d.caffeineConsumption} mg</li>
                <li>Alcohol Consumption: ${d.alcoholConsumption} oz</li>
                <li>Exercise Frequency: ${d.exerciseFrequency} times</li>
            `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())
    }

}