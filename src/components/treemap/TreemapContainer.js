import './Treemap.css'
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux'

import TreemapD3 from './Treemap-d3';
import { createItemInteractionControllers } from '../../redux/itemInteractionControllers';

function TreemapContainer(){
    const visData = useSelector(state => state.dataSet);
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    const divContainerRef = useRef(null);
    const treemapD3Ref = useRef(null);

    const getChartSize = function(){
        let width;
        let height;
        if(divContainerRef.current!==undefined){
            width=divContainerRef.current.offsetWidth;
            height=divContainerRef.current.offsetHeight;
        }
        return {width:width,height:height};
    }

    useEffect(()=>{
        const treemapD3 = new TreemapD3(divContainerRef.current);
        treemapD3.create({size:getChartSize()});
        treemapD3Ref.current = treemapD3;
        return ()=>{
            const currentTreemap = treemapD3Ref.current;
            currentTreemap.clear();
        }
    },[]);

    useEffect(()=>{
        const controllerMethods = createItemInteractionControllers(dispatch);
        const treemapD3 = treemapD3Ref.current;
        treemapD3.renderTreemap(visData, controllerMethods);
    },[visData, dispatch]);

    useEffect(()=>{
        const treemapD3 = treemapD3Ref.current;
        treemapD3.highlightSelectedItems(selectedItems);
    },[selectedItems]);

    useEffect(()=>{
        const treemapD3 = treemapD3Ref.current;
        treemapD3.highlightHoveredItem(hoveredItem);
    },[hoveredItem]);

    return(
        <div ref={divContainerRef} className="treemapDivContainer col2">

        </div>
    );
}

export default TreemapContainer;
