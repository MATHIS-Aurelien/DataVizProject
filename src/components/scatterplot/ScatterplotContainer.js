import './Scatterplot.css'
import { useEffect, useRef } from 'react';
import {useSelector, useDispatch} from 'react-redux'

import ScatterplotD3 from './Scatterplot-d3';
import { createItemInteractionControllers } from '../../redux/itemInteractionControllers'

function ScatterplotContainer({xAttributeName, yAttributeName}){
    const visData = useSelector(state =>state.dataSet)
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    const divContainerRef=useRef(null);
    const scatterplotD3Ref = useRef(null)

    const getChartSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width;// = 800;
        let height;// = 100;
        if(divContainerRef.current){
            width=divContainerRef.current.offsetWidth;
            // width = '100%';
            height=divContainerRef.current.offsetHeight;
            // height = '100%';
        }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            const scatterplotD3 = scatterplotD3Ref.current;
            if (scatterplotD3) {
                scatterplotD3.clear()
            }
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        const controllerMethods = createItemInteractionControllers(dispatch);
        // get the current instance of scatterplotD3 from the Ref...
        const scatterplotD3 = scatterplotD3Ref.current;
        if (!scatterplotD3) {
            return;
        }
        // call renderScatterplot of ScatterplotD3...;
        scatterplotD3.renderScatterplot(visData, xAttributeName, yAttributeName, controllerMethods);
    },[visData, xAttributeName, yAttributeName, dispatch]);// if dependencies, useEffect is called after each data update, in our case only visData changes.

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        if (!scatterplotD3) {
            return;
        }
        scatterplotD3.highlightSelectedItems(selectedItems);
    },[selectedItems])

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        if (!scatterplotD3) {
            return;
        }
        scatterplotD3.highlightHoveredItem(hoveredItem);
    },[hoveredItem])

    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col2">

        </div>
    )
}

export default ScatterplotContainer;
