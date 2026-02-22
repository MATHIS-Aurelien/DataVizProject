import * as d3 from 'd3'
// import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    svg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;
    tooltipDiv;
    brushBehavior;
    brushG;
    currentVisData = [];
    currentXAttribute;
    currentYAttribute;
    controllerMethods = {};
    selectedIndexSet = new Set();
    hoveredIndex = null;


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};
        d3.select(this.el).style("position", "relative");

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderScatterplot()
        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","svgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        ;

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.svg.append("g")
            .attr("class","yAxisG")
        ;

        this.svg.append("text")
            .attr("class", "xAxisLabel")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .attr("text-anchor", "middle")
        ;

        this.svg.append("text")
            .attr("class", "yAxisLabel")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -65)
            .attr("text-anchor", "middle")
        ;

        this.brushBehavior = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("brush end", (event) => {
                this.handleBrushSelection(event);
            });

        this.brushG = this.svg.append("g")
            .attr("class", "brushG")
            .call(this.brushBehavior)
        ;

        this.tooltipDiv = d3.select(this.el)
            .append("div")
            .attr("class", "scatterplotTooltip");
    }

    updateAxisLabels(xAttribute, yAttribute){
        this.svg.select(".xAxisLabel")
            .text(xAttribute);

        this.svg.select(".yAxisLabel")
            .text(yAttribute);
    }

    showTooltip(event, itemData){
        const stateValue = itemData?.state ?? "N/A";
        const cityValue = itemData?.communityname ?? "N/A";
        this.tooltipDiv
            .style("opacity", 1)
            .html(`Etat: ${stateValue}<br/>Ville: ${cityValue}`);
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

    handleBrushSelection(event){
        if (!this.controllerMethods?.handleOnBrushSelection) {
            return;
        }

        if (event.selection === null) {
            this.controllerMethods.handleOnBrushSelection([]);
            return;
        }

        const [[x0, y0], [x1, y1]] = event.selection;
        const selectedDataItems = this.currentVisData.filter((itemData) => {
            const x = this.xScale(itemData[this.currentXAttribute]);
            const y = this.yScale(itemData[this.currentYAttribute]);
            return x0 <= x && x <= x1 && y0 <= y && y <= y1;
        });

        this.controllerMethods.handleOnBrushSelection(selectedDataItems);
    }

    updateMarkers(selection,xAttribute,yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                return "translate("+this.xScale(item[xAttribute])+","+this.yScale(item[yAttribute])+")";
            })
        ;
    }

    applyMarkersInteractionStyles(){
        const hasSelection = this.selectedIndexSet.size > 0;
        this.svg.selectAll(".markerG")
            .style("opacity", (itemData)=>{
                if (this.hoveredIndex === itemData.index) {
                    return 1;
                }
                if (!hasSelection) {
                    return this.defaultOpacity;
                }
                return this.selectedIndexSet.has(itemData.index) ? 1 : 0.15;
            })
        ;

        this.svg.selectAll(".markerCircle")
            .attr("r", (itemData)=>{
                return this.hoveredIndex === itemData.index ? this.circleRadius + 2 : this.circleRadius;
            })
            .attr("stroke", (itemData)=>{
                return this.hoveredIndex === itemData.index ? "#1f77b4" : "red";
            })
            .attr("stroke-width", (itemData)=>{
                if (this.hoveredIndex === itemData.index) {
                    return 3;
                }
                return this.selectedIndexSet.has(itemData.index) ? 2 : 0;
            })
        ;

        this.svg.selectAll(".markerG")
            .sort((a, b)=>{
                const aHovered = a.index === this.hoveredIndex ? 1 : 0;
                const bHovered = b.index === this.hoveredIndex ? 1 : 0;
                return aHovered - bHovered;
            });
    }

    highlightSelectedItems(selectedItems){
        this.selectedIndexSet = new Set(selectedItems.map((itemData)=>itemData.index));
        this.applyMarkersInteractionStyles();
    }

    highlightHoveredItem(hoveredItem){
        this.hoveredIndex = hoveredItem?.index ?? null;
        this.applyMarkersInteractionStyles();
    }

    clearBrushSelection(){
        if (this.brushG && this.brushBehavior) {
            this.brushG.call(this.brushBehavior.move, null);
        }
    }

    clearInteractions(){
        this.selectedIndexSet = new Set();
        this.hoveredIndex = null;
        this.clearBrushSelection();
    }

    updateAxis = function(visData,xAttribute,yAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const minX = d3.min(visData.map(item=>item[xAttribute]))
        const maxX = d3.max(visData.map(item=>item[xAttribute]))
        const minY = d3.min(visData.map(item=>item[yAttribute]))
        const maxY = d3.max(visData.map(item=>item[yAttribute]))
        this.xScale.domain([minX,maxX]);
        this.yScale.domain([minY,maxY]);

        // create axis with computed scales
        // .xAxisG and .yAxisG are initialized in create() function
        this.svg.select(".xAxisG")
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale))
        ;
        this.svg.select(".yAxisG")
            .transition().duration(500)
            .call(d3.axisLeft(this.yScale))
        ;
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        console.log("render scatterplot with a new data list ...")
        this.currentVisData = visData;
        this.currentXAttribute = xAttribute;
        this.currentYAttribute = yAttribute;
        this.controllerMethods = controllerMethods;

        // build the size scales and x,y axis
        this.updateAxis(visData,xAttribute,yAttribute);
        this.updateAxisLabels(xAttribute, yAttribute);

        this.svg.selectAll(".markerG")
            // all elements with the class .cellG (empty the first time)
            .data(visData,(itemData)=>itemData.index)
            .join(
                enter=>{
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","markerG")
                        .style("opacity",this.defaultOpacity)
                        .on("click", (event,itemData)=>{
                            this.clearBrushSelection();
                            controllerMethods.handleOnClick(itemData);
                        })
                        .on("mouseenter", (event,itemData)=>{
                            this.showTooltip(event, itemData);
                            controllerMethods.handleOnMouseEnter(itemData);
                        })
                        .on("mousemove", (event)=>{
                            this.moveTooltip(event);
                        })
                        .on("mouseleave", (event,itemData)=>{
                            this.hideTooltip();
                            controllerMethods.handleOnMouseLeave(itemData);
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r",this.circleRadius)
                        .attr("stroke","red")
                    ;
                    this.updateMarkers(itemG,xAttribute,yAttribute);
                },
                update=>{
                    this.updateMarkers(update,xAttribute,yAttribute)
                },
                exit =>{
                    exit.remove()
                    ;
                }

            )
        this.applyMarkersInteractionStyles();
    }

    clear = function(){
        this.clearInteractions();
        this.hideTooltip();
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;
