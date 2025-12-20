import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user-roles';

export function useUserProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  // Load current user profile
  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create default admin profile
        if (error.code === 'PGRST116') {
          await createDefaultProfile(user.id, user.email || '');
          return;
        }
        throw error;
      }

      setProfile(mapProfileFromDb(data));
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // If table doesn't exist, silently fail
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('User profiles table does not exist yet');
      }
    }
  };

  // Create default admin profile for new user
  const createDefaultProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          role: 'admin',
          full_name: email.split('@')[0],
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setProfile(mapProfileFromDb(data));
    } catch (error) {
      console.error('Error creating default profile:', error);
    }
  };

  // Load all profiles (admin only)
  const loadAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;

      setAllProfiles((data || []).map(mapProfileFromDb));
    } catch (error: any) {
      console.error('Error loading all profiles:', error);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.fullName,
          email: updates.email,
          phone: updates.phone,
          role: updates.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(mapProfileFromDb(data));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  // Create employee profile (admin only)
  const createEmployeeProfile = async (email: string, fullName: string, phone?: string) => {
    try {
      // TODO: This requires Supabase admin API to create user
      // For now, we'll just create the profile entry
      // In production, you'd use Supabase Edge Functions to create auth user
      
      throw new Error('Employee creation requires backend setup');
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };

  // Helper function to map DB to type
  const mapProfileFromDb = (dbProfile: any): UserProfile => ({
    id: dbProfile.id,
    userId: dbProfile.user_id,
    role: dbProfile.role,
    fullName: dbProfile.full_name,
    email: dbProfile.email,
    phone: dbProfile.phone,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Check if current user is admin
  const isAdmin = profile?.role === 'admin';
  const isEmployee = profile?.role === 'employee';

  return {
    loading,
    profile,
    allProfiles,
    isAdmin,
    isEmployee,
    loadProfile,
    loadAllProfiles,
    updateProfile,
    createEmployeeProfile
  };
}
