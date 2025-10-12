"""
Supabase client configuration.
This provides access to Supabase features like Auth, Storage, Realtime, etc.
"""
from typing import Optional
from supabase import create_client, Client
from app.config import settings


_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Get or create a Supabase client instance.
    Returns None if Supabase is not configured (useful for local development).
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.supabase_url or not settings.supabase_key:
        return None

    _supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_key
    )

    return _supabase_client


def get_supabase_admin_client() -> Optional[Client]:
    """
    Get a Supabase client with admin privileges (service role key).
    Use this for server-side operations that bypass RLS policies.
    Returns None if Supabase is not configured.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
