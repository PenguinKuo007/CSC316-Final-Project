class InnovativeVis {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.displayInnerDonut = []; // For innermost donut chart
        this.displayOuterDonut = []; // For outermost donut chart
        this.displayCircles = [];    // For circles

        this.oldInnerDonut = {}; // Keep track of old donut data 
        this.oldOuterDonut = {}; // for transitioning

        this.smokingStatuses = ["Smoker", "Former Smoker", "Non-Smoker"];
        this.cancerStages = ["I", "II", "III", "IV"];
        this.mortalityRisks = [0.3, 0.6, 0.9]; // Sample numbers for legend

        this.filterStatus = ""; // Filter the smoking status

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 220, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Initialize drawing area
        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);
        
        
        // Initialize donut chart group
        vis.chartGroup = vis.svg.append("g")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`);
        
        // Donut chart settings
        vis.outerRadius2 = Math.min(vis.width, vis.height) / 2.5;
        vis.innerRadius1 = vis.outerRadius2 / 3;
        vis.outerRadius1 = (vis.outerRadius2 + vis.innerRadius1) / 2.3;
        vis.innerRadius2 = vis.outerRadius1 * 1.1;

        // Define donut chart layout
        vis.pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        // Define path generators for arcs
        vis.innerArc = d3.arc() // For innermost donut chart
            .innerRadius(vis.innerRadius1)
            .outerRadius(vis.outerRadius1);
        
        vis.outerArc = d3.arc() // For outermost donut chart
            .innerRadius(vis.innerRadius2)
            .outerRadius(vis.outerRadius2);
        
        
        // Define scale for circle radius
        vis.radiusScale = d3.scaleSqrt()
            .domain([0, 1]) // Domain of mortality risk
            .range([1, vis.outerRadius2 / 10]);
        
        
        // Set up colors, color scale, and color shade
        vis.colors = {};
        vis.smokingStatuses.forEach((status, i) => {
            vis.colors[status] = d3.schemeTableau10[i];
        });

        vis.colorScale = d3.scaleSequential()
            // Domain is the indices of cancer stages list
            .domain([0, vis.cancerStages.length - 1]);

        vis.colorShade = (stage, color) => { // Return color of the given stage based on the given base color
            vis.colorScale.range([d3.hcl(color).brighter(), d3.hcl(color).darker()]);
            return vis.colorScale(vis.cancerStages.indexOf(stage));
        };


        // Create legend
        vis.legend = d3.select(`#${vis.parentElement}`).select("svg")
            .append("g")
            .attr("transform", `translate(${vis.width + 60}, 30)`);
        
        // Legend: smoking status
        vis.legend.append("text")
            .text("Smoking Status");

        vis.legendStatus = vis.legend.append("g")
            .attr("transform", `translate(0, 15)`);

        // Legend: lung cancer stage
        vis.legend.append("text")
            .attr("y", 130)
            .text("Lung Cancer Stage");

        vis.legendStage = vis.legend.append("g")
            .attr("transform", `translate(0, 155)`);

        vis.legendStage.append("text")
            .attr("class", "color-shade-text")
            .attr("y", 0)
            .text("Lighter Shade of Colour");

        vis.legendStage.append("text")
            .attr("class", "color-shade-text")
            .attr("y", 123)
            .text("Darker Shade of Colour");

        // Legend: average mortality risk
        vis.legend.append("text")
            .attr("y", 320)
            .text("Average Mortality Risk");
            
        vis.legendMortality = vis.legend.append("g")
            .attr("transform", `translate(0, ${320 + vis.radiusScale(d3.max(vis.mortalityRisks)) / 1.5})`);


        // Tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("id", "innovative-tooltip");
        

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.smokingStatusInfo = {};
        vis.cancerStageInfo = {};
        vis.mortalityRiskInfo = {};

        vis.data.forEach((d) => {
            // Count the number of people in each smoking status
            vis.smokingStatusInfo[d.Smoking_Status] = {
                status: d.Smoking_Status,
                value: (vis.smokingStatusInfo[d.Smoking_Status]?.value || 0) + 1,
            };

            // Count the number of people in each combination of smoking status + cancer stage
            vis.cancerStageInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`] = {
                status: d.Smoking_Status,
                stage: d.Stage_at_Diagnosis,
                value: (vis.cancerStageInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`]?.value || 0) + 1
            };

            // Calculate the average mortality risk for each combination of smoking status + cancer stage
            vis.mortalityRiskInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`] = {
                status: d.Smoking_Status,
                stage: d.Stage_at_Diagnosis,
                value: (vis.mortalityRiskInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`]?.value || 0) + +d.Mortality_Risk,
                count: (vis.mortalityRiskInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`]?.count || 0) + 1 // Used to calculate average later
            }

            // Filter smoking status, if necessary
            // Note: need to set to 0 for transitioning, instead of removing entirely
            if (vis.filterStatus != "" && d.Smoking_Status != vis.filterStatus) {
                vis.smokingStatusInfo[d.Smoking_Status].value = 0;
                vis.cancerStageInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`].value = 0;
                vis.mortalityRiskInfo[`${d.Smoking_Status} ${d.Stage_at_Diagnosis}`].value = 0;
            }
        });


        vis.displayInnerDonut = [];
        vis.displayOuterDonut = [];
        vis.displayCircles = [];

        // Set up display data in the correct order
        vis.smokingStatuses.forEach((status) => {
            vis.displayInnerDonut.push(vis.smokingStatusInfo[status]);

            vis.cancerStages.forEach((stage) => {
                vis.displayOuterDonut.push(vis.cancerStageInfo[`${status} ${stage}`]);

                vis.mortalityRiskInfo[`${status} ${stage}`].value = // Calculate average mortality risk
                    vis.mortalityRiskInfo[`${status} ${stage}`].value / vis.mortalityRiskInfo[`${status} ${stage}`].count;
                vis.displayCircles.push(vis.mortalityRiskInfo[`${status} ${stage}`]);
            });
        });

    
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Enter/exit/update arcs
        vis.innerArcs = vis.chartGroup.selectAll(".inner-arc")
            .data(vis.pie(vis.displayInnerDonut), d => d.data.status);
        
        vis.outerArcs = vis.chartGroup.selectAll(".outer-arc")
            .data(vis.pie(vis.displayOuterDonut), d => d.data.stage);

        vis.innerArcs.exit().remove();
        vis.outerArcs.exit().remove();

        vis.innerArcs.enter()
            .append("path")
            .attr("class", "arc inner-arc")
            .style("fill", (d, i) => vis.colors[d.data.status])
            .merge(vis.innerArcs)
            // Handle mouse events
            .on("click", function (event, d) {
                vis.handleArcClick(event, d);
            })
            .on("mouseover", function (event, d) {
                vis.handleArcMouseOver(event, d, 
                    `Number of <span style="color: ${vis.colors[d.data.status]};">${d.data.status}s</span>`,
                    d3.format(",")(d.data.value));
            })
            .on("mouseout", function (event, d) {
                vis.handleArcMouseOut(event, d);
            })
            .transition()
            .duration(800)
            .attrTween("d", function (d, i) {
                // Interpolate from old arc position to new arc position
                let interpolate = d3.interpolate(vis.oldInnerDonut[d.data.status] || d, d);
                return (t) => vis.innerArc(interpolate(t));
            })
            .style("fill", (d, i) => vis.colors[d.data.status]);

        vis.outerArcs.enter()
            .append("path")
            .attr("class", "arc outer-arc")
            .style("fill", (d, i) => vis.colorShade(d.data.stage, vis.colors[d.data.status]))
            .merge(vis.outerArcs)
            // Handle mouse events
            .on("click", function (event, d) {
                vis.handleArcClick(event, d);
            })
            .on("mouseover", function (event, d) {
                vis.handleArcMouseOver(event, d, 
                    `Number of <span style="color: ${vis.colors[d.data.status]};">${d.data.status}s</span> 
                    with <span style="color: ${vis.colorShade(d.data.stage, vis.colors[d.data.status])};">Stage ${d.data.stage}</span> Lung Cancer`,
                    d3.format(",")(d.data.value));
            })
            .on("mouseout", function (event, d) {
                vis.handleArcMouseOut(event, d);
            })
            .transition()
            .duration(800)
            .attrTween("d", function (d, i) {
                // Interpolate from old arc position to new arc position
                let interpolate = d3.interpolate(vis.oldOuterDonut[`${d.data.status} ${d.data.stage}`] || d, d);
                return (t) => vis.outerArc(interpolate(t));
            })
            .style("fill", (d, i) => vis.colorShade(d.data.stage, vis.colors[d.data.status]));
        
        
        // Enter/exit/update lines (connections between arcs and circles)
        vis.lines = vis.chartGroup.selectAll(".line")
            .data(vis.pie(vis.displayOuterDonut.filter(d => d.value > 0)), d => `${d.data.status} ${d.data.stage}`);

        vis.lines.exit().remove();

        vis.lines.enter()
            .append("line")
            .merge(vis.lines)
            .transition()
            .duration(800)
            .attr("class", "line")
            .attrTween("x1", function (d, i) {
                return vis.circleLineTween(d, i, true, vis.outerRadius2);
            })
            .attrTween("y1", function (d, i) {
                return vis.circleLineTween(d, i, false, vis.outerRadius2);
            })
            .attrTween("x2", function (d, i) {
                return vis.circleLineTween(d, i, true, vis.outerRadius2 * 1.25);
            })
            .attrTween("y2", function (d, i) {
                return vis.circleLineTween(d, i, false, vis.outerRadius2 * 1.25);
            });
            

        // Set up outer donut data for use by circles
        let outerDonutData = {};
        vis.pie(vis.displayOuterDonut, d => d.data.stage).forEach((d) => {
            outerDonutData[`${d.data.status} ${d.data.stage}`] = d;
        });

        // Enter/exit/update circles
        vis.circles = vis.chartGroup.selectAll(".circle")
            .data(vis.displayCircles.filter(d => d.value > 0),  d => `${d.status} ${d.stage}`);

        vis.circles.exit().remove();
        
        vis.circles.enter()
            .append("circle")
            .attr("class", "circle")
            .merge(vis.circles)
            // Handle mouse events
            .on("mouseover", function(event, d) {
                vis.handleArcMouseOver(event, d, 
                    `Average Mortality Risk of <span style="color: ${vis.colors[d.status]};">${d.status}s</span> 
                    with <span style="color: ${vis.colorShade(d.stage, vis.colors[d.status])};">Stage ${d.stage}</span> Lung Cancer`,
                    d3.format(".2~%")(d.value));
            })
            .on("mouseout", function(event, d) {
                vis.handleArcMouseOut(event, d);
            })
            .transition()
            .duration(800)
            .attrTween("cx", function (d, i) {
                return vis.circleLineTween(outerDonutData[`${d.status} ${d.stage}`], i, true, vis.outerRadius2 * 1.25);
            })
            .attrTween("cy", function (d, i) {
                return vis.circleLineTween(outerDonutData[`${d.status} ${d.stage}`], i, false, vis.outerRadius2 * 1.25);
            })
            .attr("r", (d, i) => vis.radiusScale(d.value));

        
        // Enter/exit/update legend smoking status
        vis.statusSquares = vis.legendStatus.selectAll(".status-square")
            .data(vis.smokingStatuses, d => d);
        
        vis.statusSquares.exit().remove();

        vis.statusSquares.enter()
            .append("rect")
            .merge(vis.statusSquares)
            .attr("class", "square status-square")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 0)
            .attr("y", (d, i) => i * 25)
            .attr("fill", (d, i) => vis.colors[d])
            // Highlight smoking status that user filtered for
            .style("opacity", (d, i) => vis.filterStatus == "" || d == vis.filterStatus ? 1 : 0.4);

        vis.statusLabels = vis.legendStatus.selectAll(".status-label")
            .data(vis.smokingStatuses, d => d);
        
        vis.statusLabels.exit().remove();

        vis.statusLabels.enter()
            .append("text")
            .merge(vis.statusLabels)
            .attr("class", "label status-label")
            .attr("x", 27)
            .attr("y", (d, i) => i * 25 + 15)
            .attr("fill", (d, i) => vis.colors[d])
            // Highlight smoking status that user filtered for
            .style("opacity", (d, i) => vis.filterStatus == "" || d == vis.filterStatus ? 1 : 0.4)
            .text((d, i) => d);

        
        // Enter/exit/update legend lung cancer stage
        vis.stageSquares = vis.legendStage.selectAll(".stage-square")
            .data(vis.cancerStages, d => d);
        
        vis.stageSquares.exit().remove();

        vis.stageSquares.enter()
            .append("rect")
            .merge(vis.stageSquares)
            .attr("class", "square stage-square")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 0)
            .attr("y", (d, i) => i * 25 + 10)
            .attr("fill", (d, i) => vis.colorShade(d, "gray"));

        vis.stageLabels = vis.legendStage.selectAll(".stage-label")
            .data(vis.cancerStages, d => d);
        
        vis.stageLabels.exit().remove();

        vis.stageLabels.enter()
            .append("text")
            .merge(vis.stageLabels)
            .attr("class", "label stage-label")
            .attr("x", 27)
            .attr("y", (d, i) => i * 25 + 25)
            .attr("fill", (d, i) => vis.colorShade(d, "gray"))
            .text((d, i) => `Stage ${d}`);

        
        // Enter/exit/update legend lung cancer stage
        vis.mortalityCircles = vis.legendMortality.selectAll(".mortality-circle")
            .data(vis.mortalityRisks, d => d);
        
        vis.mortalityCircles.exit().remove();

        vis.mortalityCircles.enter()
            .append("circle")
            .merge(vis.mortalityCircles)
            .attr("class", "circle mortality-circle")
            .attr("r", (d, i) => vis.radiusScale(d))
            .attr("cx", 10)
            .attr("cy", (d, i) => i *  (vis.radiusScale(d) + vis.radiusScale(d3.max(vis.mortalityRisks))) + 10);

        vis.mortalityLabels = vis.legendMortality.selectAll(".mortality-label")
            .data(vis.mortalityRisks, d => d);
        
        vis.mortalityLabels.exit().remove();

        vis.mortalityLabels.enter()
            .append("text")
            .merge(vis.mortalityLabels)
            .attr("class", "label mortality-label")
            .attr("x", vis.radiusScale(d3.max(vis.mortalityRisks)) + 18)
            .attr("y", (d, i) => i * (vis.radiusScale(d) + vis.radiusScale(d3.max(vis.mortalityRisks))) + 15)
            .text((d, i) => d3.format("~%")(d));
    }

    handleArcClick(event, d) {
        let vis = this;

        // Set up old donut data for use while transitioning
        vis.oldInnerDonut = {};
        vis.pie(vis.displayInnerDonut).forEach((d) => {
            vis.oldInnerDonut[d.data.status] = d;
        });

        vis.oldOuterDonut = {};
        vis.pie(vis.displayOuterDonut).forEach((d) => {
            vis.oldOuterDonut[`${d.data.status} ${d.data.stage}`] = d;
        });

        // Toggle filtering smoking status on mouse click
        vis.filterStatus = vis.filterStatus === "" ? d.data.status : "";
        vis.wrangleData();
    }

    handleArcMouseOver(event, d, title, value) {
        let vis = this;

        // Show tooltip on mouse over
        vis.tooltip
            .style("opacity", 1)
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY + "px")
            .html(`
                <div id="innovative-tooltip-background">     
                    <p>${title}:</p>
                    <p id="innovative-tooltip-value">${value}</p>
                </div>`);
    }

    handleArcMouseOut(event, d) {
        let vis = this;

        // Hide tooltip on mouse out
        vis.tooltip
            .style("opacity", 0)
            .style("left", 0)
            .style("top", 0)
            .html(``);
    }

    // attrTween() for circle and line SVG elements
    circleLineTween(d, i, isXPosition, radius) {
        let vis = this;

        // Interpolate from old circle/line position to new circle/line position based on outer donut chart positions
        let interpolate = d3.interpolate(vis.oldOuterDonut[`${d.data.status} ${d.data.stage}`] || d, d);
        
        return function (t) {
            // Get the current interpolated value
            let arcData = interpolate(t);

            // Calculate the center of each outer arc edge along the circumference of the donut chart
            // (and "push" the radius out a little more by `radius` amount)
            if (isXPosition) {
                return radius * Math.cos((-Math.PI + arcData.startAngle + arcData.endAngle) / 2);
            }
            else {
                return radius * Math.sin((-Math.PI + arcData.startAngle + arcData.endAngle) / 2);
            }
        };
    }
}
