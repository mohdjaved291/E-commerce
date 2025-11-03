from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Product, Category
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    RelatedProductSerializer,
    CategorySerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return ProductListSerializer
        elif self.action == "retrieve":
            return ProductDetailSerializer
        return ProductSerializer

    def retrieve(self, request, *args, **kwargs):
        """Enhanced detail view with additional context"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # Get related products (same category, excluding current product)
        related_products = Product.objects.filter(
            category=instance.category, is_active=True
        ).exclude(id=instance.id)[
            :4
        ]  # Limit to 4 related products

        related_serializer = RelatedProductSerializer(related_products, many=True)

        return Response(
            {
                "product": serializer.data,
                "related_products": related_serializer.data,
                "breadcrumb": {
                    "category": instance.category.name,
                    "category_id": instance.category.id,
                    "product": instance.name,
                },
            }
        )

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        """Get products by category"""
        category_id = request.query_params.get("category_id")
        if category_id:
            products = self.queryset.filter(category_id=category_id)
            serializer = ProductListSerializer(products, many=True)
            return Response(serializer.data)
        return Response({"error": "category_id parameter required"}, status=400)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured products (you can customize this logic)"""
        # For now, return products with high stock or recently added
        featured_products = self.queryset.filter(
            Q(stock_quantity__gte=10) | Q(created_at__isnull=False)
        ).order_by("-created_at")[:6]

        serializer = ProductListSerializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search_suggestions(self, request):
        """Get search suggestions for autocomplete"""
        query = request.query_params.get("q", "")
        if len(query) >= 2:
            suggestions = Product.objects.filter(
                name__icontains=query, is_active=True
            ).values_list("name", flat=True)[:5]
            return Response({"suggestions": list(suggestions)})
        return Response({"suggestions": []})

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        """Get similar products based on category and price range"""
        try:
            product = self.get_object()
            price_min = float(product.price) * 0.7  # 30% below
            price_max = float(product.price) * 1.3  # 30% above

            similar_products = Product.objects.filter(
                category=product.category,
                price__gte=price_min,
                price__lte=price_max,
                is_active=True,
            ).exclude(id=product.id)[:6]

            serializer = RelatedProductSerializer(similar_products, many=True)
            return Response(serializer.data)

        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )
