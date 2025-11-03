from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product lists"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "category_name", "image_url", "is_in_stock"]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual product views"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    category_id = serializers.IntegerField(source="category.id", read_only=True)
    is_in_stock = serializers.ReadOnlyField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",
            "category_id",
            "category_name",
            "image_url",
            "stock_quantity",
            "stock_status",
            "is_in_stock",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_stock_status(self, obj):
        """Return human-readable stock status"""
        if obj.stock_quantity == 0:
            return "Out of Stock"
        elif obj.stock_quantity <= 5:
            return f"Only {obj.stock_quantity} left"
        elif obj.stock_quantity <= 20:
            return "Limited Stock"
        else:
            return "In Stock"


class ProductSerializer(serializers.ModelSerializer):
    """Standard serializer for general product operations"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",
            "category_name",
            "image_url",
            "stock_quantity",
            "is_in_stock",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RelatedProductSerializer(serializers.ModelSerializer):
    """Serializer for related/similar products"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "category_name", "image_url", "is_in_stock"]
