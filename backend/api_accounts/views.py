from django.shortcuts import redirect, HttpResponse
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.hashers import check_password
from django.core.files.base import ContentFile
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from django.http import JsonResponse, HttpResponseRedirect
from django.core.exceptions import ValidationError

from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from collections import deque

from .models import Player, ExpiredTokens, Notification
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, AvatarUpdateSerializer, NotificationSerializer, DeleteAccountSerializer, TwoFactorSetupSerializer
from .validations import custom_validation, email_validation, password_validation, username_validation
from .authentication import ExpiredTokensJWTAuthentication

import os
import urllib.parse
from urllib.parse import urlencode
import requests
import pyotp
import logging
import uuid

logger = logging.getLogger(__name__)

matchmaking_queue = deque()

# Create your views here.

class UserRegistration(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            clean_data = custom_validation(request.data)
            serializer = RegisterSerializer(data=clean_data)
            if serializer.is_valid(raise_exception=True):
                user = serializer.create(clean_data)
                if user:
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_400_BAD_REQUEST)

class UserLogin(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        if request.user.is_authenticated:
            return Response({'information': 'You are already logged in! Please logout first!'}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data
        assert email_validation(data)
        assert password_validation(data)
        serializer = LoginSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.validate_user(data)
            two_factor_code = data.get('2fa_token', None)

            if user.is_two_factor_enabled and not two_factor_code:
                return Response({'require_2fa': True}, status=status.HTTP_200_OK)

            if user.is_two_factor_enabled:
                if not user.verify_totp(two_factor_code):
                    return Response({'error': 'Invalid 2FA code'}, status=status.HTTP_400_BAD_REQUEST)

            login(request, user)
            token = RefreshToken.for_user(user)
            return Response({
                'access': str(token.access_token),
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserLogout(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_authenticated:
            token = request.META.get('HTTP_AUTHORIZATION', " ").split(' ')[1]
            ExpiredTokens.objects.create(user=request.user, token=token)
            print(ExpiredTokens.objects.all())
            logout(request)
            return Response({'information': 'You have been logged out!'}, status=status.HTTP_200_OK)
        else:
            return Response({'information': 'You are not logged in!'}, status=status.HTTP_400_BAD_REQUEST)
        
class UserProfile(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [ExpiredTokensJWTAuthentication]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserView(viewsets.ModelViewSet):
    authentication_classes = [ExpiredTokensJWTAuthentication]
    queryset = Player.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        email = request.data.get('email', '')
        user = Player.objects.get(email=email)
        token = RefreshToken.for_user(user)
        response.data['refresh_token'] = str(token)
        response.data['access_token'] = str(token.access_token)
        return response
    
    def list(self, request, *args, **kwargs):
        queryset = Player.objects.exclude(id=request.user.id)
        serializer = UserSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

def join_matchmaking(request):
    user = request.user

    # check if user is already in the queue
    if user in matchmaking_queue:
        return Response({'status': 'Already in the queue'}, status=status.HTTP_200_OK)
    
    # add user to the queue
    matchmaking_queue.append(user)

    # check if there are enough players in the queue
    if len(matchmaking_queue) >= 2:
        # create a game session
        game_session_id = create_game_session(matchmaking_queue.popleft(), matchmaking_queue.popleft())

        # notify players with game session id
        return Response({'status': 'matched', 'game_session_id': game_session_id}, status=status.HTTP_200_OK)
    
    else:
        return Response({'status': 'Waiting for players'}, status=status.HTTP_200_OK)

game_sessions = {}

def create_game_session(player1, player2):
    game_session_id = str(uuid.uuid4())

    game_state = initialize_game_state()

    game_state['players'] = [player1, player2]

    game_sessions[game_session_id] = game_state

    return game_session_id

def initialize_game_state():
    game_state = {
        'players': [],
        'ball_position': {'x': 0, 'y': 0},
    }
    return game_state

def authenticated(request):
    response = JsonResponse({'authenticated': request.user.is_authenticated})
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

class OAuthCallback(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.method == 'GET':
            code = request.GET.get('code')
            data = {
                "grant_type": "authorization_code",
                "client_id": "u-s4t2ud-9c1eac966bdd22eda52986568012ba678675d5a54f0d8ec28dd59595dcf1afd1",
                "client_secret": "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",
                "code": code,
                "redirect_uri": settings.REDIRECT_URI + "/api/oauth/callback",
            }
            print("Data sent: ", data)
            auth_response = requests.post("https://api.intra.42.fr/oauth/token", data=data)
            if auth_response.status_code != 200:
                print("\t\t\tAuth callback Error: ", auth_response.json())
                return HttpResponse("Auth callback Error, please try again!")
            
            access_token = auth_response.json().get('access_token')
            if not access_token:
                return HttpResponse("Auth callback Error, error obtaining token!")

            user_response = requests.get("https://api.intra.42.fr/v2/me", headers={"Authorization": f"Bearer {access_token}"})
            user_data = user_response.json()
            print("User data: ", user_data)

            username = user_data.get('login')
            email = user_data.get('email', f'{username}@student.42wolfsburg.de')
            picture_url = user_data.get('image', {}).get('versions', {}).get('medium')

            custom_title = ''
            titles = user_data.get('titles', [])
            if titles:
                custom_title = titles[0].get('name', '').split()[0]
            user, created = Player.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'username': username,
                    'custom_title': custom_title,
                }
            )
            if created:
                print("\t\t\tUser added successfully!")
                response = requests.get(picture_url)
                if response.status_code == 200:
                    user.profile_avatar.save(f"{username}_profile_avatar.jpg", ContentFile(response.content))
            else:
                print("\t\t\tUser already exists!")                
            login(request, user)

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            html = f"""
            <!DOCTYPE html>
            <html>
            <body>
            <script>
            function setTokenAndRedirect(token) {{
                localStorage.setItem('access', token);
                window.location.href = "https://10.12.14.3";
            }}
            // Check if window.opener is not null
            if (window.opener) {{
                window.opener.postMessage({{ 'is_authenticated': true }}, '*');
                setTokenAndRedirect('{access_token}');
            }} else {{
            setTokenAndRedirect('{access_token}');
            }}
            // Close this window
            //window.close();
            </script>
            </body>
                </html>
            """
            return HttpResponse(html)
        return HttpResponse("Auth callback Error, please try again!")

class OAuthAuthorize(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        auth_url = "https://api.intra.42.fr/oauth/authorize"
        parameters = {
            "client_id": "u-s4t2ud-9c1eac966bdd22eda52986568012ba678675d5a54f0d8ec28dd59595dcf1afd1",
            "redirect_uri": settings.REDIRECT_URI + "/api/oauth/callback",
            "response_type": "code",
        }
        return HttpResponseRedirect(f"{auth_url}?{urllib.parse.urlencode(parameters)}")
    
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_avatar(request):
    user = request.user
    file = request.FILES.get('profile_avatar')
    if not file:
        return Response({'error': 'No file provided!'}, status=status.HTTP_400_BAD_REQUEST)
    user.profile_avatar.save(f"{user.username}_profile_avatar.jpg", file, save=True)
    return Response({'success': 'Avatar updated successfully!'}, status=status.HTTP_200_OK)

class UnreadNotifications(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(receiver=request.user, is_read=False)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, receiver=request.user)
        notification.is_read = True
        notification.save()
        return Response({'success': 'Notification marked as read!'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found!'}, status=status.HTTP_404_NOT_FOUND)

User = get_user_model()

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, format=None):
        serializer = DeleteAccountSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['confirm'] == 'DELETE':
                request.user.delete()
                return Response({'success': 'Account deleted successfully!'}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': 'Invalid input!'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class EnableTwoFactorAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = TwoFactorSetupSerializer(instance=user, data={'enable_2fa': True})
        if serializer.is_valid():
            user = serializer.save()
            totp_uri = pyotp.TOTP(user.totp_secret).provisioning_uri(user.email, issuer_name='PingPongTranscendence')
            return Response({'otp_uri': totp_uri}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerifyTwoFactorAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        two_factor_code = request.data.get('2fa_code')

        if not two_factor_code or not user.verify_totp(two_factor_code):
            return Response({'error': 'Invalid 2FA code'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_two_factor_enabled = True
        user.save()
        return Response({'message': '2FA verification successful'}, status=status.HTTP_200_OK)
    
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_stats(request):
    winner = request.data.get('winner')
    game_completed = request.data.get('gameCompleted', False)
    user = request.user

    if not user.is_authenticated:
        return Response({'error': 'You are not logged in!'}, status=status.HTTP_401_UNAUTHORIZED)

    # Update stats logic
    if game_completed:
        user.games_played += 1
        if winner == 'left':
            user.games_won += 1
        else:
            user.games_lost += 1
        user.save()
    return JsonResponse({'success': 'Stats updated successfully!'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not check_password(old_password, user.password):
        return Response({'error': 'Invalid old password!'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    return Response({'success': 'Password changed successfully!'}, status=status.HTTP_200_OK)