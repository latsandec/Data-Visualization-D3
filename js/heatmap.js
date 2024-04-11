class Heatmap {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _cat) {
        // TODO: adjust config according to the design and add parameters if needed
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 380,
            margin: {top: 15, right: 15, bottom: 20, left: 25},
            legendWidth: 150,
            legendBarHeight: 10,
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.category = _cat;
        this.initVis();
    }

    initVis() {
        // Create SVG area, initialize scales and axes
        const vis = this;
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRgb("#FFFACA", "green"));

        vis.xScale = d3.scaleBand()
            .range([27, vis.config.width - 40]);

        vis.yScale = d3.scaleBand()
            .range([0, vis.config.height-25])
            .paddingInner(0.05);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(11)
            .tickSize(0)
            .tickFormat(d3.format(".1f")) // Remove comma delimiter for thousands
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(0);

        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.height-22})`);

        // Append y-axis group
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(25,5)`);

        // Append both axis titles
        vis.chartArea.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.config.height+5)
            .attr('x', vis.config.width)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Sleep duration (h)');

        vis.chartArea.append('text')
            .attr('class', 'axis-title')
            .attr('x', -22)
            .attr('y', -13)
            .attr('dy', '.71em')
            .text('Age group');

        // prep for legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.containerWidth - vis.config.legendWidth - vis.config.margin.right},30)`);

        vis.legendColorGradient = vis.legend.append('defs').append('linearGradient')
            .attr('id', 'linear-gradient');

        vis.legendColorRamp = vis.legend.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendBarHeight)
            .attr('fill', 'url(#linear-gradient)');

        vis.xLegendScale = d3.scaleLinear()
            .range([0, vis.config.legendWidth]);

        vis.xLegendAxis = d3.axisBottom(vis.xLegendScale)
            .tickSize(vis.config.legendBarHeight + 3)
            .tickFormat(d3.format('.1f'));

        vis.xLegendAxisG = vis.legend.append('g')
            .attr('class', 'axis x-axis legend-axis');

        vis.updateVis();
    }

    updateVis() {
        // Prepare data and scales
        const vis = this;
        let values = [];
        // Calculate group means based on category
        if (vis.category === 'caffeine') {
            vis.groupedData = d3.rollups(vis.data, v => {
                let avg = d3.mean(v, d => d.caffeineConsumption);
                values.push(avg);
                return avg;
            }, d => d.ageGroup, d => d.sleepDuration);
            vis.legendLabel = ["Consumption in mg"];
        } else if (vis.category === 'alcohol') {
            vis.groupedData = d3.rollups(vis.data, v => {
                let avg = d3.mean(v, d => d.alcoholConsumption);
                values.push(avg);
                return avg;
            }, d => d.ageGroup, d => d.sleepDuration);
            vis.legendLabel = ["Consumption in oz"];
        } else if (vis.category === 'exercise') {
            vis.groupedData = d3.rollups(vis.data, v => {
                let avg = d3.mean(v, d => d.exerciseFrequency);
                values.push(avg);
                return avg;
            }, d => d.ageGroup, d => d.sleepDuration);
            vis.legendLabel = ["Frequency in days"];
        }
        vis.groupedData.forEach((row) => {
            row[1].forEach((cell) => {
                cell.push(vis.data.filter(d => d.ageGroup === row[0] && d.sleepDuration === cell[0]).length);
            });
        });
        // set legend color and range
        let max = d3.max(values);
        let min = d3.min(values);
        vis.colorScale.domain([min, max]);
        // prepare scales
        vis.yValue = d => d[0];
        vis.colorValue = d => d[1];
        vis.xValue = d => d[0];
        vis.xScale.domain([5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
        vis.yScale.domain(vis.groupedData.map(vis.yValue).sort(d3.ascending));
        vis.renderVis();
        vis.renderLegend();
    }

    renderVis() {
        // Bind data to visual elements, update axes
        const vis = this;
        // Bind data to selection and use the name of each state (d[0]) as a key
        const row = vis.chartArea.selectAll('.h-row')
            .data(vis.groupedData, d => d[0])
            .join('g')
            .attr('class', 'h-row')
            .attr('age-group', d => d[0])
            .attr('transform', d => `translate(0,${vis.yScale(vis.yValue(d))})`);

        const cellWidth = (vis.config.width / 12 - 2);

        const cell = row.selectAll('.h-cell')
            .data(d => d[1])
            .join('rect')
            .attr('class', function (d) {
                if (ageDurationFilter.includes(this.parentNode.getAttribute("age-group").concat(",").concat(d[0]))) {
                    return 'h-cell active';
                } else {
                    return 'h-cell';
                }
            })
            .attr('height', vis.yScale.bandwidth())
            .attr('width', cellWidth)
            .attr('x', d => vis.xScale(vis.xValue(d)))
            .attr('fill', d => {
                if (d[1] === null) {
                    return '#fff';
                } else {
                    return vis.colorScale(vis.colorValue(d));
                }
            })
            .on('mouseover', (event, d) => {
                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`<div class='tooltip-title'>Number of people: ${d[2]}</div>`);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', function (event, d) {
                let ageGroup = this.parentNode.getAttribute("age-group");
                let sleepDuration = d[0];
                let key = ageGroup.concat(",").concat(sleepDuration);

                const isActive = ageDurationFilter.includes(key);
                if (isActive) {
                    ageDurationFilter = ageDurationFilter.filter(f => f !== key); // Remove filter
                } else {
                    ageDurationFilter.push(key); // Append filter
                }
                let points = vis.data.filter(d => (d.ageGroup === ageGroup && d.sleepDuration === sleepDuration));
                points.map((d) => {
                    const isPresent = individuals.includes(d.id);
                    if (isActive && isPresent) {
                        individuals = individuals.filter(f => f !== d.id); // Remove filter
                        d3.select(this).classed('active', !isActive);
                    } else if (!isActive && !isPresent){
                        individuals.push(d.id); // Append filter
                        d3.select(this).classed('active', !isActive);
                    }
                     // Add class to style active filters with CSS
                })
                // update other charts
                scatterPlot.updateVis();
                doughnutChart.updateVis();
                d3.select(this).classed('active', !isActive);
            });
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }

    /**
     * Update colour legend
     */
    renderLegend() {
        const vis = this;

        // Add stops to the gradient
        // Learn more about gradients: https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient
        vis.chartArea.selectAll('.legend-label')
            .data(vis.legendLabel)
            .join("text")
            .attr("class", "legend-label")
            .text(d => d)
            .style("font-size", 16)
            .attr("fill", "#FFFACA")
            .attr("x", vis.config.containerWidth - vis.config.legendWidth - vis.config.margin.right-25)
            .attr("y", 5);

        vis.legendColorGradient.selectAll('stop')
            .data(vis.colorScale.range())
            .join('stop')
            .attr('offset', (d, i) => i / (vis.colorScale.range().length - 1))
            .attr('stop-color', d => d);

        // Set x-scale and reuse colour-scale because they share the same domain
        // Round values using `nice()` to make them easier to read.
        vis.xLegendScale.domain(vis.colorScale.domain()).nice();
        const extent = vis.xLegendScale.domain();

        // Manually calculate tick values
        vis.xLegendAxis.tickValues([
            extent[0],
            parseFloat(extent[1] / 4),
            parseFloat(extent[1] / 2),
            parseFloat(extent[1] / 4 * 3),
            extent[1]
        ]);

        // Tooltip event listeners
        vis.legend
            .on('mouseover', (event) => {
                if (vis.category === 'caffeine') {
                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`
              <div class='tooltip-title'>the average amount of caffeine consumed in the 24 hours prior to bedtime (in mg)</div>
            `);
                } else if (vis.category === 'alcohol') {
                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`
              <div class='tooltip-title'>the average amount of alcohol consumed in the 24 hours prior to bedtime (in oz)</div>
            `);
                } else if (vis.category === 'exercise') {
                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`
              <div class='tooltip-title'>the average number of times the test subject exercises each week</div>
            `);
                }
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Update legend axis
        vis.xLegendAxisG.call(vis.xLegendAxis);
    }

}