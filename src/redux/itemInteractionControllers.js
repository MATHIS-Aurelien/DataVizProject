import {
  clearHoveredItem,
  selectSingleItem,
  setHoveredItem,
  setSelectedItems
} from './ItemInteractionSlice'

export function createItemInteractionControllers(dispatch) {
  return {
    handleOnClick: (itemData) => {
      dispatch(selectSingleItem(itemData));
    },
    handleOnBrushSelection: (selectedDataItems) => {
      dispatch(setSelectedItems(selectedDataItems));
    },
    handleOnMouseEnter: (itemData) => {
      dispatch(setHoveredItem(itemData));
    },
    handleOnMouseLeave: () => {
      dispatch(clearHoveredItem());
    }
  };
}
