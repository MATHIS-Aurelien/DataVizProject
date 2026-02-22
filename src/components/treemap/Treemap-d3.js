import * as d3 from 'd3'

class TreemapD3 {
    margin = {top: 20, right: 10, bottom: 10, left: 10};
    legendAreaHeight = 72;
    minPopulationWeight = 0.05;
    maxPopulationWeight = 0.7;
    lowCrimeThreshold = 0.04;
    lowCrimeColor = "#07a6e0";
    size;
    width;
    height;
    svg;
    stateLayer;
    leafLayer;
    brushBehavior;
    brushG;
    tooltipDiv;
    legendLayer;
    currentLeaves = [];
    controllerMethods = {};
    selectedIndexSet = new Set();
    hoveredIndex = null;
    crimeColorScale = d3.scaleLinear().clamp(true);
    crimeMin = 0;
    crimeMax = 1;
    legendGradientId;

    constructor(el){
        this.el=el;
        this.legendGradientId = `crime-legend-gradient-${Math.random().toString(36).slice(2, 9)}`;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};
        d3.select(this.el).style("position", "relative");

        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom - this.legendAreaHeight;
        this.height = Math.max(80, this.height);

        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom + this.legendAreaHeight)
            .append("g")
            .attr("class","treemapSvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.stateLayer = this.svg.append("g")
            .attr("class", "stateLayer")
            .style("pointer-events", "none");

        this.brushBehavior = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("brush end", (event) => {
                this.handleBrushSelection(event);
            });

        this.brushG = this.svg.append("g")
            .attr("class", "treemapBrushG")
            .call(this.brushBehavior);

        this.leafLayer = this.svg.append("g").attr("class", "leafLayer");
        this.legendLayer = this.svg.append("g").attr("class", "legendLayer");

        this.tooltipDiv = d3.select(this.el)
            .append("div")
            .attr("class", "treemapTooltip");
    }

    getStateValue(itemData){
        if (itemData?.state === undefined || itemData?.state === null || itemData?.state === "?"){
            return "Unknown";
        }
        return String(itemData.state);
    }

    getCrimeValue(itemData){
        const value = Number(itemData?.ViolentCrimesPerPop);
        return Number.isFinite(value) ? value : 0;
    }

    getCrimeFillColor(itemData){
        const crimeValue = this.getCrimeValue(itemData);
        if (crimeValue <= this.lowCrimeThreshold) {
            return this.lowCrimeColor;
        }
        return this.crimeColorScale(crimeValue);
    }

    getPopulationValue(itemData){
        const value = Number(itemData?.population);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }

    getPopulationWeight(itemData){
        const population = this.getPopulationValue(itemData);
        if (population <= 0) {
            return 0;
        }
        const effectiveMin = Math.min(this.minPopulationWeight, this.maxPopulationWeight);
        const effectiveMax = Math.max(this.minPopulationWeight, this.maxPopulationWeight);
        const withMin = Math.max(effectiveMin, population);
        return Math.min(effectiveMax, withMin);
    }

    getMedIncomeValue(itemData){
        const value = Number(itemData?.medIncome);
        return Number.isFinite(value) ? value : 0;
    }

    showTooltip(event, itemData){
        const stateValue = this.getStateValue(itemData);
        const cityValue = itemData?.communityname ?? "N/A";
        const populationValue = this.getPopulationValue(itemData).toFixed(3);
        const medIncomeValue = this.getMedIncomeValue(itemData).toFixed(3);
        const crimeValue = this.getCrimeValue(itemData).toFixed(3);

        this.tooltipDiv
            .style("opacity", 1)
            .html(`Etat: ${stateValue}<br/>Ville: ${cityValue}<br/>Population: ${populationValue}<br/>MedIncome: ${medIncomeValue}<br/>Criminalite: ${crimeValue}`);
        this.moveTooltip(event);
    }

    moveTooltip(event){
        const [x, y] = d3.pointer(event, this.el);
        const tooltipNode = this.tooltipDiv.node();
        if (!tooltipNode || !this.el) {
            return;
        }

        const containerRect = this.el.getBoundingClientRect();
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const padding = 6;
        const offset = 12;

        const visibleLeft = Math.max(0, -containerRect.left);
        const visibleTop = Math.max(0, -containerRect.top);
        const visibleRight = Math.min(containerRect.width, window.innerWidth - containerRect.left);
        const visibleBottom = Math.min(containerRect.height, window.innerHeight - containerRect.top);

        const minLeft = visibleLeft + padding;
        const maxLeft = visibleRight - tooltipRect.width - padding;
        const minTop = visibleTop + padding;
        const maxTop = visibleBottom - tooltipRect.height - padding;

        let left = x + offset;
        let top = y - tooltipRect.height - offset;

        if (top < minTop) {
            top = y + offset;
        }

        if (maxLeft >= minLeft) {
            left = Math.max(minLeft, Math.min(maxLeft, left));
        } else {
            left = minLeft;
        }

        if (maxTop >= minTop) {
            top = Math.max(minTop, Math.min(maxTop, top));
        } else {
            top = minTop;
        }

        this.tooltipDiv
            .style("left", `${left}px`)
            .style("top", `${top}px`);
    }

    hideTooltip(){
        this.tooltipDiv.style("opacity", 0);
    }

    clearBrushSelection(){
        if (this.brushG && this.brushBehavior) {
            this.brushG.call(this.brushBehavior.move, null);
        }
    }

    handleBrushSelection(event){
        if (!this.controllerMethods?.handleOnBrushSelection) {
            return;
        }

        if (event.selection === null) {
            this.controllerMethods.handleOnBrushSelection([]);
            return;
        }

        const [[x0, y0], [x1, y1]] = event.selection;
        const selectedDataItems = this.currentLeaves
            .filter((leafNode)=>{
                return x0 <= leafNode.x1 && leafNode.x0 <= x1 && y0 <= leafNode.y1 && leafNode.y0 <= y1;
            })
            .map((leafNode)=>leafNode.data);

        this.controllerMethods.handleOnBrushSelection(selectedDataItems);
    }

    updateColorScale(visData){
        const crimeValues = visData.map((itemData)=>this.getCrimeValue(itemData));
        const minCrime = d3.min(crimeValues) ?? 0;
        const maxCrime = d3.max(crimeValues) ?? 1;
        this.crimeMin = minCrime;
        this.crimeMax = maxCrime;
        const gradientMinCrime = Math.max(this.lowCrimeThreshold, minCrime);

        if (maxCrime <= gradientMinCrime) {
            this.crimeColorScale
                .domain([gradientMinCrime, gradientMinCrime + 0.5, gradientMinCrime + 1])
                .range(["#2e7d32", "#f1c40f", "#c0392b"]);
            return;
        }

        const middleCrime = gradientMinCrime + (maxCrime - gradientMinCrime) / 2;
        this.crimeColorScale
            .domain([gradientMinCrime, middleCrime, maxCrime])
            .range(["#2e7d32", "#f1c40f", "#c0392b"]);
    }

    renderLegend(){
        const legendWidth = 170;
        const legendHeight = 10;
        const legendPadding = 6;
        const legendBoxHeight = 58;
        const legendBoxWidth = legendWidth + (legendPadding * 2);
        const legendX = 6;
        const legendY = this.height + 8;

        const defs = this.svg.selectAll("defs.legendDefs")
            .data([null])
            .join("defs")
            .attr("class", "legendDefs");

        const gradient = defs.selectAll(`#${this.legendGradientId}`)
            .data([null])
            .join("linearGradient")
            .attr("id", this.legendGradientId)
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        gradient.selectAll("stop")
            .data([
                {offset: "0%", color: "#2e7d32"},
                {offset: "50%", color: "#f1c40f"},
                {offset: "100%", color: "#c0392b"}
            ])
            .join("stop")
            .attr("offset", (item)=>item.offset)
            .attr("stop-color", (item)=>item.color);

        const legendG = this.legendLayer.selectAll(".crimeLegendG")
            .data([null])
            .join("g")
            .attr("class", "crimeLegendG")
            .attr("transform", `translate(${legendX},${legendY})`)
            .style("pointer-events", "none");

        legendG.selectAll(".legendBg")
            .data([null])
            .join("rect")
            .attr("class", "legendBg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendBoxWidth)
            .attr("height", legendBoxHeight)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("stroke", "#666")
            .attr("stroke-width", 0.6);

        legendG.selectAll(".legendTitle")
            .data([null])
            .join("text")
            .attr("class", "legendTitle")
            .attr("x", legendPadding)
            .attr("y", 10)
            .attr("fill", "#1f1f1f")
            .attr("font-size", 11)
            .attr("font-weight", 700)
            .text("Criminalite");

        legendG.selectAll(".legendFixedLow")
            .data([null])
            .join("rect")
            .attr("class", "legendFixedLow")
            .attr("x", legendPadding)
            .attr("y", 14)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", this.lowCrimeColor)
            .attr("stroke", "#3b6f86")
            .attr("stroke-width", 0.7);

        legendG.selectAll(".legendFixedLowLabel")
            .data([null])
            .join("text")
            .attr("class", "legendFixedLowLabel")
            .attr("x", legendPadding + 15)
            .attr("y", 23)
            .attr("fill", "#1f1f1f")
            .attr("font-size", 10)
            .text(`<= ${this.lowCrimeThreshold.toFixed(2)}`);

        legendG.selectAll(".legendRamp")
            .data([null])
            .join("rect")
            .attr("class", "legendRamp")
            .attr("x", legendPadding)
            .attr("y", 30)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("fill", `url(#${this.legendGradientId})`)
            .attr("stroke", "#444")
            .attr("stroke-width", 0.7);

        legendG.selectAll(".legendLabelLow")
            .data([null])
            .join("text")
            .attr("class", "legendLabelLow")
            .attr("x", legendPadding)
            .attr("y", 48)
            .attr("fill", "#2e7d32")
            .attr("font-size", 10)
            .text(`>${this.lowCrimeThreshold.toFixed(2)}`);

        legendG.selectAll(".legendLabelHigh")
            .data([null])
            .join("text")
            .attr("class", "legendLabelHigh")
            .attr("x", legendPadding + legendWidth)
            .attr("y", 48)
            .attr("text-anchor", "end")
            .attr("fill", "#c0392b")
            .attr("font-size", 10)
            .text(`max (${this.crimeMax.toFixed(2)})`);

        this.legendLayer.raise();
    }

    buildTreemapRoot(visData){
        const groupedData = d3.groups(visData, (itemData)=>this.getStateValue(itemData));
        const rootData = {
            name: "root",
            children: groupedData.map(([stateName, items])=>({
                name: stateName,
                children: items
            }))
        };

        const hierarchyRoot = d3.hierarchy(rootData)
            .sum((nodeData)=>{
                if (nodeData.index === undefined) {
                    return 0;
                }
                return this.getPopulationWeight(nodeData);
            })
            .sort((a, b)=>b.value - a.value);

        return d3.treemap()
            .size([this.width, this.height])
            .paddingOuter(2)
            .paddingInner((node)=> node.depth === 0 ? 5 : 3)
            .paddingTop(0)
            (hierarchyRoot);
    }

    updateStateGroups(treemapRoot){
        this.stateLayer.selectAll(".stateG")
            .data(treemapRoot.children || [], (stateNode)=>stateNode.data.name)
            .join(
                enter=>{
                    const stateG = enter.append("g").attr("class", "stateG");
                    stateG.append("rect").attr("class", "stateRect");
                    return stateG;
                },
                update=>update,
                exit=>exit.remove()
            )
            .attr("transform", (stateNode)=>"translate(" + stateNode.x0 + "," + stateNode.y0 + ")")
            .each((stateNode, i, nodes)=>{
                const stateSelection = d3.select(nodes[i]);
                const stateWidth = Math.max(0, stateNode.x1 - stateNode.x0);
                const stateHeight = Math.max(0, stateNode.y1 - stateNode.y0);

                stateSelection.select(".stateRect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", stateWidth)
                    .attr("height", stateHeight)
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2.2);
            });

        // Keep state borders visible over leaf tiles.
        this.stateLayer.raise();
    }

    applyLeavesInteractionStyles(){
        const hasSelection = this.selectedIndexSet.size > 0;

        this.leafLayer.selectAll(".leafG")
            .style("opacity", (leafNode)=>{
                if (!hasSelection) {
                    return 1;
                }
                return this.selectedIndexSet.has(leafNode.data.index) ? 1 : 0.22;
            });

        this.leafLayer.selectAll(".leafRect")
            .attr("stroke", (leafNode)=>{
                if (this.hoveredIndex === leafNode.data.index) {
                    return "#1f77b4";
                }
                return this.selectedIndexSet.has(leafNode.data.index) ? "#202020" : "#ffffff";
            })
            .attr("stroke-width", (leafNode)=>{
                if (this.hoveredIndex === leafNode.data.index) {
                    return 2.3;
                }
                return this.selectedIndexSet.has(leafNode.data.index) ? 1.8 : 0.8;
            });
    }

    updateLeafGroups(treemapRoot){
        this.currentLeaves = treemapRoot.leaves();

        this.leafLayer.selectAll(".leafG")
            .data(this.currentLeaves, (leafNode)=>leafNode.data.index)
            .join(
                enter=>{
                    const leafG = enter.append("g")
                        .attr("class", "leafG")
                        .on("click", (event, leafNode)=>{
                            this.clearBrushSelection();
                            this.controllerMethods.handleOnClick(leafNode.data);
                        })
                        .on("mouseenter", (event, leafNode)=>{
                            this.showTooltip(event, leafNode.data);
                            this.controllerMethods.handleOnMouseEnter(leafNode.data);
                        })
                        .on("mousemove", (event)=>{
                            this.moveTooltip(event);
                        })
                        .on("mouseleave", ()=>{
                            this.hideTooltip();
                            this.controllerMethods.handleOnMouseLeave();
                        });

                    leafG.append("rect").attr("class", "leafRect");
                    return leafG;
                },
                update=>update,
                exit=>exit.remove()
            )
            .attr("transform", (leafNode)=>"translate(" + leafNode.x0 + "," + leafNode.y0 + ")")
            .each((leafNode, i, nodes)=>{
                const leafSelection = d3.select(nodes[i]);
                const leafWidth = Math.max(0, leafNode.x1 - leafNode.x0);
                const leafHeight = Math.max(0, leafNode.y1 - leafNode.y0);
                const crimeColor = this.getCrimeFillColor(leafNode.data);

                leafSelection.select(".leafRect")
                    .attr("width", leafWidth)
                    .attr("height", leafHeight)
                    .attr("fill", crimeColor)
                    .attr("fill-opacity", 0.92);
            });

        this.applyLeavesInteractionStyles();
    }

    renderTreemap = function (visData, controllerMethods){
        this.controllerMethods = controllerMethods;

        if (!visData || visData.length === 0){
            this.currentLeaves = [];
            this.stateLayer.selectAll("*").remove();
            this.leafLayer.selectAll("*").remove();
            this.legendLayer.selectAll("*").remove();
            return;
        }

        this.updateColorScale(visData);
        const treemapRoot = this.buildTreemapRoot(visData);
        this.updateStateGroups(treemapRoot);
        this.updateLeafGroups(treemapRoot);
        this.renderLegend();
    }

    highlightSelectedItems(selectedItems){
        this.selectedIndexSet = new Set(selectedItems.map((itemData)=>itemData.index));
        this.applyLeavesInteractionStyles();
    }

    highlightHoveredItem(hoveredItem){
        this.hoveredIndex = hoveredItem?.index ?? null;
        this.applyLeavesInteractionStyles();
    }

    clear = function(){
        this.selectedIndexSet = new Set();
        this.hoveredIndex = null;
        this.currentLeaves = [];
        this.hideTooltip();
        d3.select(this.el).selectAll("*").remove();
    }
}

export default TreemapD3;
