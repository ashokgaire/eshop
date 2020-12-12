import * as actionTypes from "../actions/actionTypes";
import { updateObject } from "../utility";

const initialState = {
  shoppingCart: null,
  error: null,
  loading: false
};

const cartStart = (state, action) => {
  return updateObject(state, {
    error: null,
    loading: true
  });
};

const cartSuccess = (state, action) => {
  return updateObject(state, {
    shoppingCart: action.data,
    error: null,
    loading: false
  });
};

const cartFail = (state, action) => {
  return updateObject(state, {
    error: action.error,
    loading: false
  });
};


const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CART_START:
      return cartStart(state, action);
    case actionTypes.CART_SUCCESS:
      return cartSuccess(state, action);
    case actionTypes.CART_FAIL:
      return cartFail(state, action);
    default:
      return state;
  }
};

export default cartReducer;
