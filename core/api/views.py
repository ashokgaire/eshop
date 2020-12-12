from django_countries import countries
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from core import models
from .serializers import (
    ItemSerializer, 
    OrderSerializer, 
    ItemDetailSerializer, 
    AddressSerializer,
    PaymentSerializer
)


import random
import string



def create_ref_code():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))


class UserIDView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({'userId': request.user.id}, status=status.HTTP_200_OK)


class ItemListView(ListAPIView):
    permission_classes = (AllowAny, )
    serializer_class = ItemSerializer
    queryset = models.Item.objects.all()


class ItemDetailView(RetrieveAPIView):
    permission_classes = (AllowAny, )
    serializer_class = ItemDetailSerializer
    queryset = models.Item.objects.all()


class AddtoCartView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        variations = request.data.get('variations', [])
        if slug is None:
            return Response({"message": 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

        item = get_object_or_404(models.Item, slug=slug)

        minimum_variations = models.Variation.objects.filter(item=item).count()

        if len(variations) < minimum_variations:
            return Response({"message": 'Please special the required variations'}, status=status.HTTP_400_BAD_REQUEST)

        order_item_qs = models.OrderItem.objects.filter(
            item=item,
            user=request.user,
            ordered=False
        )

        for v in variations:
            order_item_qs = order_item_qs.filter(
                item_variations__exact=v
            )

        if order_item_qs.exists():
            order_item = order_item_qs.first()
            order_item.quantity += 1
            order_item.save()
        else:
            order_item = models.OrderItem.objects.create(
                item=item,
                user=request.user,
                ordered=False
            )
            order_item.item_variations.add(*variations)
            order_item.save()

        order_qs = models.Order.objects.filter(
            user=request.user, ordered=False)
        if order_qs.exists():
            order = order_qs[0]
            # check if the order item is in the order
            if not order.items.filter(item__id=order_item.id).exists():
                order.items.add(order_item)
                # messages.info(request, "This item was added to your cart.")
                # return redirect("core:order-summary")
            return Response(status.HTTP_200_OK)

        else:
            ordered_date = timezone.now()
            order = models.Order.objects.create(
                user=request.user, ordered_date=ordered_date)
            order.items.add(order_item)
            # messages.info(request, "This item was added to your cart.")
            # return redirect("core:order-summary")
            return Response(status.HTTP_200_OK)


class OrderDetailView(RetrieveAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = OrderSerializer

    def get_object(self):
        try:
            order = models.Order.objects.get(
                user=self.request.user, ordered=False)
            return order
        except ObjectDoesNotExist:
            raise Http404("You do not have an active order")
            # return Response({"messages","You do not have an active order"}, status=status.HTTP_400_BAD_REQUEST)


class OrderItemDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated, )
    queryset = models.OrderItem.objects.all()


class OrderQuantityUpdateView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        if slug is None:
            return Response({"message", "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)
        item = get_object_or_404(models.Item, slug=slug)
        order_qs = models.Order.objects.filter(
            user=request.user,
            ordered=False
        )
        if order_qs.exists():
            order = order_qs[0]
            if order.items.filter(item__slug=item.slug).exists():
                order_item = models.OrderItem.objects.filter(
                    item=item,
                    user=request.user,
                    ordered=False
                )[0]
                if order_item.quantity > 1:
                    order_item.quantity -= 1
                    order_item.save()
                else:
                    order.items.remove(order_item)
                return Response(status=status.HTTP_200_OK)

            else:
                return Response({"message", "This item was not in your cart"}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({"message", "You do not have an active order"}, status=status.HTTP_400_BAD_REQUEST)


class PaymentView(APIView):

    def post(self, request, *args, **kwargs):
        order = models.Order.objects.get(user=request.user, ordered=False)
        userprofile = models.UserProfile.objects.get(user=request.user)
        token = request.data.get('stripeToken')
        # save = form.cleaned_data.get('save')
        # use_default = form.cleaned_data.get('use_default')
        billing_address_id = request.data.get('selectedBillingAddress')
        shipping_address_id = request.data.get('selectedShippingAddress')

        billing_address = models.Address.objects.get(
            address_type='B', id=billing_address_id)
        shipping_address = models.Address.objects.get(
            address_type='S', id=shipping_address_id)

      
            
        customer.sources.create(source=token)
        userprofile.stripe_customer_id = customer['id']
        userprofile.one_click_purchasing = True
        userprofile.save()

        amount = int(order.get_total() * 100)

        try:
            # charge the customer because we cannot charge the token more than once
            charge = stripe.Charge.create(
                amount=amount,  # cents
                currency="usd",
                customer=userprofile.stripe_customer_id
            )
            # charge once off on the token
            # charge = stripe.Charge.create(
            #     amount=amount,  # cents
            #     currency="usd",
            #     source=token
            # )

            # create the payment
            payment = models.Payment()
            payment.stripe_charge_id = charge['id']
            payment.user = request.user
            payment.amount = order.get_total()
            payment.save()

            # assign the payment to the order

            order_items = order.items.all()
            order_items.update(ordered=True)
            order.shipping_address = shipping_address
            order.billing_address = billing_address
            for item in order_items:
                item.save()

            order.ordered = True
            order.payment = payment
            order.ref_code = create_ref_code()
            order.save()

            return Response(status=status.HTTP_200_OK)

        except stripe.error.CardError as e:
            body = e.json_body
            err = body.get('error', {})
            return Response({'message': f"{err.get('message')}"}, status=status.HTTP_400_BAD_REQUEST)

        except stripe.error.RateLimitError as e:
            # Too many requests made to the API too quickly
            return Response({'message': "Rate limit error"}, status=status.HTTP_400_BAD_REQUEST)

        except stripe.error.InvalidRequestError as e:
            # Invalid parameters were supplied to Stripe's API
            print(e)
            return Response({'message': "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST)

        except stripe.error.AuthenticationError as e:
            # Authentication with Stripe's API failed
            # (maybe you changed API keys recently)
            return Response({'message': "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        except stripe.error.APIConnectionError as e:
            # Network communication with Stripe failed
            return Response({'message': "Network error"}, status=status.HTTP_400_BAD_REQUEST)

        except stripe.error.StripeError as e:
            # Display a very generic error to the user, and maybe send
            # yourself an email
            return Response({'message': "Something went wrong. You were not charged. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # send an email to ourselves
            return Response({'message': "A serious error occurred. We have been notifed."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': "Invalid data received"}, status=status.HTTP_400_BAD_REQUEST)


def get_coupon(request, code):
    try:
        coupon = Coupon.objects.get(code=code)
        return coupon
    except ObjectDoesNotExist:
        messages.info(request, "This coupon does not exist")
        return redirect("core:checkout")


class AddCouponView(APIView):
    def post(self, request, *args, **kwargs):
        code = request.data.get('code', None)
        if code is None:
            return Response({'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        order = models.Order.objects.get(user=request.user, ordered=False)
        coupon = get_object_or_404(models.Coupon, code=code)
        order.coupon = coupon
        order.save()
        return Response({'message': 'Successfully added a coupon.'}, status=status.HTTP_200_OK)


class CountryListView(APIView):

    def get(self, request, *args, **kwargs):
        return Response(countries, status=status.HTTP_200_OK)


class AddressListView(ListAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer

    def get_queryset(self):
        address_type = self.request.query_params.get('address_type', None)
        qs = models.Address.objects.filter(user=self.request.user)
        if address_type is None:
            return qs
        return qs.filter(address_type=address_type)


class AddressCreateView(CreateAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer
    queryset = models.Address.objects.all()


class AddressUpdateView(UpdateAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer
    queryset = models.Address.objects.all()


class AddressDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated, )
    queryset = models.Address.objects.all()


class PayListView(ListAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        return models.Payment.objects.filter(user=self.request.user)
