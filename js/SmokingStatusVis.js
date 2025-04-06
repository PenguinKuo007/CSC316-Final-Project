class SmokingStatusVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 50, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        vis.title = vis.svg
            .append("text")
            .attr("class", "title")
            .attr("x", vis.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .text("Smoking Status of People with Lung Cancer");

        vis.barChartGroup = vis.svg.append("g")
            .attr("class", "bar-chart")


        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.tooltip = d3.select("body")
            .append("div")
            .attr("id", "grouped-barchart-tooltip");
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;


        let roll = d3.rollup(
            vis.data,
            v => {
                return {
                    totalCount: v.length,
                    stageI: v.filter(d => d.Stage === "Stage I").length,
                    stageII: v.filter(d => d.Stage=== "Stage II").length,
                    stageIII: v.filter(d => d.Stage === "Stage III").length,
                    stageIV: v.filter(d => d.Stage === "Stage IV").length
                };
            },
            d => d.Smoking_History
        );

        // Convert rollup map to an array of objects
        vis.smokeStatus = Array.from(roll, ([key, val]) => ({
            smokingHistory: key,
            totalCount: val.totalCount,
            stageI: val.stageI,
            stageII: val.stageII,
            stageIII: val.stageIII,
            stageIV: val.stageIV
        }));

        console.log("vis1 data")
        console.log(vis.smokeStatus);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;


        vis.xScale.domain(vis.smokeStatus.map(d => d.smokingHistory));
        vis.yScale.domain([0, d3.max(vis.smokeStatus, d => d.totalCount)]);

        /* Andy change the following part: */
        vis.colorScale = d3.scaleOrdinal()
            .domain(["Never Smoked", "Former Smoker", "Current Smoker"])
            .range(["#b0bfc9", "#a66249", "#ee5f2c"]);

        vis.barChartGroup.selectAll("rect")
            .data(vis.smokeStatus)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(d.smokingHistory))
            .attr("y", d => vis.yScale(d.totalCount))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", d => vis.height - vis.yScale(d.totalCount))
             /* Andy change the following part: */
            .attr("fill", d => vis.colorScale(d.smokingHistory))          
            .on("mouseover", function(event, d) {
                // Fade other bars if you like
                vis.svg.selectAll(".bar").style("opacity", 0.4);
                d3.select(this).style("opacity", 1);

                // Show + Move tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 20) + "px")   // position near cursor
                    .style("top", event.pageY + "px")
                    /* Andy change the following part: */
                    .html(`
                            <h5>Distribution of stage <span style="color: ${vis.colorScale(d.smokingHistory)};">${d.smokingHistory}</span></h5>   
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
            });

        vis.barChartGroup.selectAll(".bar-text")
            .data(vis.smokeStatus)
            .enter()
            .append("text")
            .attr("class", "bar-text")
            .attr("x", d => vis.xScale(d.smokingHistory) + vis.xScale.bandwidth() / 2)
            .attr("y", d => vis.yScale(d.totalCount) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.totalCount);

        vis.barChartGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(vis.xScale));
    }
}
