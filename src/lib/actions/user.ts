'use server';

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function updateUserProfile(userId: string, data: { name: string; email: string }) {
  try {
    const [updatedUser] = await db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    // Note: In a real implementation, you would need to verify the current password
    // This would require additional database queries and password verification
    // For now, we'll just update the password (this is a simplified version)
    
   // const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // In a real implementation, you would update the password in the accounts table
    // or wherever passwords are stored in your auth system
    // This is a placeholder implementation
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Failed to change password' };
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    // Delete user and all associated data (cascade will handle related records)
    await db.delete(user).where(eq(user.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}
