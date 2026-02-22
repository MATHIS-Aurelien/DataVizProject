import './App.css';
import { useEffect} from 'react';
import { useDispatch } from 'react-redux'
// here import other dependencies
import { getDataSet } from './redux/DataSetSlice'
import ScatterplotContainer from './components/scatterplot/ScatterplotContainer';

// a component is a piece of code which render a part of the user interface
function App() {
  const dispatch = useDispatch();
  // every time the component re-render
  useEffect(()=>{
      console.log("App useEffect (called each time App re-renders)");
  }); // if no second parameter, useEffect is called at each re-render

  useEffect(()=>{
    dispatch(getDataSet());
  },[dispatch])
  return (
    <div className="App">
        <div id={"MultiviewContainer"} className={"row"}>
          {/*<ScatterplotContainer xAttributeName={"Temperature"} yAttributeName={"RentedBikeCount"}/>
          <ScatterplotContainer xAttributeName={"Humidity"} yAttributeName={"RentedBikeCount"}/>*/}
          <ScatterplotContainer xAttributeName={"population"} yAttributeName={"ViolentCrimesPerPop"}/>
          <ScatterplotContainer xAttributeName={"medIncome"} yAttributeName={"ViolentCrimesPerPop"}/>

        </div>
    </div>
  );
}

export default App;
