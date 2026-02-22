import './Scatterplot.css'
import { useEffect, useRef } from 'react';
import {useSelector, useDispatch} from 'react-redux'

import ScatterplotD3 from './Scatterplot-d3';

// TODO: import action methods from reducers
import { setSelectedItems } from '../../redux/ItemInteractionSlice'

function ScatterplotContainer({xAttributeName, yAttributeName}){
    const visData = useSelector(state =>state.dataSet)
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const dispatch = useDispatch();

    // every time the component re-render
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect (called each time matrix re-renders)");
    }); // if no second parameter, useEffect is called at each re-render

    const divContainerRef=useRef(null);
    const scatterplotD3Ref = useRef(null)

    const getChartSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width;// = 800;
        let height;// = 100;
        if(divContainerRef.current!==undefined){
            width=divContainerRef.current.offsetWidth;
            // width = '100%';
            height=divContainerRef.current.offsetHeight;
            // height = '100%';
        }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect [] called once the component did mount");
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("ScatterplotContainer useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect with dependency [scatterplotData, xAttribute, yAttribute, scatterplotControllerMethods], called each time scatterplotData changes...");

        const handleOnClick = function(itemData){
            dispatch(setSelectedItems([itemData]))
        }
        const handleOnMouseEnter = function(itemData){
        }
        const handleOnMouseLeave = function(){
        }

        const controllerMethods={
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave
        }

        // get the current instance of scatterplotD3 from the Ref...
        const scatterplotD3 = scatterplotD3Ref.current;
        // call renderScatterplot of ScatterplotD3...;
        scatterplotD3.renderScatterplot(visData, xAttributeName, yAttributeName, controllerMethods);
    },[visData, xAttributeName, yAttributeName, dispatch]);// if dependencies, useEffect is called after each data update, in our case only visData changes.

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        scatterplotD3.highlightSelectedItems(selectedItems);
    },[selectedItems])

    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col2">

        </div>
    )
}

export default ScatterplotContainer;