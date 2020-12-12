from django.urls import path
from . import views


urlpatterns = [
    path('user-id/', views.UserIDView.as_view(), name='user-id'),
    path('countries/', views.CountryListView.as_view(), name='countries-list'),
    path('addresses/', views.AddressListView.as_view(), name='address-list'),
    path('addresses/create/', views.AddressCreateView.as_view(), name='address-create'),
    path('addresses/<pk>/update/', views.AddressUpdateView.as_view(), name='address-update'),
    path('addresses/<pk>/delete/', views.AddressDeleteView.as_view(), name='address-delete'),
    path('products/', views.ItemListView.as_view(), name='products'),
    path('products/<pk>/', views.ItemDetailView.as_view(), name='product-detail'),
    path('add-to-cart/', views.AddtoCartView.as_view(), name='add-to-cart'),
    path('order-summary/', views.OrderDetailView.as_view(), name='order-summary'),
    path('checkout/', views.PaymentView.as_view(), name='checkout'),
    path('add-coupon/', views.AddCouponView.as_view(), name='add-coupon'),
    path('order-items/<pk>/delete/', views.OrderItemDeleteView.as_view(), name='remove-order-item'),
    path('order-items/update-quantity/', views.OrderQuantityUpdateView.as_view(), name='update-order-item-quantity'),
    path('payments/', views.PayListView.as_view(), name='payments-list'),
]