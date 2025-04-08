class BarChart {
    constructor(parentElement, data) {

        /*Initialize the parameter like what we did on the lab */
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = data;

        // Initialize the chart
        this.initVis();
    }


    initVis() {
        let vis = this;


        /*Setup the margin */
        vis.margin = { top: 100, right: 120, bottom: 60, left: 60 };

        // Width of the margin
        vis.width =
            document.getElementById(vis.parentElement).getBoundingClientRect().width
            - vis.margin.left - vis.margin.right;

        // Height of the margin
        vis.height =
            document.getElementById(vis.parentElement).getBoundingClientRect().height
            - vis.margin.top - vis.margin.bottom;

        // Create SVG drawing area 
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Create the title of the chart
        let titleText = vis.svg
            .append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .style("font-weight", "bold");

        /*
          The following line break in the title section was made by me and helped by ChatGPT for debug.
        */

        titleText
            .append("tspan")
            .attr("x", vis.width / 2)
            .attr("dy", "0em")
            .text("Comparision of Lung Cancer");

        titleText
            .append("tspan")
            .attr("x", vis.width / 2)
            .attr("dy", "1.2em")
            .text("in Second-hand & non-second-hand smoker (without smoke)");
        /* ***************************************************************** */

        // Create the x and y axis scale
        vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.3);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        // Create the color scale for the bars
        vis.color = d3
            .scaleOrdinal()
            .domain(["No", "Yes"])
            .range(["#b0bfc9", "#ee5f2c"]);

        // Create the x and y axis group
        vis.xAxisGroup = vis.svg
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.svg
            .append("g")
            .attr("class", "y-axis");

        // Create the x and y axis labels
        vis.svg
            .append("text")
            .attr("class", "axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Second-Hand Smoke");

        vis.svg
            .append("text")
            .attr("class", "axis-label")
            .attr("x", -vis.height / 2)
            .attr("y", -vis.margin.left + 15)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Count (in thousands)");

        // Create the legend group
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - 150}, 0)`);

        /*
          The following lines drawing the legend was made by me and helped by ChatGPT for debug.
        */
        let categories = vis.color.domain();
        categories.forEach((cat, i) => {
            // Legend color box
            vis.legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", vis.color(cat));

            // Legend text remains the same
            vis.legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .text(`Second-Hand Smoke = ${cat}`);
        });
        /* ***************************************************************** */

        // Create the tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("id", "grouped-barchart-tooltip");

        // Wrangle and render data
        vis.wrangleData();
    }


    wrangleData() {
        let vis = this;

        // Filter the data to include only non-smokers
        vis.filteredData = vis.data.filter(d => d.Smoking_Status === "Non-Smoker");

        /*
          Roll up the data by second-hand smoke ("Yes" or "No") and compute:
            - totalCount: total number of people in each category
            - stageI: number of people in stage I for each category
            - stageII: number of people in stage II for each category
            - stageIII: number of people in stage III for each category
            - stageIV: number of people in stage IV for each category
        */
        let roll = d3.rollup(
            vis.filteredData,
            value => {
                return {
                    totalCount: value.length,
                    stageI: value.filter(data => data.Stage_at_Diagnosis === "I").length,
                    stageII: value.filter(data => data.Stage_at_Diagnosis === "II").length,
                    stageIII: value.filter(data => data.Stage_at_Diagnosis === "III").length,
                    stageIV: value.filter(data => data.Stage_at_Diagnosis === "IV").length
                };
            },
            data => data.Second_Hand_Smoke     // Group by second-hand smoke status
        );

        // Convert rollup map to an array of objects
        vis.resultedData = Array.from(roll, ([key, value]) => ({
            secondHand: key,
            totalCount: value.totalCount,
            stageI: value.stageI,
            stageII: value.stageII,
            stageIII: value.stageIII,
            stageIV: value.stageIV
        }));


        // Update the visualization
        vis.updateVis();
    }


    updateVis() {

        let vis = this;

        // Update the x and y axis scale domains based on the data
        vis.xScale.domain(vis.resultedData.map((data) => data.secondHand).reverse());

        let maxCount = d3.max(vis.resultedData, (data) => data.totalCount) + 50000;         // Add some padding to the max count so that there are the space above the bars on the chart.
        vis.yScale.domain([0, maxCount]);

        let bars = vis.svg.selectAll(".bar")
            .data(vis.resultedData, (data) => data.secondHand);

        // Create and update the bars for the chart
        bars
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => vis.xScale(d.secondHand))
            .attr("y", vis.height)
            .attr("width", vis.xScale.bandwidth())
            .attr("height", 0)   
            .attr("fill", (d) => vis.color(d.secondHand))
            .merge(bars)
            .on("mouseover", function(event, d) {

                vis.svg.selectAll(".bar").style("opacity", 0.25);
                d3.select(this).style("opacity", 1);

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 20) + "px")   
                    .style("top", event.pageY + "px")
                    .html(`
                            <h5>Distribution of stage for <span style="color: ${vis.color(d.secondHand)};">${d.secondHand === 'Yes' ? "Second-hand smoker" : "Non-second-hand smoker"}</span></h5>
                            <br>
                            <p>Stage I : ${d.stageI} people or ${Math.round(d.stageI/d.totalCount * 100)}%</p>
                            <p>Stage II : ${d.stageII} people or ${Math.round(d.stageII/d.totalCount * 100)}%</p>
                            <p>Stage III : ${d.stageIII} people or ${Math.round(d.stageIII/d.totalCount * 100)}%</p>
                            <p>Stage IV : ${d.stageIV} people or ${Math.round(d.stageIV/d.totalCount * 100)}%</p>
                            <br>
                            <p>Total: ${d.totalCount} people</p>
                        `);
            })
            .on("mouseout", function() {
                // Restore bars
                vis.svg.selectAll(".bar").style("opacity", 1);

                // Hide tooltip
                vis.tooltip
                    .style("opacity", 0)
                    .html(``);
            })
            .transition()
            .duration(1000)
            .attr("x", (d) => vis.xScale(d.secondHand))
            .attr("y", (d) => vis.yScale(d.totalCount))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", (d) => vis.height - vis.yScale(d.totalCount));

        // Remove bars that are no longer needed
        bars.exit().remove();

        // Update the X and Y axis
        vis.xAxisGroup.transition().duration(1000)
                    .call(d3.axisBottom(vis.xScale).tickFormat(d => {
                        if(d === "Yes"){
                            return "Second-hand smoker";
                        }
                        else{
                            return "Non-second-hand smoker"
                        };

                    }))
                    .style("font-size", "16px");

        vis.yAxisGroup.transition().duration(1000)
            .call(d3.axisLeft(vis.yScale).tickFormat(d => d / 1000));

        // Update the labels for the bars
        let labels = vis.svg.selectAll(".bar-label")
            .data(vis.resultedData, (data) => data.secondHand);

        // Create and update the labels for the chart
        labels
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("text-anchor", "middle")
            .attr("x", (data) => vis.xScale(data.secondHand) + vis.xScale.bandwidth() / 2)
            .attr("y", vis.height)
            .merge(labels)
            .transition()
            .duration(1000)
            .attr("x", (data) => vis.xScale(data.secondHand) + vis.xScale.bandwidth() / 2)
            .attr("y", (data) => vis.yScale(data.totalCount) - 5)
            .text((data) => data.totalCount);

        // Remove labels that are no longer needed
        labels.exit().remove();
        

    }
}

/* Citations:
  1. Most of the code was adjust from the previous couple homework and lab.
  2.  I also use chatgpt to debug some of the code for the title and legend where
      I intitially had some bugs and chatgpt help me to fix it. But, I understood them after the code was adjusted.
  3. I use the chatGPT to help me debug in general
*/
