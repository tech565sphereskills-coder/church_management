from rest_framework import serializers
from .models import Profile, Member, Service, AttendanceRecord, MemberFollowUp
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'full_name')

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Profile is created automatically by signal, just need to update full_name
        user.profile.full_name = full_name
        user.profile.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'email', 'username', 'full_name', 'role', 'avatar_url', 'created_at', 'updated_at')

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'

class MemberFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberFollowUp
        fields = '__all__'
