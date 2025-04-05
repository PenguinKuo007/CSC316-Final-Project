class GroupedBarChart {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.displayData = [];
        this.displayStatuses = [];

        this.smokingStatuses = ["Non-Smoker", "Former Smoker", "Smoker"];
        this.cancerStages = ["I", "II", "III", "IV"];
        this.statusColours = ["#b0bfc9", "#a66249", "#ee5f2c"];

        this.filterStatus = ""; // Filter the smoking status

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 160, bottom: 60, left: 85};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Initialize drawing area
        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);


        // Scales and axes
        vis.stageScale = d3.scaleBand()
            .domain(vis.cancerStages)
            .range([0, vis.width])
            .paddingInner(0.1);
        
        vis.statusScale = d3.scaleBand()
            .domain(vis.smokingStatuses)
            .range([0, vis.stageScale.bandwidth()])
            .padding(0.05);

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.smokingStatuses)
            .range(vis.statusColours);
      
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.stageScale)
            .tickFormat(d => `Stage ${d}`);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg.append("text") // x-axis label
            .attr("class", "label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .text("Lung Cancer Stage");

        vis.svg.append("text") // y-axis label
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -60)
            .text("Number of Patients");
        
        
        // Create legend
        vis.legend = d3.select(`#${vis.parentElement}`).select("svg")
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + 110}, 30)`);
        
        vis.legend.append("text")
            .attr("class", "legend-title")
            .text("Smoking Status");
        

        // Tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("id", "grouped-barchart-tooltip");


        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.dataInfo = {};

        vis.data.forEach((d) => {
            // Count the number of people in each combination of cancer stage + smoking status
            vis.dataInfo[`${d.Stage_at_Diagnosis} ${d.Smoking_Status}`] = {
                stage: d.Stage_at_Diagnosis,
                status: d.Smoking_Status,
                value: (vis.dataInfo[`${d.Stage_at_Diagnosis} ${d.Smoking_Status}`]?.value || 0) + 1
            };
        });


        vis.displayData = [];
        // Filter smoking status to display, if necessary
        vis.displayStatuses = vis.smokingStatuses.filter(d => vis.filterStatus == "" || d == vis.filterStatus);

        // Set up display data in the correct order
        vis.cancerStages.forEach((stage) => {
            vis.displayStatuses.forEach((status) => {
                vis.displayData.push(vis.dataInfo[`${stage} ${status}`]);
            });
        });

    
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Update domains
        vis.statusScale.domain(vis.displayStatuses);
        vis.yScale.domain([0, d3.max(vis.displayData, d => d.value)]);


        // Append a group for each lung cancer stage
        vis.groups = vis.svg.selectAll(".group")
            .data(d3.group(vis.displayData, d => d.stage), ([stage, _]) => stage)
            .join("g")
            .attr("class", "group")
            .attr("transform", ([stage, _]) => `translate(${vis.stageScale(stage)}, 0)`);
        
        
        // Append a rect for each smoking status
        vis.bars = vis.groups.selectAll(".bar")
            .data(([_, d]) => d, d => `${d.stage} ${d.status}`);
        
        vis.bars.exit()
            .transition()
            .duration(800)
            .style("opacity", 0)
            .remove();
        
        vis.bars.enter()
            .append("rect")
            .attr("class", d => `bar ${d.status.replace(/\s+/g, '-').toLowerCase()}`)
            .attr("x", d => vis.statusScale(d.status))
            .attr("y", d => vis.yScale(d.value))
            .attr("width", vis.statusScale.bandwidth())
            .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
            .attr("fill", d => vis.colorScale(d.status))
            .style("opacity", 0)
            .merge(vis.bars)
            // Handle mouse events
            .on("click", function (event, d) {
                // Toggle filtering smoking status on mouse click
                vis.filterStatus = vis.filterStatus === "" ? d.status : "";
                vis.wrangleData();
            })
            .on("mouseover", function (event, d) {
                vis.svg.selectAll(".bar")
                    .style("opacity", 0.4);

                // Highlight bars with the same smoking status
                vis.svg.selectAll(`.${d.status.replace(/\s+/g, '-').toLowerCase()}`)
                    .style("opacity", 1);

                // Show tooltip on mouse over
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div id="grouped-barchart-tooltip-background">     
                            <p>Number of <span style="color: ${vis.colorScale(d.status)};">${d.status}s</span> 
                            with Stage ${d.stage} Lung Cancer:</p>
                            <p id="grouped-barchart-tooltip-value">${d3.format(",")(d.value)}</p>
                        </div>`);
            })
            .on("mouseout", function (event, d) {
                vis.svg.selectAll(".bar")
                    .style("opacity", 1);
                
                // Hide tooltip on mouse out
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .transition()
            .duration(800)
            .attr("x", d => vis.statusScale(d.status))
            .attr("y", d => vis.yScale(d.value))
            .attr("width", vis.statusScale.bandwidth())
            .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
            .attr("fill", d => vis.colorScale(d.status))
            .style("opacity", 1);

        
        // Update axes
        vis.svg.select(".x-axis").transition().duration(800).call(vis.xAxis);
        vis.svg.select(".y-axis").transition().duration(800).call(vis.yAxis);


        // Enter/exit/update legend smoking status
        vis.squares = vis.legend.selectAll(".square")
            .data(vis.smokingStatuses, d => d);
        
        vis.squares.exit().remove();

        vis.squares.enter()
            .append("rect")
            .merge(vis.squares)
            .attr("class", "square")
            .attr("width", 15)
            .attr("height", 15)
            .attr("x", 0)
            .attr("y", (d, i) => i * 22 + 10)
            .attr("fill", (d, i) => vis.colorScale(d))
            // Highlight smoking status that user filtered for
            .style("opacity", (d, i) => vis.filterStatus == "" || d == vis.filterStatus ? 1 : 0.4);

        vis.labels = vis.legend.selectAll(".legend-label")
            .data(vis.smokingStatuses, d => d);
        
        vis.labels.exit().remove();

        vis.labels.enter()
            .append("text")
            .merge(vis.labels)
            .attr("class", "legend-label")
            .attr("x", 20)
            .attr("y", (d, i) => i * 22 + 21.5)
            .attr("fill", (d, i) => vis.colorScale(d))
            // Highlight smoking status that user filtered for
            .style("opacity", (d, i) => vis.filterStatus == "" || d == vis.filterStatus ? 1 : 0.4)
            .text((d, i) => d);
    }
}
