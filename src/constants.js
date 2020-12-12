const localhost = 'http://127.0.0.1:8000';

const apiUrl = '/api';

export const endpoint = `${localhost}${apiUrl}`;

export const productListURL = `${endpoint}/products/`;
export const productDetailURL = id => `${endpoint}/products/${id}/`;
export const addToCartURL = `${endpoint}/add-to-cart/`;
export const orderSumaryURL = `${endpoint}/order-summary/`;
export const checkoutURL = `${endpoint}/checkout/`;
export const addCouponURL = `${endpoint}/add-coupon/`;
export const orderItemDeleteURL = id => `${endpoint}/order-items/${id}/delete/`;
export const orderItemUpdataQuantityURL = `${endpoint}/order-items/update-quantity/`;
export const addressListURL = addressType =>
  `${endpoint}/addresses?address_type=${addressType}`;
export const addressCreateURL = `${endpoint}/addresses/create/`;
export const addressUpdateURL = id => `${endpoint}/addresses/${id}/update/`;
export const addressDeleteURL = id => `${endpoint}/addresses/${id}/delete/`;
export const getCountriesListURL = `${endpoint}/countries/`;
export const getUserIdURL = `${endpoint}/user-id/`;
export const paymentListURL = `${endpoint}/payments/`;
