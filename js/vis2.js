class Vis2 {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.filterData = data;
        this.ageStart = 29;
        this.ageEnd = 80;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 50, bottom: 50, left: 60  };
        const size = document.getElementById(vis.parentElement).getBoundingClientRect();
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        // Initialize drawing area with margins
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        vis.x = d3.scaleLinear().range([0, vis.width]);

        vis.y = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d => d3.format("d")(d + vis.ageStart));

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);




        vis.agePath = vis.svg.append("path")
            .attr("class", "area area-age");

        // Define the D3 path generator
        vis.area = d3.area()
            .x(function (d, index) { return vis.x(index); })
            .y0(vis.height)
            .y1(function (d) { return vis.y(d); });

        vis.area.curve(d3.curveCardinal);


        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Axis titles
        vis.svg.append("text")
            .attr("x", -45)
            .attr("y", -8)
            .text("Average Survival Month");
        vis.svg.append("text")
            .attr("x", vis.width )
            .attr("y", vis.height + 25)
            .text("Age");



        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.selectedCategory =  document.getElementById('categorySelector').value;

        vis.data.forEach(d=>d.Age = +d.Age);
        vis.data.forEach(d => d.Survival_Months = +d.Survival_Months);

        if (vis.selectedCategory === 'all') {
            vis.filterData = vis.data;
        }
        if (vis.selectedCategory === 'male') {
            vis.filterData = vis.data.filter(d => d.Gender === "Male");
        }
        if (vis.selectedCategory === 'female') {
            vis.filterData = vis.data.filter(d => d.Gender === "Female");
        }

        vis.filterData = vis.filterData.filter(function (d) {
            return d.Age >= vis.ageStart&& d.Age <= vis.ageEnd ;
        });
        console.log("after filtering");
        console.log(vis.filterData);
        vis.survivalData = d3.range(0,vis.ageEnd - vis.ageStart + 1).map(function(){
            return 0;
        });

        vis.ageCount =  d3.range(0,vis.ageEnd - vis.ageStart + 1).map(function(){
            return 0;
        });

        vis.filterData.forEach(d=>vis.survivalData[d.Age - vis.ageStart] += d.Survival_Months);
        vis.filterData.forEach(d=>vis.ageCount[d.Age - vis.ageStart] += 1);
        vis.survivalData.forEach((d,i)=>{if(vis.survivalData[i] !== 0){vis.survivalData[i]=  vis.survivalData[i] /vis.ageCount[i]}});

        console.log(vis.survivalData);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.x.domain([0, vis.ageEnd - vis.ageStart ]);
        vis.y.domain([0, d3.max(vis.survivalData)]);



        vis.agePath
            .datum(vis.survivalData)
            .transition()
            .attr("d", vis.area);

        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").transition().call(vis.yAxis);
    }

    onSelectionChange(rangeStart, rangeEnd) {

        let vis = this;

        vis.ageStart = Math.floor(rangeStart + 29);
        vis.ageEnd = Math.floor(rangeEnd + 29);

        console.log(vis.ageStart);
        console.log(vis.ageEnd);
        vis.wrangleData();
    }
}
