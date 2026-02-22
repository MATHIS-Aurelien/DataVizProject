import './App.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux'
// here import other dependencies
import { getDataSet } from './redux/DataSetSlice'
import ScatterplotContainer from './components/scatterplot/ScatterplotContainer';
import TreemapContainer from './components/treemap/TreemapContainer';

// a component is a piece of code which render a part of the user interface
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getDataSet());
  }, [dispatch]);

  return (
    <div className="App">
        <div id={"MultiviewContainer"} className={"row"}>
          <ScatterplotContainer xAttributeName={"medIncome"} yAttributeName={"ViolentCrimesPerPop"}/>
          <TreemapContainer />
        </div>
    </div>
  );
}

export default App;
