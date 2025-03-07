class BarChart {
    constructor(parentElement, data) {
      this.parentElement = parentElement;
      this.data = data;
      this.displayData = data; 
  
  
      // Initialize the chart
      this.initVis();
    }
  
    
    initVis() {
      let vis = this;
  
      
      vis.margin = { top: 100, right: 120, bottom: 60, left: 60 };
      vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width
      - vis.margin.left - vis.margin.right;
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
  
      let titleText = vis.svg
                        .append("text")
                        .attr("class", "chart-title")
                        .attr("x", vis.width / 2)
                        .attr("y", -60)
                        .attr("text-anchor", "middle")
                        .style("font-weight", "bold");
  
      /*
        The following line break in the title section was generated with the help of ChatGPT.
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
        .text("in Second-hand & non-second-ahnd smoker (without smoke)");
        /* Above code was generated with the help of ChatGPT*/ 
  
      vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.3);
      vis.yScale = d3.scaleLinear().range([vis.height, 0]);
  
  
      vis.color = d3
                  .scaleOrdinal()
                  .domain(["No", "Yes"])
                  .range(["blue", "red"]); 
  
      // Axis groups
      vis.xAxisGroup = vis.svg
                          .append("g")
                          .attr("class", "x-axis")
                          .attr("transform", `translate(0, ${vis.height})`);
  
      vis.yAxisGroup = vis.svg
                          .append("g")
                          .attr("class", "y-axis");
  
      // Axis labels
      
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
  
      vis.legend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, 30)`);
  
      /*
        The following line drawing the legend was generated with the help of ChatGPT.
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
      /* Above code was generated with the help of ChatGPT*/ 
  
  
      // Wrangle and render data
      vis.wrangleData();
    }
  
    
    wrangleData() {
      let vis = this;
  
      vis.filteredData = vis.data.filter(
        (d) => d.Smoking_Status === "Non-Smoker"
      );
  
      let roll = d3.rollup(
        vis.filteredData,
        (v) => v.length,
        (d) => d.Second_Hand_Smoke
      );
  
      vis.aggData = Array.from(roll, ([key, count]) => ({
        secondHand: key,
        count: count,
      }));
  
  
      // Update the visualization
      vis.updateVis();
    }
  
  
    updateVis() {
      let vis = this;
  
      vis.xScale.domain(vis.aggData.map((d) => d.secondHand));
  
      let maxCount = d3.max(vis.aggData, (d) => d.count)+50000;
      vis.yScale.domain([0, maxCount]);
  
      let bars = vis.svg.selectAll(".bar")
                    .data(vis.aggData, (d) => d.secondHand);
  
      bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => vis.xScale(d.secondHand))
        .attr("width", vis.xScale.bandwidth())
        .attr("y", vis.height)
        .attr("height", 0)  // This is suggested by ChatGPT so that there is a somooth animation.
        .attr("fill", (d) => vis.color(d.secondHand))
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", (d) => vis.xScale(d.secondHand))
        .attr("y", (d) => vis.yScale(d.count))
        .attr("width", vis.xScale.bandwidth())
        .attr("height", (d) => vis.height - vis.yScale(d.count));
  
      bars.exit().remove();
  
      let labels = vis.svg.selectAll(".bar-label")
                          .data(vis.aggData, (d) => d.secondHand);
  
      labels
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("text-anchor", "middle")
        .attr("x", (d) => vis.xScale(d.secondHand) + vis.xScale.bandwidth() / 2)
        .attr("y", vis.height)
        .merge(labels)
        .transition()
        .duration(1000)
        .attr("x", (d) => vis.xScale(d.secondHand) + vis.xScale.bandwidth() / 2)
        .attr("y", (d) => vis.yScale(d.count) - 5)
        .text((d) => d.count);
  
      labels.exit().remove();
  
      vis.xAxisGroup.transition().duration(1000)
        .call(d3.axisBottom(vis.xScale).tickFormat(d => {
          if(d === "Yes"){
            return "Second-hand smoker";
          }
          else{
            return "Non-second-hand smoker"
          };
      
        }));
  
      vis.yAxisGroup.transition().duration(1000)
        .call(d3.axisLeft(vis.yScale).tickFormat(d => d / 1000));
  
    }
  }
  
  /* Citations:
    1. Most of the code was adjust from the previous couple homework and lab.
    2.  I also use chatgpt to generate some of the code for the title and legend where
        I was not sure how to write the code. But, I understood them after the code was generated.
    3. I use the chatGPT to help me debug
  */