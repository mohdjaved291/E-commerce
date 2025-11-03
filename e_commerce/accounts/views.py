from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.signals import user_logged_in
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserSerializer,
    AddressSerializer,
    PasswordChangeSerializer,
    UserDashboardSerializer,
)
from .models import UserProfile, Address

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create token for immediate login
        token, created = Token.objects.get_or_create(user=user)

        # Login user
        login(request, user)

        return Response(
            {
                "message": "User registered successfully",
                "user": UserSerializer(user).data,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )



class UserLoginView(APIView):
    """User login endpoint"""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get login form information"""
        return Response(
            {
                "message": "Login endpoint",
                "method": "POST",
                "required_fields": ["email", "password"],
                "description": "Send POST request with email and password to login",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """Handle user login"""
        serializer = UserLoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        # Login user
        login(request, user)
        user_logged_in.send(sender=user.__class__, request=request, user=user)

        return Response(
            {
                "message": "Login successful",
                "user": UserSerializer(user).data,
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )


class UserLogoutView(APIView):
    """User logout endpoint"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
        except Token.DoesNotExist:
            pass

        logout(request)

        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class UserDashboardView(generics.RetrieveAPIView):
    """User dashboard with comprehensive data"""

    serializer_class = UserDashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """Change user password"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Password changed successfully"}, status=status.HTTP_200_OK
        )


class AddressListCreateView(generics.ListCreateAPIView):
    """List and create user addresses"""

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, delete user addresses"""

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    """Get current user information"""
    return Response(
        {"user": UserSerializer(request.user).data, "is_authenticated": True}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def check_email_availability(request):
    """Check if email is available for registration"""
    email = request.data.get("email", "").lower().strip()

    if not email:
        return Response(
            {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    is_available = not User.objects.filter(email=email).exists()

    return Response({"email": email, "is_available": is_available})


@api_view(["POST"])
@permission_classes([AllowAny])
def check_username_availability(request):
    """Check if username is available for registration"""
    username = request.data.get("username", "").lower().strip()

    if not username:
        return Response(
            {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    is_available = not User.objects.filter(username=username).exists()

    return Response({"username": username, "is_available": is_available})


class AccountDeactivateView(APIView):
    """Deactivate user account"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")

        if not password:
            return Response(
                {"error": "Password is required to deactivate account"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(password):
            return Response(
                {"error": "Incorrect password"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate user
        request.user.is_active = False
        request.user.save()

        # Delete token
        try:
            request.user.auth_token.delete()
        except Token.DoesNotExist:
            pass

        logout(request)

        return Response(
            {"message": "Account deactivated successfully"}, status=status.HTTP_200_OK
        )
