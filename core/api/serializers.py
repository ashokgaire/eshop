from rest_framework import serializers
from django_countries.serializer_fields import CountryField
from core import models


class StringSerializer(serializers.StringRelatedField):
    def to_internal_value(self, value):
        return value

class ItemSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()

    class Meta:
        model = models.Item
        fields = [
            'id',
            'title',
            'category',
            'slug',
            'price',
            'discount_price',
            'label',
            'description',
            'image'
        ]

    def get_category(self, obj):
        return obj.get_category_display()

    def get_label(self, obj):
        return obj.get_label_display()


class VariationDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Variation
        fields = [
            'id',
            'name',
        ]
        

class ItemVariationDetailSerializer(serializers.ModelSerializer):
    variation = serializers.SerializerMethodField()

    class Meta:
        model = models.ItemVariation
        fields = [
            'id',
            'variation',
            'value',
            'attachment'
        ]

    def get_variation(self, obj):
        return VariationDetailSerializer(obj.variation).data
        


class OrderItemSerializer(serializers.ModelSerializer):
    item = serializers.SerializerMethodField()
    item_variations = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = models.OrderItem
        fields = [
            'id',
            'item',
            'item_variations',
            'final_price',
            'quantity',
        ]

    def get_item(self, obj):
        return ItemSerializer(obj.item).data

    def get_item_variations(self, obj):
        return ItemVariationDetailSerializer(obj.item_variations.all(), many=True).data

    def get_final_price(self, obj):
        return obj.get_final_price()

class CouponSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Coupon
        fields = ['id', 'code', 'amount']


class OrderSerializer(serializers.ModelSerializer):
    order_items = serializers.SerializerMethodField()
    coupon = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = models.Order
        fields = [
            'id',
            'order_items',
            'coupon',
            'total'
        ]

    def get_order_items(self, obj):
        return OrderItemSerializer(obj.items.all(), many=True).data

    def get_total(self, obj):
        return obj.get_total()

    def get_coupon(self, obj):
        if obj.coupon is not None:
            return CouponSerializer(obj.coupon).data

        return None


class ItemVariationSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.ItemVariation
        fields = (
            'id',
            'value',
            'attachment',
        )


class VariationSerializer(serializers.ModelSerializer):
    item_variations = serializers.SerializerMethodField()

    class Meta:
        model = models.Variation
        fields = (
            'id',
            'name',
            'item_variations',
        )

    def get_item_variations(self, obj):
        return ItemVariationSerializer(obj.itemvariation_set.all(), many=True).data


class ItemDetailSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()
    variations = serializers.SerializerMethodField()

    class Meta:
        model = models.Item
        fields = [
            'id',
            'title',
            'category',
            'slug',
            'price',
            'discount_price',
            'label',
            'description',
            'image',
            'variations'
        ]

    def get_category(self, obj):
        return obj.get_category_display()

    def get_label(self, obj):
        return obj.get_label_display()

    def get_variations(self, obj):
        return VariationSerializer(obj.variation_set.all(), many=True).data


class AddressSerializer(serializers.ModelSerializer):
    country = CountryField()

    class Meta:
        model = models.Address
        fields = (
            'id',
            'user',
            'street_address',
            'apartment_address',
            'country',
            'zip',
            'address_type',
            'default',
        )


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Payment
        fields = (
            'id',
            'amount',
            'timestamp',
        )